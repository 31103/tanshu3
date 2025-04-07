/**
 * 短期滞在手術等基本料３判定プログラム - 統合テスト
 * このファイルは、複数モジュール間の連携と複数月データのフローをテストします。
 */

import {
  assert,
  assertEquals,
  assertNotEquals,
} from 'https://deno.land/std@0.119.0/testing/asserts.ts';
import { dirname, fromFileUrl, join } from 'https://deno.land/std@0.119.0/path/mod.ts';
import { mergeCases, parseEFFile } from '../../src/core/common/parsers.ts';
import { evaluateCases, formatResults } from '../../src/core/common/evaluator.ts';
import { calculateHospitalDays, parseDate } from '../../src/core/common/utils.ts';
import { DEFAULT_RESULT_HEADER, TARGET_PROCEDURES } from '../../src/core/common/constants.ts';
import type { CaseData, OutputSettings, ProcedureDetail } from '../../src/core/common/types.ts'; // ProcedureDetail をインポート

// パスの設定
const __dirname = dirname(fromFileUrl(import.meta.url));
const FIXTURE_DIR = join(__dirname, '..', 'fixtures', 'sampleEF');

// データフロー統合テスト
Deno.test('複数月のデータから患者情報を正しく解析できること', async () => {
  // フィクスチャのパスを設定
  const july2024DataPath = join(FIXTURE_DIR, 'sample_EFn_XXXXXXXXX_2407.txt');
  const august2024DataPath = join(FIXTURE_DIR, 'sample_EFn_XXXXXXXXX_2408.txt');

  // テストデータを読み込む
  const julyData = await Deno.readTextFile(july2024DataPath);
  const augustData = await Deno.readTextFile(august2024DataPath);

  // 7月と8月のデータを解析
  const julyCases = parseEFFile(julyData);
  const augustCases = parseEFFile(augustData);

  // データ解析の結果を検証
  assertNotEquals(julyCases, undefined);
  assertNotEquals(augustCases, undefined);
  assertEquals(Array.isArray(julyCases), true);
  assertEquals(Array.isArray(augustCases), true);
  assert(julyCases.length > 0);
  assert(augustCases.length > 0);
});

Deno.test('月をまたいだ患者データを正しく処理できること', async () => {
  // フィクスチャのパスを設定
  const july2024DataPath = join(FIXTURE_DIR, 'sample_EFn_XXXXXXXXX_2407.txt');
  const august2024DataPath = join(FIXTURE_DIR, 'sample_EFn_XXXXXXXXX_2408.txt');

  // テストデータを読み込む
  const julyData = await Deno.readTextFile(july2024DataPath);
  const augustData = await Deno.readTextFile(august2024DataPath);

  // 両月のデータを解析
  const julyCases = parseEFFile(julyData);
  const augustCases = parseEFFile(augustData); // 正しく8月のデータを解析

  // 7月に入院して8月に退院した患者を探す
  const crossMonthCases = julyCases.filter((caseData) => {
    // 入院日が7月で、退院日が未定義または7月以降の患者
    const admissionDate = parseDate(caseData.admission);
    return (
      admissionDate &&
      admissionDate.getMonth() === 6 && // JavaScriptでは月は0から始まるため、7月は6
      (!caseData.discharge ||
        caseData.discharge === '00000000' ||
        (parseDate(caseData.discharge) && parseDate(caseData.discharge)!.getMonth() >= 6))
    );
  });

  // 7月から継続している患者が8月のデータにも存在するか確認
  if (crossMonthCases.length > 0) {
    for (const julyCase of crossMonthCases) {
      // 患者IDで同一患者を特定
      const matchingAugustCase = augustCases.find((augustCase) => augustCase.id === julyCase.id);

      if (matchingAugustCase) {
        // 同一患者が見つかった場合、情報の整合性を検証
        assertEquals(matchingAugustCase.admission, julyCase.admission);
        // 8月のデータでは退院日が設定されている可能性が高い
        if (matchingAugustCase.discharge !== '00000000') {
          assertEquals(julyCase.discharge, '00000000');
        }
      }
    }
  }
});

Deno.test('複数月のデータを組み合わせて正しく評価できること', async () => {
  // フィクスチャのパスを設定
  const july2024DataPath = join(FIXTURE_DIR, 'sample_EFn_XXXXXXXXX_2407.txt');
  const august2024DataPath = join(FIXTURE_DIR, 'sample_EFn_XXXXXXXXX_2408.txt');

  // テストデータを読み込む
  const julyData = await Deno.readTextFile(july2024DataPath);
  const augustData = await Deno.readTextFile(august2024DataPath);

  // 両月のデータを解析
  const julyCases = parseEFFile(julyData);
  const augustCases = parseEFFile(augustData);

  // 両月のデータをマージ
  const mergedCases = mergeCases(julyCases, augustCases);

  // マージしたデータが適切か検証
  assert(mergedCases.length >= Math.max(julyCases.length, augustCases.length));

  // 各患者データを評価
  const evaluatedCases = evaluateCases(mergedCases);

  // evaluateCasesは全ケースを返すため、対象症例のみをフィルタリング
  const eligibleCases = evaluatedCases.filter((c) => c.isEligible === true);

  // このフィクスチャデータでは、新しいロジックで3件が対象となることを期待
  assertEquals(eligibleCases.length, 3);

  // 評価結果が妥当か検証（短手3の対象は5日以内の入院で対象手術を実施した患者）
  for (const eligibleCase of eligibleCases) {
    // 退院日が設定されている
    assertNotEquals(eligibleCase.discharge, '00000000');

    // 対象手術が少なくとも1つ含まれている (procedureDetails を使用)
    const hasTargetProcedure = eligibleCase.procedureDetails.some((pd) =>
      TARGET_PROCEDURES.includes(pd.code)
    );
    assertEquals(hasTargetProcedure, true);

    // 入院期間が5日以内
    const hospitalDays = calculateHospitalDays(eligibleCase.admission, eligibleCase.discharge);
    assertNotEquals(hospitalDays, null);
    assert((hospitalDays as number) <= 5);
  }

  // formatResults のテスト
  const settingsAllYMD: OutputSettings = { outputMode: 'allCases', dateFormat: 'yyyymmdd' };
  const settingsAllSlash: OutputSettings = { outputMode: 'allCases', dateFormat: 'yyyy/mm/dd' };
  const settingsEligibleYMD: OutputSettings = {
    outputMode: 'eligibleOnly',
    dateFormat: 'yyyymmdd',
  };
  const settingsEligibleSlash: OutputSettings = {
    outputMode: 'eligibleOnly',
    dateFormat: 'yyyy/mm/dd',
  };

  // 1. 全症例, YYYYMMDD
  const resultAllYMD = formatResults(evaluatedCases, DEFAULT_RESULT_HEADER, settingsAllYMD);
  const linesAllYMD = resultAllYMD.split('\n');
  assertEquals(linesAllYMD.length, evaluatedCases.length + 1); // ヘッダー + 全症例数
  // 日付フォーマットの確認 (例: 最初のデータ行)
  if (evaluatedCases.length > 0) {
    const firstDataLine = linesAllYMD[1].split('\t');
    assert(firstDataLine[1].match(/^\d{8}$/)); // YYYYMMDD形式
    assert(firstDataLine[2].match(/^\d{8}$/)); // YYYYMMDD形式 or 00000000
  }
  // 対象症例が含まれることを確認
  assert(resultAllYMD.includes('0000000002\t'));
  assert(resultAllYMD.includes('0000000004\t'));

  // 2. 全症例, YYYY/MM/DD
  const resultAllSlash = formatResults(evaluatedCases, DEFAULT_RESULT_HEADER, settingsAllSlash);
  const linesAllSlash = resultAllSlash.split('\n');
  assertEquals(linesAllSlash.length, evaluatedCases.length + 1);
  // 日付フォーマットの確認
  if (evaluatedCases.length > 0) {
    const firstDataLine = linesAllSlash[1].split('\t');
    assert(firstDataLine[1].match(/^\d{4}\/\d{2}\/\d{2}$/)); // YYYY/MM/DD形式
    assert(firstDataLine[2].match(/^(\d{4}\/\d{2}\/\d{2}|00000000)$/)); // YYYY/MM/DD形式 or 00000000
  }
  assert(resultAllSlash.includes('0000000002\t'));
  assert(resultAllSlash.includes('0000000004\t'));

  // 3. 対象症例のみ, YYYYMMDD
  const resultEligibleYMD = formatResults(
    evaluatedCases,
    DEFAULT_RESULT_HEADER,
    settingsEligibleYMD,
  );
  const linesEligibleYMD = resultEligibleYMD.split('\n');
  assertEquals(linesEligibleYMD.length, eligibleCases.length + 1); // ヘッダー + 対象症例数
  // 日付フォーマットの確認
  if (eligibleCases.length > 0) {
    const firstDataLine = linesEligibleYMD[1].split('\t');
    assert(firstDataLine[1].match(/^\d{8}$/));
    assert(firstDataLine[2].match(/^\d{8}$/)); // 対象症例は退院日確定のはず
  }
  // 対象症例のみが含まれることを確認
  assert(resultEligibleYMD.includes('0000000002\t'));
  assert(resultEligibleYMD.includes('0000000004\t'));

  // 4. 対象症例のみ, YYYY/MM/DD
  const resultEligibleSlash = formatResults(
    evaluatedCases,
    DEFAULT_RESULT_HEADER,
    settingsEligibleSlash,
  );
  const linesEligibleSlash = resultEligibleSlash.split('\n');
  assertEquals(linesEligibleSlash.length, eligibleCases.length + 1);
  // 日付フォーマットの確認
  if (eligibleCases.length > 0) {
    const firstDataLine = linesEligibleSlash[1].split('\t');
    assert(firstDataLine[1].match(/^\d{4}\/\d{2}\/\d{2}$/));
    assert(firstDataLine[2].match(/^\d{4}\/\d{2}\/\d{2}$/));
  }
  assert(resultEligibleSlash.includes('0000000002\t'));
  assert(resultEligibleSlash.includes('0000000004\t'));
});

// フィクスチャに依存しない模擬データを使用したテスト
Deno.test('月をまたぐ患者データを正しくマージ・評価できること', () => {
  // 対象手術コードを定数から取得
  const targetProcedureCode = TARGET_PROCEDURES[0]; // 例として最初のコードを使用

  // 7月に入院し、8月に退院する患者データを作成
  const julyCase: CaseData = {
    id: 'crossMonthPatient',
    admission: '20240730', // 7月30日入院
    discharge: '00000000', // 7月中は退院日未定
    procedureDetails: [{
      code: targetProcedureCode,
      name: '対象手術',
      date: '20240731',
      sequenceNumber: '0001',
    }], // 対象手術あり
  };
  const augustCase: CaseData = {
    id: 'crossMonthPatient',
    admission: '20240730', // 入院日は同じ
    discharge: '20240802', // 8月2日退院
    procedureDetails: [{
      code: targetProcedureCode,
      name: '対象手術',
      date: '20240731',
      sequenceNumber: '0001',
    }], // 対象手術あり
  };

  // マージ処理
  const mergedCases = mergeCases([julyCase], [augustCase]);

  // マージ結果の検証
  assertEquals(mergedCases.length, 1);
  assertEquals(mergedCases[0].id, 'crossMonthPatient');
  assertEquals(mergedCases[0].admission, '20240730');
  assertEquals(mergedCases[0].discharge, '20240802'); // 退院日が更新されていること
  assert(mergedCases[0].procedureDetails.some((pd) => pd.code === targetProcedureCode)); // procedureDetails をチェック

  // 評価処理
  const eligibleCases = evaluateCases(mergedCases);

  // 評価結果の検証 (入院日数 = 8/2 - 7/30 + 1 = 4日 <= 5日)
  assertEquals(eligibleCases.length, 1);
  assertEquals(eligibleCases[0].id, 'crossMonthPatient');
  assertEquals(eligibleCases[0].isEligible, true);
});

Deno.test('退院日が00000000から確定日に更新されるケースを正しく処理できること', () => {
  // 対象手術コードを定数から取得
  const targetProcedureCode = TARGET_PROCEDURES[0]; // 例として最初のコードを使用

  // 7月は退院日未定、8月で確定するデータ
  const julyCase: CaseData = {
    id: 'dischargeUpdatePatient',
    admission: '20240710',
    discharge: '00000000',
    procedureDetails: [{
      code: targetProcedureCode,
      name: '対象手術',
      date: '20240711',
      sequenceNumber: '0001',
    }],
  };
  const augustCase: CaseData = {
    id: 'dischargeUpdatePatient',
    admission: '20240710',
    discharge: '20240712', // 7月12日に退院確定
    procedureDetails: [{
      code: targetProcedureCode,
      name: '対象手術',
      date: '20240711',
      sequenceNumber: '0001',
    }],
  };

  const mergedCases = mergeCases([julyCase], [augustCase]);
  assertEquals(mergedCases.length, 1);
  assertEquals(mergedCases[0].discharge, '20240712');

  const evaluatedCases = evaluateCases(mergedCases);
  // 入院日数 = 7/12 - 7/10 + 1 = 3日 <= 5日
  assertEquals(evaluatedCases.length, 1);
  assertEquals(evaluatedCases[0].id, 'dischargeUpdatePatient');
  assertEquals(evaluatedCases[0].isEligible, true);
});

Deno.test('入院日数がちょうど5日のケースを正しく評価できること', () => {
  // 対象手術コードを定数から取得
  const targetProcedureCode = TARGET_PROCEDURES[0]; // 例として最初のコードを使用

  const caseData: CaseData = {
    id: 'just5days',
    admission: '20240101',
    discharge: '20240105', // 1/1, 1/2, 1/3, 1/4, 1/5 の5日間
    procedureDetails: [{
      code: targetProcedureCode,
      name: '対象手術',
      date: '20240102',
      sequenceNumber: '0001',
    }],
  };
  const evaluatedCases = evaluateCases([caseData]);
  assertEquals(evaluatedCases.length, 1);
  assertEquals(evaluatedCases[0].id, 'just5days');
  assertEquals(evaluatedCases[0].isEligible, true);

  // 入院日数を検証
  const hospitalDays = calculateHospitalDays(caseData.admission, caseData.discharge);
  assertEquals(hospitalDays, 5);
});

Deno.test('入院日数が6日のケースは対象外となること', () => {
  // 対象手術コードを定数から取得
  const targetProcedureCode = TARGET_PROCEDURES[0]; // 例として最初のコードを使用

  const caseData: CaseData = {
    id: 'over5days',
    admission: '20240101',
    discharge: '20240106', // 1/1 - 1/6 の6日間
    procedureDetails: [{
      code: targetProcedureCode,
      name: '対象手術',
      date: '20240102',
      sequenceNumber: '0001',
    }],
  };
  const evaluatedCases = evaluateCases([caseData]);
  // evaluateCasesは評価済みケースを返す(長さ1)
  assertEquals(evaluatedCases.length, 1);
  // isEligibleがfalseであることを確認
  assertEquals(evaluatedCases[0].isEligible, false);

  // 入院日数を検証
  const hospitalDays = calculateHospitalDays(caseData.admission, caseData.discharge);
  assertEquals(hospitalDays, 6);
});

Deno.test('入院日数が1日（同日入退院）のケースを正しく評価できること', () => {
  // 対象手術コードを定数から取得
  const targetProcedureCode = TARGET_PROCEDURES[0]; // 例として最初のコードを使用

  const caseData: CaseData = {
    id: 'sameDay',
    admission: '20240101',
    discharge: '20240101', // 1日間
    procedureDetails: [{
      code: targetProcedureCode,
      name: '対象手術',
      date: '20240101',
      sequenceNumber: '0001',
    }],
  };
  const evaluatedCases = evaluateCases([caseData]);
  assertEquals(evaluatedCases.length, 1);
  assertEquals(evaluatedCases[0].id, 'sameDay');
  assertEquals(evaluatedCases[0].isEligible, true);

  // 入院日数を検証
  const hospitalDays = calculateHospitalDays(caseData.admission, caseData.discharge);
  assertEquals(hospitalDays, 1);
});

Deno.test('対象手術が含まれないケースは対象外となること', () => {
  const caseData: CaseData = {
    id: 'noTargetProcedure',
    admission: '20240101',
    discharge: '20240103', // 3日間
    procedureDetails: [{
      code: '999999',
      name: '対象外手術',
      date: '20240102',
      sequenceNumber: '0001',
    }], // 対象外の手術コード
  };
  const evaluatedCases = evaluateCases([caseData]);
  // evaluateCasesは評価済みケースを返す(長さ1)
  assertEquals(evaluatedCases.length, 1);
  // isEligibleがfalseであることを確認
  assertEquals(evaluatedCases[0].isEligible, false);
});

Deno.test('複数の患者データを一括で評価できること', () => {
  // 対象手術コードを定数から取得
  const targetProcedureCode = TARGET_PROCEDURES[0]; // 例として最初のコードを使用

  // 複数の患者データを作成（対象/対象外の混在）
  const cases: CaseData[] = [
    {
      id: 'eligible1',
      admission: '20240101',
      discharge: '20240103', // 3日間
      procedureDetails: [{
        code: targetProcedureCode,
        name: '対象手術',
        date: '20240102',
        sequenceNumber: '0001',
      }],
    },
    {
      id: 'eligible2',
      admission: '20240110',
      discharge: '20240112', // 3日間
      procedureDetails: [{
        code: targetProcedureCode,
        name: '対象手術',
        date: '20240111',
        sequenceNumber: '0001',
      }],
    },
    {
      id: 'notEligible1',
      admission: '20240120',
      discharge: '20240126', // 7日間 > 5日
      procedureDetails: [{
        code: targetProcedureCode,
        name: '対象手術',
        date: '20240121',
        sequenceNumber: '0001',
      }],
    },
    {
      id: 'notEligible2',
      admission: '20240201',
      discharge: '20240203', // 3日間だが対象手術なし
      procedureDetails: [{
        code: '999999',
        name: '対象外手術',
        date: '20240202',
        sequenceNumber: '0001',
      }],
    },
  ];

  // 一括評価
  const evaluatedCases = evaluateCases(cases);

  // 評価結果の検証
  assertEquals(evaluatedCases.length, 4); // 全ケースが評価される

  // 対象症例のフィルタリング
  const eligibleCases = evaluatedCases.filter((c) => c.isEligible === true);
  assertEquals(eligibleCases.length, 2); // 対象症例は2件

  // 対象症例のIDを確認
  const eligibleIds = eligibleCases.map((c) => c.id);
  assert(eligibleIds.includes('eligible1'));
  assert(eligibleIds.includes('eligible2'));
});
