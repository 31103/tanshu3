/**
 * parsers.ts モジュールのテスト
 *
 * ファイル解析関連の機能をテストします。
 */

import { mergeCases, parseEFFile } from '../../../src/core/common/parsers.js';
import { CaseData } from '../../../src/core/common/types.js';
import { TARGET_PROCEDURES } from '../../../src/core/common/constants.js';

describe('parseEFFile関数', () => {
  it('空のコンテンツの場合は空の配列を返す', () => {
    const result = parseEFFile('');
    expect(result).toEqual([]);
  });

  it('ヘッダー行のみの場合は空の配列を返す', () => {
    const content = 'データ列1\tデータ列2\tデータ列3';
    const result = parseEFFile(content);
    expect(result).toEqual([]);
  });

  it('有効なEFデータを正しくパースする', () => {
    const targetCode = TARGET_PROCEDURES[0];
    const content =
      `ヘッダー1\tヘッダー2\tヘッダー3\tヘッダー4\tヘッダー5\tヘッダー6\tヘッダー7\tヘッダー8\tヘッダー9
データ1\t12345\t20220101\t20220101\tその他\tその他\tその他\tその他\t${targetCode}`;

    const result = parseEFFile(content);

    expect(result.length).toBe(1);
    expect(result[0]).toEqual({
      id: '12345',
      admission: '20220101',
      discharge: '20220101',
      procedures: [targetCode],
      procedureNames: ['(名称なし)'],
    });
  });

  it('同一患者・同一入院日の複数の手術コードを適切に統合する', () => {
    const targetCode1 = TARGET_PROCEDURES[0];
    const targetCode2 = TARGET_PROCEDURES[1] || TARGET_PROCEDURES[0];
    const admissionDate = '20220101'; // 同一入院日

    const content =
      `ヘッダー1\tヘッダー2\tヘッダー3\tヘッダー4\tヘッダー5\tヘッダー6\tヘッダー7\tヘッダー8\tヘッダー9
データ1\t12345\t20220105\t${admissionDate}\tその他\tその他\tその他\tその他\t${targetCode1}
データ2\t12345\t20220105\t${admissionDate}\tその他\tその他\tその他\tその他\t${targetCode2}`;

    const result = parseEFFile(content);

    expect(result.length).toBe(1); // 同一入院なので1つの症例になる
    expect(result[0].id).toBe('12345');
    expect(result[0].admission).toBe(admissionDate);
    expect(result[0].procedures).toContain(targetCode1);
    if (targetCode1 !== targetCode2) {
      expect(result[0].procedures).toContain(targetCode2);
      expect(result[0].procedures.length).toBe(2);
    } else {
      expect(result[0].procedures.length).toBe(1);
    }
  });

  it('同一患者・異なる入院日のデータは別々の症例としてパースする', () => {
    const targetCode1 = TARGET_PROCEDURES[0];
    const targetCode2 = TARGET_PROCEDURES[1] || TARGET_PROCEDURES[0];
    const admissionDate1 = '20220101';
    const admissionDate2 = '20220115'; // 異なる入院日

    const content =
      `ヘッダー1\tヘッダー2\tヘッダー3\tヘッダー4\tヘッダー5\tヘッダー6\tヘッダー7\tヘッダー8\tヘッダー9
データ1\t12345\t20220105\t${admissionDate1}\tその他\tその他\tその他\tその他\t${targetCode1}
データ2\t12345\t20220120\t${admissionDate2}\tその他\tその他\tその他\tその他\t${targetCode2}`;

    const result = parseEFFile(content);

    expect(result.length).toBe(2); // 異なる入院なので2つの症例になる

    const case1 = result.find((c) => c.admission === admissionDate1);
    const case2 = result.find((c) => c.admission === admissionDate2);

    expect(case1).toBeDefined();
    expect(case1?.id).toBe('12345');
    expect(case1?.discharge).toBe('20220105');
    expect(case1?.procedures).toEqual([targetCode1]);

    expect(case2).toBeDefined();
    expect(case2?.id).toBe('12345');
    expect(case2?.discharge).toBe('20220120');
    expect(case2?.procedures).toEqual([targetCode2]);
  });

  it('パイプ区切りのデータを正しく処理する', () => {
    const targetCode = TARGET_PROCEDURES[0];
    const content = `ヘッダー行
データ部|データ1\t12345\t20220101\t20220101\tその他\tその他\tその他\tその他\t${targetCode}`;

    const result = parseEFFile(content);

    expect(result.length).toBe(1);
    expect(result[0]).toEqual({
      id: '12345',
      admission: '20220101',
      discharge: '20220101',
      procedures: [targetCode],
      procedureNames: ['(名称なし)'],
    });
  });

  it('無効な行は無視される', () => {
    const targetCode = TARGET_PROCEDURES[0];
    const content = `ヘッダー1\tヘッダー2\tヘッダー3
無効なデータ行
データ1\t12345\t20220101\t20220101\tその他\tその他\tその他\tその他\t${targetCode}`;

    const result = parseEFFile(content);

    expect(result.length).toBe(1);
  });

  it('診療明細名称（10列目）が含まれるデータを正しくパースする', () => {
    const targetCode = TARGET_PROCEDURES[0];
    const content =
      `ヘッダー1\tヘッダー2\tヘッダー3\tヘッダー4\tヘッダー5\tヘッダー6\tヘッダー7\tヘッダー8\tヘッダー9\tヘッダー10\tヘッダー11
データ1\t12345\t20220101\t20220101\tその他\tその他\tその他\tその他\t${targetCode}\tその他\t手術名A`; // 11列目に名称

    const result = parseEFFile(content);

    expect(result.length).toBe(1);
    expect(result[0]).toEqual({
      id: '12345',
      admission: '20220101',
      discharge: '20220101',
      procedures: [targetCode],
      procedureNames: ['手術名A'], // 名称が取得されている
    });
  });

  it('データ識別番号（2列目）が空の行は無視される', () => {
    const targetCode = TARGET_PROCEDURES[0];
    const content =
      `ヘッダー1\tヘッダー2\tヘッダー3\tヘッダー4\tヘッダー5\tヘッダー6\tヘッダー7\tヘッダー8\tヘッダー9
データ1\t\t20220101\t20220101\tその他\tその他\tその他\tその他\t${targetCode}`; // IDが空

    const result = parseEFFile(content);
    expect(result).toEqual([]);
  });

  it('行為明細番号（7列目）が"000"の行は無視される', () => {
    const targetCode = TARGET_PROCEDURES[0];
    const content =
      `ヘッダー1\tヘッダー2\tヘッダー3\tヘッダー4\tヘッダー5\tヘッダー6\tヘッダー7\tヘッダー8\tヘッダー9
データ1\t12345\t20220101\t20220101\tその他\tその他\t000\tその他\t${targetCode}`; // 行為明細番号が000

    const result = parseEFFile(content);
    expect(result).toEqual([]); // 000の行は処理されない
  });

  it('空白のみの行は無視される', () => {
    const targetCode = TARGET_PROCEDURES[0];
    const content =
      `ヘッダー1\tヘッダー2\tヘッダー3\tヘッダー4\tヘッダー5\tヘッダー6\tヘッダー7\tヘッダー8\tヘッダー9

データ1\t12345\t20220101\t20220101\tその他\tその他\tその他\tその他\t${targetCode}
      `; // 空白行と末尾の空白のみの行

    const result = parseEFFile(content);
    expect(result.length).toBe(1); // 有効なデータ行のみ処理される
  });

  it('必須項目が欠落している行でも、IDと入院日があれば基本情報は保持される（退院日更新のため）', () => {
    const content = `ヘッダー1\tヘッダー2\tヘッダー3\tヘッダー4
データ1\t12345\t20220105\t20220101`; // 手術コードなどがない

    const result = parseEFFile(content);
    expect(result.length).toBe(1);
    expect(result[0]).toEqual({
      id: '12345',
      admission: '20220101',
      discharge: '20220105',
      procedures: [], // 手術コードはない
      procedureNames: [],
    });
  });
});

describe('mergeCases関数', () => {
  it('空の配列同士をマージすると空の配列を返す', () => {
    const existingCases: CaseData[] = [];
    const newCases: CaseData[] = [];
    const result = mergeCases(existingCases, newCases);
    expect(result).toEqual([]);
  });

  it('同一症例（ID+入院日）のデータを適切にマージする（退院日更新、手術追加）', () => {
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

    expect(result.length).toBe(1);
    expect(result[0].id).toBe('12345');
    expect(result[0].admission).toBe('20220101');
    expect(result[0].discharge).toBe('20220105'); // 退院日が更新されている
    expect(result[0].procedures).toEqual(['123456', '789012']); // 手術が追加されている
    expect(result[0].procedureNames).toEqual(['手術A', '手術B']);
  });

  it('異なる症例（ID+入院日）のデータを正しく追加する', () => {
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

    expect(result.length).toBe(3); // 既存1 + 新規2 = 3症例
    expect(result.find((c) => c.id === '12345' && c.admission === '20220101')).toBeTruthy();
    expect(result.find((c) => c.id === '12345' && c.admission === '20220115')).toBeTruthy();
    expect(result.find((c) => c.id === '67890' && c.admission === '20220201')).toBeTruthy();
  });

  it('同一症例の手術コードの重複が排除される', () => {
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

    expect(result.length).toBe(1);
    expect(result[0].procedures).toEqual(['123456', '789012', '345678']); // 重複排除
    expect(result[0].procedureNames).toEqual(['手術A', '手術B', '手術C']); // 名称も対応
  });

  it('退院日が確定している既存データに、未確定の新規データがきても更新しない', () => {
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
    expect(result[0].discharge).toBe('20220105'); // 更新されない
    expect(result[0].procedures).toContain('123456');
    expect(result[0].procedures).toContain('789012');
  });

  it('退院日が両方未確定の場合は未確定のまま', () => {
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
    expect(result[0].discharge).toBe('00000000'); // 未確定のまま
    expect(result[0].procedures).toContain('123456');
    expect(result[0].procedures).toContain('789012');
  });

  it('より新しい退院日で更新される', () => {
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
    expect(result[0].discharge).toBe('20220110'); // 新しい日付で更新
  });

  it('異なる症例間でデータが混ざらないことを確認', () => {
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
    expect(result.length).toBe(3);

    const caseA1 = result.find((c) => c.id === 'A' && c.admission === '20220101');
    const caseB1 = result.find((c) => c.id === 'B' && c.admission === '20220110');
    const caseA2 = result.find((c) => c.id === 'A' && c.admission === '20220201');

    expect(caseA1).toBeDefined();
    expect(caseA1?.discharge).toBe('20220105');
    expect(caseA1?.procedures).toEqual(['P1', 'P3']);

    expect(caseB1).toBeDefined();
    expect(caseB1?.discharge).toBe('20220115');
    expect(caseB1?.procedures).toEqual(['P2', 'P4']);

    expect(caseA2).toBeDefined();
    expect(caseA2?.discharge).toBe('20220205');
    expect(caseA2?.procedures).toEqual(['P5']);
  });
});
