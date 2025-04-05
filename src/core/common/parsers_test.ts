/**
 * parsers.ts モジュールのテスト
 *
 * ファイル解析関連の機能をテストします。
 */

import {
  assert,
  assertArrayIncludes,
  assertEquals,
  assertExists,
} from 'https://deno.land/std/assert/mod.ts';
import { mergeCases, parseEFFile } from './parsers.ts'; // 拡張子を追加
import { CaseData } from './types.ts'; // 拡張子を追加
import { TARGET_PROCEDURES } from './constants.ts'; // 拡張子を追加

Deno.test('parseEFFile関数: 空のコンテンツの場合は空の配列を返す', () => {
  const result = parseEFFile('');
  assertEquals(result, []);
});

Deno.test('parseEFFile関数: ヘッダー行のみの場合は空の配列を返す', () => {
  const content = 'データ列1\tデータ列2\tデータ列3';
  const result = parseEFFile(content);
  assertEquals(result, []);
});

Deno.test('parseEFFile関数: 有効なEFデータを正しくパースする', () => {
  const targetCode = TARGET_PROCEDURES[0];
  const content =
    `ヘッダー1\tヘッダー2\tヘッダー3\tヘッダー4\tヘッダー5\tヘッダー6\tヘッダー7\tヘッダー8\tヘッダー9
データ1\t12345\t20220101\t20220101\tその他\tその他\tその他\tその他\t${targetCode}`;

  const result = parseEFFile(content);

  assertEquals(result.length, 1);
  assertEquals(result[0], {
    id: '12345',
    admission: '20220101',
    discharge: '20220101',
    procedures: [targetCode],
    procedureNames: ['(名称なし)'],
  });
});

Deno.test('parseEFFile関数: 同一患者・同一入院日の複数の手術コードを適切に統合する', () => {
  const targetCode1 = TARGET_PROCEDURES[0];
  const targetCode2 = TARGET_PROCEDURES[1] || TARGET_PROCEDURES[0];
  const admissionDate = '20220101'; // 同一入院日

  const content =
    `ヘッダー1\tヘッダー2\tヘッダー3\tヘッダー4\tヘッダー5\tヘッダー6\tヘッダー7\tヘッダー8\tヘッダー9
データ1\t12345\t20220105\t${admissionDate}\tその他\tその他\tその他\tその他\t${targetCode1}
データ2\t12345\t20220105\t${admissionDate}\tその他\tその他\tその他\tその他\t${targetCode2}`;

  const result = parseEFFile(content);

  assertEquals(result.length, 1); // 同一入院なので1つの症例になる
  assertEquals(result[0].id, '12345');
  assertEquals(result[0].admission, admissionDate);
  assertArrayIncludes(result[0].procedures, [targetCode1]);
  if (targetCode1 !== targetCode2) {
    assertArrayIncludes(result[0].procedures, [targetCode2]);
    assertEquals(result[0].procedures.length, 2);
  } else {
    assertEquals(result[0].procedures.length, 1);
  }
});

Deno.test('parseEFFile関数: 同一患者・異なる入院日のデータは別々の症例としてパースする', () => {
  const targetCode1 = TARGET_PROCEDURES[0];
  const targetCode2 = TARGET_PROCEDURES[1] || TARGET_PROCEDURES[0];
  const admissionDate1 = '20220101';
  const admissionDate2 = '20220115'; // 異なる入院日

  const content =
    `ヘッダー1\tヘッダー2\tヘッダー3\tヘッダー4\tヘッダー5\tヘッダー6\tヘッダー7\tヘッダー8\tヘッダー9
データ1\t12345\t20220105\t${admissionDate1}\tその他\tその他\tその他\tその他\t${targetCode1}
データ2\t12345\t20220120\t${admissionDate2}\tその他\tその他\tその他\tその他\t${targetCode2}`;

  const result = parseEFFile(content);

  assertEquals(result.length, 2); // 異なる入院なので2つの症例になる

  const case1 = result.find((c) => c.admission === admissionDate1);
  const case2 = result.find((c) => c.admission === admissionDate2);

  assertExists(case1);
  assertEquals(case1?.id, '12345');
  assertEquals(case1?.discharge, '20220105');
  assertEquals(case1?.procedures, [targetCode1]);

  assertExists(case2);
  assertEquals(case2?.id, '12345');
  assertEquals(case2?.discharge, '20220120');
  assertEquals(case2?.procedures, [targetCode2]);
});

Deno.test('parseEFFile関数: パイプ区切りのデータを正しく処理する', () => {
  const targetCode = TARGET_PROCEDURES[0];
  const content = `ヘッダー行
データ部|データ1\t12345\t20220101\t20220101\tその他\tその他\tその他\tその他\t${targetCode}`;

  const result = parseEFFile(content);

  assertEquals(result.length, 1);
  assertEquals(result[0], {
    id: '12345',
    admission: '20220101',
    discharge: '20220101',
    procedures: [targetCode],
    procedureNames: ['(名称なし)'],
  });
});

Deno.test('parseEFFile関数: 無効な行は無視される', () => {
  const targetCode = TARGET_PROCEDURES[0];
  const content = `ヘッダー1\tヘッダー2\tヘッダー3
無効なデータ行
データ1\t12345\t20220101\t20220101\tその他\tその他\tその他\tその他\t${targetCode}`;

  const result = parseEFFile(content);

  assertEquals(result.length, 1);
});

Deno.test('parseEFFile関数: 診療明細名称（10列目）が含まれるデータを正しくパースする', () => {
  const targetCode = TARGET_PROCEDURES[0];
  const content =
    `ヘッダー1\tヘッダー2\tヘッダー3\tヘッダー4\tヘッダー5\tヘッダー6\tヘッダー7\tヘッダー8\tヘッダー9\tヘッダー10\tヘッダー11
データ1\t12345\t20220101\t20220101\tその他\tその他\tその他\tその他\t${targetCode}\tその他\t手術名A`; // 11列目に名称

  const result = parseEFFile(content);

  assertEquals(result.length, 1);
  assertEquals(result[0], {
    id: '12345',
    admission: '20220101',
    discharge: '20220101',
    procedures: [targetCode],
    procedureNames: ['手術名A'], // 名称が取得されている
  });
});

Deno.test('parseEFFile関数: データ識別番号（2列目）が空の行は無視される', () => {
  const targetCode = TARGET_PROCEDURES[0];
  const content =
    `ヘッダー1\tヘッダー2\tヘッダー3\tヘッダー4\tヘッダー5\tヘッダー6\tヘッダー7\tヘッダー8\tヘッダー9
データ1\t\t20220101\t20220101\tその他\tその他\tその他\tその他\t${targetCode}`; // IDが空

  const result = parseEFFile(content);
  assertEquals(result, []);
});

Deno.test('parseEFFile関数: 行為明細番号（7列目）が"000"の行は無視される', () => {
  const targetCode = TARGET_PROCEDURES[0];
  const content =
    `ヘッダー1\tヘッダー2\tヘッダー3\tヘッダー4\tヘッダー5\tヘッダー6\tヘッダー7\tヘッダー8\tヘッダー9
データ1\t12345\t20220101\t20220101\tその他\tその他\t000\tその他\t${targetCode}`; // 行為明細番号が000

  const result = parseEFFile(content);
  assertEquals(result, []); // 000の行は処理されない
});

Deno.test('parseEFFile関数: 空白のみの行は無視される', () => {
  const targetCode = TARGET_PROCEDURES[0];
  const content =
    `ヘッダー1\tヘッダー2\tヘッダー3\tヘッダー4\tヘッダー5\tヘッダー6\tヘッダー7\tヘッダー8\tヘッダー9

データ1\t12345\t20220101\t20220101\tその他\tその他\tその他\tその他\t${targetCode}
      `; // 空白行と末尾の空白のみの行

  const result = parseEFFile(content);
  assertEquals(result.length, 1); // 有効なデータ行のみ処理される
});

Deno.test('parseEFFile関数: 必須項目が欠落している行でも、IDと入院日があれば基本情報は保持される（退院日更新のため）', () => {
  const content = `ヘッダー1\tヘッダー2\tヘッダー3\tヘッダー4
データ1\t12345\t20220105\t20220101`; // 手術コードなどがない

  const result = parseEFFile(content);
  assertEquals(result.length, 1);
  assertEquals(result[0], {
    id: '12345',
    admission: '20220101',
    discharge: '20220105',
    procedures: [], // 手術コードはない
    procedureNames: [],
  });
});

// --- mergeCases関数のテスト ---

Deno.test('mergeCases関数: 空の配列同士をマージすると空の配列を返す', () => {
  const existingCases: CaseData[] = [];
  const newCases: CaseData[] = [];
  const result = mergeCases(existingCases, newCases);
  assertEquals(result, []);
});

Deno.test('mergeCases関数: 同一症例（ID+入院日）のデータを適切にマージする（退院日更新、手術追加）', () => {
  const existingCases: CaseData[] = [
    {
      id: '12345',
      admission: '20220101',
      discharge: '00000000', // 未確定
      procedures: ['123456'],
      procedureNames: ['手術A'],
    },
  ];
  const newCases: CaseData[] = [
    {
      id: '12345',
      admission: '20220101',
      discharge: '20220105', // 確定
      procedures: ['789012'],
      procedureNames: ['手術B'],
    },
  ];

  const result = mergeCases(existingCases, newCases);

  assertEquals(result.length, 1);
  assertEquals(result[0].id, '12345');
  assertEquals(result[0].admission, '20220101');
  assertEquals(result[0].discharge, '20220105'); // 退院日が更新されている
  assertEquals(result[0].procedures, ['123456', '789012']); // 手術が追加されている
  assertEquals(result[0].procedureNames, ['手術A', '手術B']);
});

Deno.test('mergeCases関数: 異なる症例（ID+入院日）のデータを正しく追加する', () => {
  const existingCases: CaseData[] = [
    {
      id: '12345',
      admission: '20220101',
      discharge: '20220105',
      procedures: ['123456'],
    },
  ];
  const newCases: CaseData[] = [
    {
      id: '12345', // 同じID
      admission: '20220115', // 異なる入院日
      discharge: '20220120',
      procedures: ['789012'],
    },
    {
      id: '67890', // 異なるID
      admission: '20220201',
      discharge: '20220205',
      procedures: ['345678'],
    },
  ];

  const result = mergeCases(existingCases, newCases);

  assertEquals(result.length, 3); // 既存1 + 新規2 = 3症例
  assertExists(result.find((c) => c.id === '12345' && c.admission === '20220101'));
  assertExists(result.find((c) => c.id === '12345' && c.admission === '20220115'));
  assertExists(result.find((c) => c.id === '67890' && c.admission === '20220201'));
});

Deno.test('mergeCases関数: 同一症例の手術コードの重複が排除される', () => {
  const existingCases: CaseData[] = [
    {
      id: '12345',
      admission: '20220101',
      discharge: '20220105',
      procedures: ['123456', '789012'],
      procedureNames: ['手術A', '手術B'],
    },
  ];
  const newCases: CaseData[] = [
    {
      id: '12345',
      admission: '20220101',
      discharge: '20220105',
      procedures: ['789012', '345678'], // 789012が重複
      procedureNames: ['手術B', '手術C'],
    },
  ];

  const result = mergeCases(existingCases, newCases);

  assertEquals(result.length, 1);
  assertEquals(result[0].procedures, ['123456', '789012', '345678']); // 重複排除
  assertEquals(result[0].procedureNames, ['手術A', '手術B', '手術C']); // 名称も対応
});

Deno.test('mergeCases関数: 退院日が確定している既存データに、未確定の新規データがきても更新しない', () => {
  const existingCases: CaseData[] = [
    {
      id: '12345',
      admission: '20220101',
      discharge: '20220105', // 確定済み
      procedures: ['123456'],
    },
  ];
  const newCases: CaseData[] = [
    {
      id: '12345',
      admission: '20220101',
      discharge: '00000000', // 未確定
      procedures: ['789012'],
    },
  ];
  const result = mergeCases(existingCases, newCases);
  assertEquals(result[0].discharge, '20220105'); // 更新されない
  assertArrayIncludes(result[0].procedures, ['123456', '789012']);
});

Deno.test('mergeCases関数: 退院日が両方未確定の場合は未確定のまま', () => {
  const existingCases: CaseData[] = [
    {
      id: '12345',
      admission: '20220101',
      discharge: '00000000',
      procedures: ['123456'],
    },
  ];
  const newCases: CaseData[] = [
    {
      id: '12345',
      admission: '20220101',
      discharge: '00000000',
      procedures: ['789012'],
    },
  ];
  const result = mergeCases(existingCases, newCases);
  assertEquals(result[0].discharge, '00000000'); // 未確定のまま
  assertArrayIncludes(result[0].procedures, ['123456', '789012']);
});

Deno.test('mergeCases関数: より新しい退院日で更新される', () => {
  const existingCases: CaseData[] = [
    {
      id: '12345',
      admission: '20220101',
      discharge: '20220105', // 古い退院日
      procedures: ['123456'],
    },
  ];
  const newCases: CaseData[] = [
    {
      id: '12345',
      admission: '20220101',
      discharge: '20220110', // 新しい退院日
      procedures: ['789012'],
    },
  ];
  const result = mergeCases(existingCases, newCases);
  assertEquals(result[0].discharge, '20220110'); // 新しい日付で更新
});

Deno.test('mergeCases関数: 異なる症例間でデータが混ざらないことを確認', () => {
  const existingCases: CaseData[] = [
    { id: 'A', admission: '20220101', discharge: '20220105', procedures: ['P1'] },
    { id: 'B', admission: '20220110', discharge: '00000000', procedures: ['P2'] },
  ];
  const newCases: CaseData[] = [
    { id: 'A', admission: '20220101', discharge: '20220105', procedures: ['P3'] }, // Aの追加手術
    { id: 'B', admission: '20220110', discharge: '20220115', procedures: ['P4'] }, // Bの退院日確定と追加手術
    { id: 'A', admission: '20220201', discharge: '20220205', procedures: ['P5'] }, // Aの別入院
  ];

  const result = mergeCases(existingCases, newCases);
  assertEquals(result.length, 3);

  const caseA1 = result.find((c) => c.id === 'A' && c.admission === '20220101');
  const caseB1 = result.find((c) => c.id === 'B' && c.admission === '20220110');
  const caseA2 = result.find((c) => c.id === 'A' && c.admission === '20220201');

  assertExists(caseA1);
  assertEquals(caseA1?.discharge, '20220105');
  assertEquals(caseA1?.procedures, ['P1', 'P3']);

  assertExists(caseB1);
  assertEquals(caseB1?.discharge, '20220115');
  assertEquals(caseB1?.procedures, ['P2', 'P4']);

  assertExists(caseA2);
  assertEquals(caseA2?.discharge, '20220205');
  assertEquals(caseA2?.procedures, ['P5']);
});
