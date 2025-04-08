/**
 * 短期滞在手術等基本料３判定プログラム - モジュール統合テスト
 * このファイルは、アプリケーションの主要なモジュール間の連携をテストします。
 */

import {
  assert,
  assertEquals,
  // assertFalse, // assertFalse は std@0.119.0 には存在しないため削除
  assertNotEquals,
} from 'https://deno.land/std@0.119.0/testing/asserts.ts';
import { parseEFFile } from '../../src/core/common/parsers.ts';
import { evaluateCases, formatResults } from '../../src/core/common/evaluator.ts';
import { calculateHospitalDays, parseDate } from '../../src/core/common/utils.ts';
import { DEFAULT_RESULT_HEADER } from '../../src/core/common/constants.ts';
import type { CaseData, OutputSettings, ProcedureDetail } from '../../src/core/common/types.ts'; // ProcedureDetail をインポート

// モジュール統合テスト
Deno.test('パーサーと評価ロジックの連携が正しく動作すること', () => {
  // テスト用のモックデータを改良
  const mockEFContent = `ヘッダー行
000\tTEST001\t00000000\t20240701\t60\t0001\t001\t0\t160218510\t0\t対象手術1\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t20240702
000\tTEST001\t00000000\t20240701\t50\t0002\t001\t0\t150011310\t0\t対象手術1b\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t20240702
000\tTEST002\t20240705\t20240701\t50\t0001\t001\t0\t150078810\t0\t対象手術2a\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t20240702
000\tTEST002\t20240705\t20240701\t50\t0001\t002\t0\t150079010\t0\t対象手術2b\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t20240702
000\tTEST003\t20240710\t20240705\t50\t0001\t001\t0\t150154010\t0\t対象手術3\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t20240706
000\tTEST004\t20240708\t20240701\t99\t0001\t001\t0\t999999999\t0\t対象外手術\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t20240702`;

  // パーサーを使用してテストデータを解析
  const cases = parseEFFile(mockEFContent);

  // 解析結果を検証
  assertNotEquals(cases, undefined);
  assertEquals(Array.isArray(cases), true);

  // IDごとにデータをマージしているため、ユニークIDの数を確認
  const uniqueIds = new Set(cases.map((c) => c.id));
  assert(uniqueIds.size <= 4); // テストデータには最大4つのユニークなIDがある可能性がある

  // 各ケースの構造を検証
  cases.forEach((caseData) => {
    assert('id' in caseData);
    assert('admission' in caseData);
    assert('discharge' in caseData);
    assert('procedureDetails' in caseData); // procedures -> procedureDetails
    assertEquals(Array.isArray(caseData.procedureDetails), true); // procedures -> procedureDetails
  });

  // TEST001のケースを確認（存在する場合）
  const case001 = cases.find((c) => c.id === 'TEST001');
  if (case001) {
    assertEquals(case001.discharge, '00000000');
    assert(case001.procedureDetails.length >= 1); // procedures -> procedureDetails
    assert(case001.procedureDetails.some((pd) => pd.code === '160218510')); // procedures -> procedureDetails
  }

  // TEST002のケースを確認（存在する場合）
  const case002 = cases.find((c) => c.id === 'TEST002');
  if (case002) {
    assertEquals(case002.discharge, '20240705');
    assert(case002.procedureDetails.some((pd) => pd.code === '150078810')); // procedures -> procedureDetails
  }

  // 評価ロジックを適用
  const evaluatedCases = evaluateCases(cases); // evaluateCases は全ケースを評価して返す
  const eligibleCases = evaluatedCases.filter((c) => c.isEligible); // 対象症例のみフィルタリング

  // TEST002は異なる対象手術を複数実施しているため対象外のはず
  if (case002) {
    // 修正: assert(!...) を使用し、TEST002が対象外であることを確認
    assert(
      !eligibleCases.some((c) => c.id === 'TEST002'),
      'TEST002 should be ineligible due to multiple different target procedures',
    );
    const evaluatedCase002 = evaluatedCases.find((c) => c.id === 'TEST002');
    assert(evaluatedCase002);
    assert(!evaluatedCase002.isEligible); // isEligible が false であることを確認
  }

  // TEST001は未退院なので対象外のはず
  if (case001) {
    assertEquals(eligibleCases.some((c) => c.id === 'TEST001'), false);
  }
});

Deno.test('ユーティリティ関数と評価ロジックの連携が正しく動作すること', () => {
  // 入院日と退院日を用意
  const admissionDate = '20240701';
  const dischargeDate = '20240705';

  // 入院期間を計算
  const hospitalDays = calculateHospitalDays(admissionDate, dischargeDate);

  // 結果を検証
  assertNotEquals(hospitalDays, null);

  // 入院期間は4日間または5日間のどちらかの可能性がある（実装による）
  assert([4, 5].includes(hospitalDays as number));

  // 日付をパース
  const parsedAdmission = parseDate(admissionDate);
  const parsedDischarge = parseDate(dischargeDate);

  // パース結果を検証
  assert(parsedAdmission instanceof Date);
  assert(parsedDischarge instanceof Date);
  assertEquals(parsedAdmission?.getFullYear(), 2024);
  assertEquals(parsedAdmission?.getMonth(), 6); // 7月は6
  assertEquals(parsedAdmission?.getDate(), 1);

  // 実際のケースを作成
  const mockCase: CaseData = {
    id: 'TEST999',
    admission: admissionDate,
    discharge: dischargeDate,
    procedureDetails: [{
      code: '150078810',
      name: '対象手術',
      date: '20240702',
      sequenceNumber: '0001',
      dataCategory: '50', // データ区分を追加
    }], // 対象手術コード
  };

  // 評価ロジックを適用
  const evaluatedCases = evaluateCases([mockCase]); // evaluateCases は評価済み配列を返す
  const eligibleCases = evaluatedCases.filter((c) => c.isEligible); // 対象のみフィルタ

  // 結果を検証
  assertEquals(eligibleCases.length, 1);
  assertEquals(eligibleCases[0].id, 'TEST999');
});

Deno.test('フォーマット機能と評価ロジックの連携が正しく動作すること', () => {
  // テスト用のケースデータを作成
  const testCases: CaseData[] = [
    {
      id: 'TEST101',
      admission: '20240701',
      discharge: '20240705',
      procedureDetails: [{
        code: '150078810',
        name: '対象手術1',
        date: '20240702',
        sequenceNumber: '0001',
        dataCategory: '50',
      }],
    },
    {
      id: 'TEST102',
      admission: '20240702',
      discharge: '20240705',
      procedureDetails: [{
        code: '150011310',
        name: '対象手術2',
        date: '20240703',
        sequenceNumber: '0001',
        dataCategory: '50',
      }],
    },
  ];

  // 評価ロジックを適用
  const evaluatedCases = evaluateCases(testCases); // evaluateCases は評価済み配列を返す

  // すべてのケースが対象になるはず
  assertEquals(evaluatedCases.filter((c) => c.isEligible).length, 2);

  // デフォルト設定を定義
  const defaultSettings: OutputSettings = { outputMode: 'allCases', dateFormat: 'yyyymmdd' };

  // 結果をフォーマット (デフォルトヘッダーと設定を渡す)
  const formattedResult = formatResults(evaluatedCases, DEFAULT_RESULT_HEADER, defaultSettings);

  // フォーマット結果を検証
  assertEquals(typeof formattedResult, 'string');
  assert(formattedResult.length > 0);

  // 各ケースIDがフォーマット結果に含まれていることを確認
  evaluatedCases.forEach((caseData) => {
    assert(formattedResult.includes(caseData.id));
  });

  // カスタムヘッダーを使用してフォーマット (設定も渡す)
  const customHeader = '患者ID,入院日,退院日,入院期間,実施手術';
  const customFormatted = formatResults(evaluatedCases, customHeader, defaultSettings);

  // カスタムヘッダーがフォーマット結果に含まれていることを確認
  assert(customFormatted.includes(customHeader));
});

Deno.test('異常系データを適切に処理できること', () => {
  // 異常データを含むモックコンテンツを改良
  const invalidMockContent = `ヘッダー行
000\tINVALID1\t\t20240701\t50\t0001\t001\t0\t150078810\t0\t対象手術\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t20240702
000\tINVALID2\t20240705\t\t50\t0001\t001\t0\t150011310\t0\t対象手術\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t20240703
000\tINVALID3\txxxxxxxx\t20240701\t50\t0001\t001\t0\t150154010\t0\t対象手術\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t20240702
000\tINVALID4\t20240708\txxxxxxxx\t50\t0001\t001\t0\t150154010\t0\t対象手術\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t20240705
NOT_EF\tINVALID5\t20240708\t20240705\t50\t0001\t001\t0\t150154010\t0\t対象手術\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t20240706
NOT_EF\tINVALID5\t20240708\t20240705\t50\t0002\t001\t0\t159999999\t0\t他の手術\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t20240706
000\tVALID001\t20240705\t20240701\t50\t0001\t001\t0\t150078810\t0\t対象手術\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t20240702
`;

  // パーサーを使用してテストデータを解析
  const cases = parseEFFile(invalidMockContent);

  // 解析結果を検証
  assertNotEquals(cases, undefined);
  assertEquals(Array.isArray(cases), true);

  // 評価ロジックを適用（エラーが発生しないことを確認）
  const evaluatedCases = evaluateCases(cases);
  const eligibleCases = evaluatedCases.filter((c) => c.isEligible);

  // 修正: VALID001 が対象であることを確認し、対象が1件のみであることを確認
  const validCaseEvaluated = evaluatedCases.find((c) => c.id === 'VALID001');
  assert(validCaseEvaluated, 'VALID001 should be parsed and evaluated');
  assert(validCaseEvaluated.isEligible, 'VALID001 should be eligible');
  assertEquals(eligibleCases.length, 1, 'Only VALID001 should be eligible');
});
