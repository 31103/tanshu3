/**
 * parsers.ts モジュールのテスト
 *
 * ファイル解析関連の機能をテストします。
 */

import { parseEFFile, mergeCases } from '../../../src/core/common/parsers.js';
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
    // TARGET_PROCEDURESに含まれる手術コードを使用する
    const targetCode = TARGET_PROCEDURES[0]; // 対象手術コードを使用
    const content = `ヘッダー1\tヘッダー2\tヘッダー3\tヘッダー4\tヘッダー5\tヘッダー6\tヘッダー7\tヘッダー8\tヘッダー9
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

  it('同一患者の複数の手術コードを適切に統合する', () => {
    // TARGET_PROCEDURESに含まれる手術コードを使用する
    const targetCode1 = TARGET_PROCEDURES[0]; // 対象手術コード1
    const targetCode2 = TARGET_PROCEDURES[1] || TARGET_PROCEDURES[0]; // 対象手術コード2（または同じコード）

    const content = `ヘッダー1\tヘッダー2\tヘッダー3\tヘッダー4\tヘッダー5\tヘッダー6\tヘッダー7\tヘッダー8\tヘッダー9
データ1\t12345\t20220101\t20220101\tその他\tその他\tその他\tその他\t${targetCode1}
データ2\t12345\t20220101\t20220101\tその他\tその他\tその他\tその他\t${targetCode2}`;

    const result = parseEFFile(content);

    expect(result.length).toBe(1);
    expect(result[0].procedures).toContain(targetCode1);
    if (targetCode1 !== targetCode2) {
      expect(result[0].procedures).toContain(targetCode2);
      expect(result[0].procedures.length).toBe(2);
    } else {
      expect(result[0].procedures.length).toBe(1);
    }
  });

  it('パイプ区切りのデータを正しく処理する', () => {
    // TARGET_PROCEDURESに含まれる手術コードを使用する
    const targetCode = TARGET_PROCEDURES[0]; // 対象手術コード

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
    // TARGET_PROCEDURESに含まれる手術コードを使用する
    const targetCode = TARGET_PROCEDURES[0]; // 対象手術コード

    const content = `ヘッダー1\tヘッダー2\tヘッダー3
無効なデータ行
データ1\t12345\t20220101\t20220101\tその他\tその他\tその他\tその他\t${targetCode}`;

    const result = parseEFFile(content);

    expect(result.length).toBe(1);
  });

  it('診療明細名称（10列目）が含まれるデータを正しくパースする', () => {
    const targetCode = TARGET_PROCEDURES[0];
    const content = `ヘッダー1\tヘッダー2\tヘッダー3\tヘッダー4\tヘッダー5\tヘッダー6\tヘッダー7\tヘッダー8\tヘッダー9\tヘッダー10\tヘッダー11
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
    const content = `ヘッダー1\tヘッダー2\tヘッダー3\tヘッダー4\tヘッダー5\tヘッダー6\tヘッダー7\tヘッダー8\tヘッダー9
データ1\t\t20220101\t20220101\tその他\tその他\tその他\tその他\t${targetCode}`; // IDが空

    const result = parseEFFile(content);
    expect(result).toEqual([]);
  });

  it('行為明細番号（7列目）が"000"の行は無視される', () => {
    const targetCode = TARGET_PROCEDURES[0];
    const content = `ヘッダー1\tヘッダー2\tヘッダー3\tヘッダー4\tヘッダー5\tヘッダー6\tヘッダー7\tヘッダー8\tヘッダー9
データ1\t12345\t20220101\t20220101\tその他\tその他\t000\tその他\t${targetCode}`; // 行為明細番号が000

    const result = parseEFFile(content);
    expect(result).toEqual([]); // 000の行は処理されない
  });

  it('空白のみの行は無視される', () => {
    const targetCode = TARGET_PROCEDURES[0];
    const content = `ヘッダー1\tヘッダー2\tヘッダー3\tヘッダー4\tヘッダー5\tヘッダー6\tヘッダー7\tヘッダー8\tヘッダー9

データ1\t12345\t20220101\t20220101\tその他\tその他\tその他\tその他\t${targetCode}
      `; // 空白行と末尾の空白のみの行

    const result = parseEFFile(content);
    expect(result.length).toBe(1); // 有効なデータ行のみ処理される
  });

  it('必須項目が欠落している行でも、IDがあれば基本情報は保持される（退院日更新のため）', () => {
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

  it('既存データと新規データを適切にマージする', () => {
    const existingCases: CaseData[] = [
      {
        id: '12345',
        admission: '20220101',
        discharge: '00000000', // 未確定の退院日
        procedures: ['123456'],
      },
    ];

    const newCases: CaseData[] = [
      {
        id: '12345',
        admission: '20220101',
        discharge: '20220105', // 確定した退院日
        procedures: ['789012'],
      },
    ];

    const result = mergeCases(existingCases, newCases);

    expect(result.length).toBe(1);
    expect(result[0].discharge).toBe('20220105'); // 退院日が更新されている
    expect(result[0].procedures).toContain('123456');
    expect(result[0].procedures).toContain('789012');
    expect(result[0].procedures.length).toBe(2);
  });

  it('新規データを正しく追加する', () => {
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
        id: '67890', // 新しいID
        admission: '20220201',
        discharge: '20220205',
        procedures: ['789012'],
      },
    ];

    const result = mergeCases(existingCases, newCases);

    expect(result.length).toBe(2);
    expect(result.find((c) => c.id === '67890')).toBeTruthy();
  });

  it('手術コードの重複が排除される', () => {
    const existingCases: CaseData[] = [
      {
        id: '12345',
        admission: '20220101',
        discharge: '20220105',
        procedures: ['123456', '789012'],
        procedureNames: ['(名称なし)', '手術名B'], // 対応する名称を追加
      },
    ];

    const newCases: CaseData[] = [
      {
        id: '12345',
        admission: '20220101',
        discharge: '20220105',
        procedures: ['789012', '345678'], // 一部重複するコード
      },
    ];

    const result = mergeCases(existingCases, newCases);

    expect(result.length).toBe(1);
    expect(result[0].procedures).toContain('123456');
    expect(result[0].procedures).toContain('789012');
    expect(result[0].procedures).toContain('345678');
    expect(result[0].procedures.length).toBe(3); // 重複は1つだけ排除
    expect(result[0].procedureNames?.length).toBe(3); // 名称も対応して3つ
    expect(result[0].procedureNames).toContain('(名称なし)'); // 123456に対応
    expect(result[0].procedureNames).toContain('手術名B'); // 789012に対応
    expect(result[0].procedureNames).toContain('(名称なし)'); // 345678に対応 (newCasesに名称がないためデフォルト値)
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

  it('診療明細名称を含むデータをマージする', () => {
    const existingCases: CaseData[] = [
      {
        id: '12345',
        admission: '20220101',
        discharge: '00000000',
        procedures: ['123456'],
        procedureNames: ['手術名A'],
      },
    ];
    const newCases: CaseData[] = [
      {
        id: '12345',
        admission: '20220101',
        discharge: '20220105',
        procedures: ['789012'],
        procedureNames: ['手術名B'],
      },
      {
        id: '67890',
        admission: '20220201',
        discharge: '20220205',
        procedures: ['345678'],
        procedureNames: ['手術名C'],
      },
    ];

    const result = mergeCases(existingCases, newCases);

    expect(result.length).toBe(2);
    const case1 = result.find((c) => c.id === '12345');
    const case2 = result.find((c) => c.id === '67890');

    expect(case1?.discharge).toBe('20220105');
    expect(case1?.procedures).toEqual(['123456', '789012']);
    expect(case1?.procedureNames).toEqual(['手術名A', '手術名B']);

    expect(case2?.procedures).toEqual(['345678']);
    expect(case2?.procedureNames).toEqual(['手術名C']);
  });
});
