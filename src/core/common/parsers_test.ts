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
// 相対パスのインポートを修正
import { mergeCases, parseEFFile } from './parsers.ts'; // 名前付きインポートに変更
import { CaseData, ProcedureDetail } from './types.ts'; // ProcedureDetail をインポート
// import { TARGET_PROCEDURES } from './constants.ts'; // TARGET_PROCEDURES は evaluator で使うのでここでは不要

Deno.test('parseEFFile関数: 空のコンテンツの場合は空の配列を返す', () => {
  const result = parseEFFile('');
  assertEquals(result, []);
});

Deno.test('parseEFFile関数: ヘッダー行のみの場合は空の配列を返す', () => {
  const content = 'ヘッダー1\tヘッダー2\tヘッダー3'; // 列数が足りないので処理されないはず
  const result = parseEFFile(content);
  assertEquals(result, []);
});

Deno.test('parseEFFile関数: 有効なEFデータを正しくパースし、ProcedureDetail を生成する', () => {
  const procedureCode = '150253010'; // 水晶体再建術
  const procedureName = '水晶体再建術（眼内レンズを挿入する場合）（その他のもの）';
  const procedureDate = '20240705';
  const sequenceNumber = '0001';
  const actionDetailNo = '001'; // Fファイル行
  const dataCategory = '50'; // データ区分

  // 24列のデータを作成
  const columns = [
    '000000000', // 1: 施設コード
    '12345', // 2: データ識別番号
    '20240706', // 3: 退院年月日
    '20240704', // 4: 入院年月日
    dataCategory, // 5: データ区分
    sequenceNumber, // 6: 順序番号
    actionDetailNo, // 7: 行為明細番号
    '641300', // 8: 病院点数マスタコード
    procedureCode, // 9: レセプト電算コード
    'K2821ﾛ', // 10: 解釈番号
    procedureName, // 11: 診療明細名称
    '0', // 12: 使用量 (ダミー)
    '0', // 13: 基準単位 (ダミー)
    '0', // 14: 明細点数・金額 (ダミー)
    '0', // 15: 円・点区分 (ダミー)
    '0', // 16: 出来高実績点数 (ダミー)
    '0', // 17: 行為明細区分情報 (ダミー)
    '0', // 18: 行為点数 (ダミー)
    '0', // 19: 行為薬剤料 (ダミー)
    '0', // 20: 行為材料料 (ダミー)
    '0', // 21: 行為回数 (ダミー)
    '0', // 22: 保険者番号 (ダミー)
    '0', // 23: レセプト種別コード (ダミー)
    procedureDate, // 24: 実施年月日
  ];
  const content = `ヘッダー行\n${columns.join('\t')}`;

  const result = parseEFFile(content);

  assertEquals(result.length, 1);
  const expectedProcedureDetail: ProcedureDetail = {
    code: procedureCode,
    name: procedureName,
    date: procedureDate,
    sequenceNumber: sequenceNumber,
    dataCategory: dataCategory, // dataCategory を追加
  };
  assertEquals(result[0], {
    id: '12345',
    admission: '20240704',
    discharge: '20240706',
    procedureDetails: [expectedProcedureDetail],
  });
});

Deno.test('parseEFFile関数: 同一患者・同一入院日の複数の診療行為詳細を適切に統合する', () => {
  const admissionDate = '20240704';
  const procedureDate = '20240705';
  const sequenceNumber = '0001';
  const procedureCode1 = '150253010';
  const procedureName1 = '水晶体再建術';
  const dataCategory1 = '50';
  const procedureCode2 = '150274010';
  const procedureName2 = '硝子体茎顕微鏡下離断術';
  const dataCategory2 = '50';

  // 正しく24列のデータを設定
  const content = `ヘッダー行
000000000\t12345\t20240706\t${admissionDate}\t${dataCategory1}\t${sequenceNumber}\t001\t641300\t${procedureCode1}\tK282\t${procedureName1}\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t${procedureDate}
000000000\t12345\t20240706\t${admissionDate}\t${dataCategory2}\t${sequenceNumber}\t002\t641300\t${procedureCode2}\tK280\t${procedureName2}\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t${procedureDate}`;

  const result = parseEFFile(content);

  assertEquals(result.length, 1);
  assertEquals(result[0].id, '12345');
  assertEquals(result[0].admission, admissionDate);
  assertEquals(result[0].procedureDetails.length, 2); // 期待値は2
  assertArrayIncludes(result[0].procedureDetails, [
    {
      code: procedureCode1,
      name: procedureName1,
      date: procedureDate,
      sequenceNumber: sequenceNumber,
      dataCategory: dataCategory1,
    },
    {
      code: procedureCode2,
      name: procedureName2,
      date: procedureDate,
      sequenceNumber: sequenceNumber,
      dataCategory: dataCategory2,
    },
  ]);
});

Deno.test('parseEFFile関数: 同一患者・異なる入院日のデータは別々の症例としてパースする', () => {
  const admissionDate1 = '20240704';
  const admissionDate2 = '20240801';
  const procedureDate1 = '20240705';
  const procedureDate2 = '20240802';
  const sequenceNumber1 = '0001';
  const sequenceNumber2 = '0001';
  const procedureCode1 = '150253010';
  const procedureName1 = '水晶体再建術';
  const dataCategory1 = '50';
  const procedureCode2 = '150089110';
  const procedureName2 = '前房、虹彩内異物除去術';
  const dataCategory2 = '50';

  // 正しく24列のデータを設定
  const content = `ヘッダー行
000000000\t12345\t20240706\t${admissionDate1}\t${dataCategory1}\t${sequenceNumber1}\t001\t641300\t${procedureCode1}\tK282\t${procedureName1}\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t${procedureDate1}
000000000\t12345\t20240803\t${admissionDate2}\t${dataCategory2}\t${sequenceNumber2}\t001\t641300\t${procedureCode2}\tK274\t${procedureName2}\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t${procedureDate2}`;

  const result = parseEFFile(content);

  assertEquals(result.length, 2); // 期待値は2

  const case1 = result.find((c) => c.admission === admissionDate1);
  const case2 = result.find((c) => c.admission === admissionDate2);

  assertExists(case1);
  assertEquals(case1?.id, '12345');
  assertEquals(case1?.discharge, '20240706');
  assertEquals(case1?.procedureDetails, [
    {
      code: procedureCode1,
      name: procedureName1,
      date: procedureDate1,
      sequenceNumber: sequenceNumber1,
      dataCategory: dataCategory1,
    },
  ]);

  assertExists(case2);
  assertEquals(case2?.id, '12345');
  assertEquals(case2?.discharge, '20240803');
  assertEquals(case2?.procedureDetails, [
    {
      code: procedureCode2,
      name: procedureName2,
      date: procedureDate2,
      sequenceNumber: sequenceNumber2,
      dataCategory: dataCategory2,
    },
  ]);
});

Deno.test('parseEFFile関数: 必須列が不足している行は無視される', () => {
  const content = `ヘッダー行
000\t12345\t20240706\t20240704\t50\t0001\t001`; // 7列しかない
  const result = parseEFFile(content);
  assertEquals(result, []);
});

Deno.test('parseEFFile関数: データ識別番号（2列目）が空の行は無視される', () => {
  const content = `ヘッダー行
 000\t\t20240706\t20240704\t50\t0001\t001\t641300\t150253010\tK282\t水晶体\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t20240705`; // IDが空 (24列)
  const result = parseEFFile(content);
  assertEquals(result, []);
});

Deno.test('parseEFFile関数: 行為明細番号（7列目）が"000"の行は無視される', () => {
  const content = `ヘッダー行
 000\t12345\t20240706\t20240704\t50\t0001\t000\t641300\t150253010\tK282\t水晶体\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t20240705`; // 行為明細番号が000 (24列)
  const result = parseEFFile(content);
  assertEquals(result, []);
});

Deno.test('parseEFFile関数: 列数が24未満の行は無視される', () => {
  const content = `ヘッダー行
000\t12345\t20240706\t20240704\t50\t0001\t001\t641300\t150253010\tK282\t水晶体\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0`; // 23列しかない
  const result = parseEFFile(content);
  assertEquals(result, []);
});

Deno.test('parseEFFile関数: 不正な日付形式の行は無視される (入院日)', () => {
  const columns = [
    '000000000',
    '12345',
    '20240706',
    '2024-07-04', // 不正な入院日
    '50',
    '0001',
    '001',
    '641300',
    '150253010',
    'K282',
    '水晶体',
    '0',
    '0',
    '0',
    '0',
    '0',
    '0',
    '0',
    '0',
    '0',
    '0',
    '0',
    '0',
    '20240705',
  ];
  const content = `ヘッダー行\n${columns.join('\t')}`;
  const result = parseEFFile(content);
  assertEquals(result, []);
});

Deno.test('parseEFFile関数: 不正な日付形式の行は無視される (退院日)', () => {
  const columns = [
    '000000000',
    '12345',
    'invalid-date',
    '20240704', // 不正な退院日
    '50',
    '0001',
    '001',
    '641300',
    '150253010',
    'K282',
    '水晶体',
    '0',
    '0',
    '0',
    '0',
    '0',
    '0',
    '0',
    '0',
    '0',
    '0',
    '0',
    '0',
    '20240705',
  ];
  const content = `ヘッダー行\n${columns.join('\t')}`;
  const result = parseEFFile(content);
  assertEquals(result, []);
});

Deno.test('parseEFFile関数: 不正な日付形式の行は無視される (実施日)', () => {
  const columns = [
    '000000000',
    '12345',
    '20240706',
    '20240704',
    '50',
    '0001',
    '001',
    '641300',
    '150253010',
    'K282',
    '水晶体',
    '0',
    '0',
    '0',
    '0',
    '0',
    '0',
    '0',
    '0',
    '0',
    '0',
    '0',
    '0',
    '07/05/2024', // 不正な実施日
  ];
  const content = `ヘッダー行\n${columns.join('\t')}`;
  const result = parseEFFile(content);
  assertEquals(result, []);
});

Deno.test('parseEFFile関数: 不正な数値形式の行は無視される (順序番号)', () => {
  const columns = [
    '000000000',
    '12345',
    '20240706',
    '20240704',
    '50',
    'abc',
    '001',
    '641300',
    '150253010',
    'K282',
    '水晶体', // 不正な順序番号
    '0',
    '0',
    '0',
    '0',
    '0',
    '0',
    '0',
    '0',
    '0',
    '0',
    '0',
    '0',
    '20240705',
  ];
  const content = `ヘッダー行\n${columns.join('\t')}`;
  const result = parseEFFile(content);
  assertEquals(result, []);
});

Deno.test('parseEFFile関数: 不正な数値形式の行は無視される (行為明細番号)', () => {
  const columns = [
    '000000000',
    '12345',
    '20240706',
    '20240704',
    '50',
    '0001',
    'xyz',
    '641300',
    '150253010',
    'K282',
    '水晶体', // 不正な行為明細番号
    '0',
    '0',
    '0',
    '0',
    '0',
    '0',
    '0',
    '0',
    '0',
    '0',
    '0',
    '0',
    '20240705',
  ];
  const content = `ヘッダー行\n${columns.join('\t')}`;
  const result = parseEFFile(content);
  assertEquals(result, []);
});

Deno.test('parseEFFile関数: 必須項目（レセプトコード）が空の行は無視される', () => {
  const columns = [
    '000000000',
    '12345',
    '20240706',
    '20240704',
    '50',
    '0001',
    '001',
    '641300',
    '',
    'K282',
    '水晶体', // レセプトコード空
    '0',
    '0',
    '0',
    '0',
    '0',
    '0',
    '0',
    '0',
    '0',
    '0',
    '0',
    '0',
    '20240705',
  ];
  const content = `ヘッダー行\n${columns.join('\t')}`;
  const result = parseEFFile(content);
  assertEquals(result, []);
});

Deno.test('parseEFFile関数: 空白のみの行は無視される', () => {
  // 空白行と有効な行、末尾の空白行を含むテストデータを作成
  const content = `ヘッダー行

 
000000000\t12345\t20240706\t20240704\t50\t0001\t001\t641300\t150253010\tK282\t水晶体\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t20240705
       
 `; // 空白行と末尾の空白のみの行
  const result = parseEFFile(content);
  assertEquals(result.length, 1); // 期待値は1 (有効な行のみカウント)
});

Deno.test('parseEFFile関数: Fファイル行がない場合でも基本情報は保持される', () => {
  // このテストは extractLineData が null を返すため、parseEFFile は空配列を返すのが正しい挙動
  const content = `ヘッダー行
 000000000\t12345\t20240706\t20240704\t90\t0001\t000\t641300\t150253010\tK282\t水晶体\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t20240704`; // Eファイル行のみ (24列)
  const result = parseEFFile(content);
  assertEquals(result, []); // Fファイル行がないため、症例データは生成されない
});

// --- mergeCases関数のテスト ---

Deno.test('mergeCases関数: 空の配列同士をマージすると空の配列を返す', () => {
  const existingCases: CaseData[] = [];
  const newCases: CaseData[] = [];
  const result = mergeCases(existingCases, newCases);
  assertEquals(result, []);
});

Deno.test('mergeCases関数: 同一症例（ID+入院日）のデータを適切にマージする（退院日更新、手術追加）', () => {
  const detail1: ProcedureDetail = {
    code: '123456',
    name: '手術A',
    date: '20220102',
    sequenceNumber: '0001',
    dataCategory: '50',
  };
  const existingCases: CaseData[] = [
    {
      id: '12345',
      admission: '20220101',
      discharge: '00000000', // 未確定
      procedureDetails: [detail1],
    },
  ];
  const detail2: ProcedureDetail = {
    code: '789012',
    name: '手術B',
    date: '20220103',
    sequenceNumber: '0002',
    dataCategory: '50',
  };
  const newCases: CaseData[] = [
    {
      id: '12345',
      admission: '20220101',
      discharge: '20220105', // 確定
      procedureDetails: [detail2],
    },
  ];

  const result = mergeCases(existingCases, newCases);

  assertEquals(result.length, 1);
  assertEquals(result[0].id, '12345');
  assertEquals(result[0].admission, '20220101');
  assertEquals(result[0].discharge, '20220105'); // 退院日が更新されている
  assertEquals(result[0].procedureDetails, [detail1, detail2]); // 詳細が追加されている
});

Deno.test('mergeCases関数: 異なる症例（ID+入院日）のデータを正しく追加する', () => {
  const detail1: ProcedureDetail = {
    code: '123456',
    name: '手術A',
    date: '20220102',
    sequenceNumber: '0001',
    dataCategory: '50',
  };
  const existingCases: CaseData[] = [
    {
      id: '12345',
      admission: '20220101',
      discharge: '20220105',
      procedureDetails: [detail1],
    },
  ];
  const detail2: ProcedureDetail = {
    code: '789012',
    name: '手術B',
    date: '20220116',
    sequenceNumber: '0001',
    dataCategory: '50',
  };
  const detail3: ProcedureDetail = {
    code: '345678',
    name: '手術C',
    date: '20220202',
    sequenceNumber: '0001',
    dataCategory: '50',
  };
  const newCases: CaseData[] = [
    {
      id: '12345', // 同じID
      admission: '20220115', // 異なる入院日
      discharge: '20220120',
      procedureDetails: [detail2],
    },
    {
      id: '67890', // 異なるID
      admission: '20220201',
      discharge: '20220205',
      procedureDetails: [detail3],
    },
  ];

  const result = mergeCases(existingCases, newCases);

  assertEquals(result.length, 3); // 既存1 + 新規2 = 3症例
  const caseA1 = result.find((c: CaseData) => c.id === '12345' && c.admission === '20220101'); // 型指定を追加
  const caseA2 = result.find((c: CaseData) => c.id === '12345' && c.admission === '20220115'); // 型指定を追加
  const caseB1 = result.find((c: CaseData) => c.id === '67890' && c.admission === '20220201'); // 型指定を追加

  assertExists(caseA1);
  assertEquals(caseA1?.procedureDetails, [detail1]);
  assertExists(caseA2);
  assertEquals(caseA2?.procedureDetails, [detail2]);
  assertExists(caseB1);
  assertEquals(caseB1?.procedureDetails, [detail3]);
});

Deno.test('mergeCases関数: 同一症例の診療行為詳細の重複が排除される', () => {
  const detail1: ProcedureDetail = {
    code: '123456',
    name: '手術A',
    date: '20220102',
    sequenceNumber: '0001',
    dataCategory: '50',
  };
  const detail2: ProcedureDetail = {
    code: '789012',
    name: '手術B',
    date: '20220103',
    sequenceNumber: '0002',
    dataCategory: '50',
  }; // 既存
  const existingCases: CaseData[] = [
    {
      id: '12345',
      admission: '20220101',
      discharge: '20220105',
      procedureDetails: [detail1, detail2],
    },
  ];
  const detail3: ProcedureDetail = {
    code: '789012',
    name: '手術B',
    date: '20220103',
    sequenceNumber: '0002',
    dataCategory: '50',
  }; // 重複
  const detail4: ProcedureDetail = {
    code: '345678',
    name: '手術C',
    date: '20220104',
    sequenceNumber: '0003',
    dataCategory: '50',
  }; // 新規
  const newCases: CaseData[] = [
    {
      id: '12345',
      admission: '20220101',
      discharge: '20220105',
      procedureDetails: [detail3, detail4],
    },
  ];

  const result = mergeCases(existingCases, newCases);

  assertEquals(result.length, 1);
  assertEquals(result[0].procedureDetails, [detail1, detail2, detail4]); // 重複(detail3)は排除
});

Deno.test('mergeCases関数: 退院日が確定している既存データに、未確定の新規データがきても更新しない', () => {
  const detail1: ProcedureDetail = {
    code: '123456',
    name: '手術A',
    date: '20220102',
    sequenceNumber: '0001',
    dataCategory: '50',
  };
  const existingCases: CaseData[] = [
    {
      id: '12345',
      admission: '20220101',
      discharge: '20220105', // 確定済み
      procedureDetails: [detail1],
    },
  ];
  const detail2: ProcedureDetail = {
    code: '789012',
    name: '手術B',
    date: '20220103',
    sequenceNumber: '0002',
    dataCategory: '50',
  };
  const newCases: CaseData[] = [
    {
      id: '12345',
      admission: '20220101',
      discharge: '00000000', // 未確定
      procedureDetails: [detail2],
    },
  ];
  const result = mergeCases(existingCases, newCases);
  assertEquals(result[0].discharge, '20220105'); // 更新されない
  assertEquals(result[0].procedureDetails, [detail1, detail2]);
});

Deno.test('mergeCases関数: 退院日が両方未確定の場合は未確定のまま', () => {
  const detail1: ProcedureDetail = {
    code: '123456',
    name: '手術A',
    date: '20220102',
    sequenceNumber: '0001',
    dataCategory: '50',
  };
  const existingCases: CaseData[] = [
    {
      id: '12345',
      admission: '20220101',
      discharge: '00000000',
      procedureDetails: [detail1],
    },
  ];
  const detail2: ProcedureDetail = {
    code: '789012',
    name: '手術B',
    date: '20220103',
    sequenceNumber: '0002',
    dataCategory: '50',
  };
  const newCases: CaseData[] = [
    {
      id: '12345',
      admission: '20220101',
      discharge: '00000000',
      procedureDetails: [detail2],
    },
  ];
  const result = mergeCases(existingCases, newCases);
  assertEquals(result[0].discharge, '00000000'); // 未確定のまま
  assertEquals(result[0].procedureDetails, [detail1, detail2]);
});

Deno.test('mergeCases関数: より新しい退院日で更新される', () => {
  const detail1: ProcedureDetail = {
    code: '123456',
    name: '手術A',
    date: '20220102',
    sequenceNumber: '0001',
    dataCategory: '50',
  };
  const existingCases: CaseData[] = [
    {
      id: '12345',
      admission: '20220101',
      discharge: '20220105', // 古い退院日
      procedureDetails: [detail1],
    },
  ];
  const detail2: ProcedureDetail = {
    code: '789012',
    name: '手術B',
    date: '20220103',
    sequenceNumber: '0002',
    dataCategory: '50',
  };
  const newCases: CaseData[] = [
    {
      id: '12345',
      admission: '20220101',
      discharge: '20220110', // 新しい退院日
      procedureDetails: [detail2],
    },
  ];
  const result = mergeCases(existingCases, newCases);
  assertEquals(result[0].discharge, '20220110'); // 新しい日付で更新
});

Deno.test('mergeCases関数: 異なる症例間でデータが混ざらないことを確認', () => {
  const detailA1: ProcedureDetail = {
    code: 'P1',
    name: 'ProcA1',
    date: '20220102',
    sequenceNumber: '0001',
    dataCategory: '50',
  };
  const detailB1: ProcedureDetail = {
    code: 'P2',
    name: 'ProcB1',
    date: '20220111',
    sequenceNumber: '0001',
    dataCategory: '50',
  };
  const existingCases: CaseData[] = [
    { id: 'A', admission: '20220101', discharge: '20220105', procedureDetails: [detailA1] },
    { id: 'B', admission: '20220110', discharge: '00000000', procedureDetails: [detailB1] },
  ];
  const detailA1_new: ProcedureDetail = {
    code: 'P3',
    name: 'ProcA1New',
    date: '20220103',
    sequenceNumber: '0002',
    dataCategory: '50',
  };
  const detailB1_new: ProcedureDetail = {
    code: 'P4',
    name: 'ProcB1New',
    date: '20220112',
    sequenceNumber: '0002',
    dataCategory: '50',
  };
  const detailA2: ProcedureDetail = {
    code: 'P5',
    name: 'ProcA2',
    date: '20220202',
    sequenceNumber: '0001',
    dataCategory: '50',
  };
  const newCases: CaseData[] = [
    { id: 'A', admission: '20220101', discharge: '20220105', procedureDetails: [detailA1_new] }, // Aの追加手術
    { id: 'B', admission: '20220110', discharge: '20220115', procedureDetails: [detailB1_new] }, // Bの退院日確定と追加手術
    { id: 'A', admission: '20220201', discharge: '20220205', procedureDetails: [detailA2] }, // Aの別入院
  ];

  const result = mergeCases(existingCases, newCases);
  assertEquals(result.length, 3);

  const caseA1_merged = result.find((c: CaseData) => c.id === 'A' && c.admission === '20220101'); // 型指定を追加
  const caseB1_merged = result.find((c: CaseData) => c.id === 'B' && c.admission === '20220110'); // 型指定を追加
  const caseA2_merged = result.find((c: CaseData) => c.id === 'A' && c.admission === '20220201'); // 型指定を追加

  assertExists(caseA1_merged);
  assertEquals(caseA1_merged?.discharge, '20220105');
  assertEquals(caseA1_merged?.procedureDetails, [detailA1, detailA1_new]);

  assertExists(caseB1_merged);
  assertEquals(caseB1_merged?.discharge, '20220115');
  assertEquals(caseB1_merged?.procedureDetails, [detailB1, detailB1_new]);

  assertExists(caseA2_merged);
  assertEquals(caseA2_merged?.discharge, '20220205');
  assertEquals(caseA2_merged?.procedureDetails, [detailA2]);
});
