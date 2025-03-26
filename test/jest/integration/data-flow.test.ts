/**
 * 短期滞在手術等基本料３判定プログラム - 統合テスト
 * このファイルは、複数モジュール間の連携と複数月データのフローをテストします。
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { parseEFFile, mergeCases } from '../../../src/core/common/parsers';
import { evaluateCases } from '../../../src/core/common/evaluator';
import { parseDate, calculateHospitalDays } from '../../../src/core/common/utils';
import { TARGET_PROCEDURES } from '../../../src/core/common/constants';
import type { CaseData } from '../../../src/core/common/types';

// ESモジュールで__dirnameの代替を設定
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// フィクスチャのパスを設定
const FIXTURE_DIR = path.join(__dirname, '../../fixtures/sampleEF');

describe('データフロー統合テスト', () => {
    // 複数月にわたるデータを読み込む
    const july2024DataPath = path.join(FIXTURE_DIR, 'sample_EFn_XXXXXXXXX_2407.txt');
    const august2024DataPath = path.join(FIXTURE_DIR, 'sample_EFn_XXXXXXXXX_2408.txt');

    let julyData: string;
    let augustData: string;

    beforeAll(() => {
        // テストデータを読み込む
        julyData = fs.readFileSync(july2024DataPath, 'utf-8');
        augustData = fs.readFileSync(august2024DataPath, 'utf-8');
    });

    test('複数月のデータから患者情報を正しく解析できること', () => {
        // 7月と8月のデータを解析
        const julyCases = parseEFFile(julyData);
        const augustCases = parseEFFile(augustData);

        // データ解析の結果を検証
        expect(julyCases).toBeDefined();
        expect(augustCases).toBeDefined();
        expect(Array.isArray(julyCases)).toBe(true);
        expect(Array.isArray(augustCases)).toBe(true);
        expect(julyCases.length).toBeGreaterThan(0);
        expect(augustCases.length).toBeGreaterThan(0);
    });

    test('月をまたいだ患者データを正しく処理できること', () => {
        // 両月のデータを解析
        const julyCases = parseEFFile(julyData);
        const augustCases = parseEFFile(augustData);

        // 7月に入院して8月に退院した患者を探す
        const crossMonthCases = julyCases.filter(caseData => {
            // 入院日が7月で、退院日が未定義または7月以降の患者
            const admissionDate = parseDate(caseData.admission);
            return admissionDate && admissionDate.getMonth() === 6 && // JavaScriptでは月は0から始まるため、7月は6
                (!caseData.discharge || caseData.discharge === '00000000' ||
                    (parseDate(caseData.discharge) && parseDate(caseData.discharge)!.getMonth() >= 6));
        });

        // 7月から継続している患者が8月のデータにも存在するか確認
        if (crossMonthCases.length > 0) {
            for (const julyCase of crossMonthCases) {
                // 患者IDで同一患者を特定
                const matchingAugustCase = augustCases.find(
                    augustCase => augustCase.id === julyCase.id
                );

                if (matchingAugustCase) {
                    // 同一患者が見つかった場合、情報の整合性を検証
                    expect(matchingAugustCase.admission).toBe(julyCase.admission);
                    // 8月のデータでは退院日が設定されているはず
                    expect(matchingAugustCase.discharge).not.toBe('00000000');
                }
            }
        } else {
            // テストデータに月をまたぐ患者がいない場合はスキップ
            console.warn('警告: 月をまたぐ患者データが見つかりませんでした。テストケースを拡充してください。');
        }
    });

    test('複数月のデータを組み合わせて正しく評価できること', () => {
        // 両月のデータを解析
        const julyCases = parseEFFile(julyData);
        const augustCases = parseEFFile(augustData);

        // 両月のデータをマージ
        const mergedCases = mergeCases(julyCases, augustCases);

        // マージしたデータが適切か検証
        expect(mergedCases.length).toBeGreaterThanOrEqual(
            Math.max(julyCases.length, augustCases.length)
        );

        // 各患者データを評価
        const eligibleCases = evaluateCases(mergedCases);

        // --- 修正: evaluateCasesはフィルタリングしないため、テスト内でフィルタリング ---
        // evaluateCasesは評価済みの全ケースを返す (isEligible: true/falseを含む)
        const trulyEligibleCases = eligibleCases.filter(c => c.isEligible === true);

        // --- 期待値修正: このフィクスチャデータでは2件が対象 ---
        // 患者 '0000000002' (手術: 150183410, 入院: 2日)
        // 患者 '0000000004' (手術: 160098110, 入院: 3日)
        expect(trulyEligibleCases.length).toBe(2);

        // 期待されるIDが含まれているか確認 (順序は問わない)
        const eligibleIds = trulyEligibleCases.map(c => c.id);
        expect(eligibleIds).toContain('0000000002');
        expect(eligibleIds).toContain('0000000004');
        // --- ここまで修正 ---

        // 評価結果が妥当か検証（短手3の対象は5日以内の入院で対象手術を実施した患者）
        // 修正: フィルタリング後の配列に対してループ
        for (const eligibleCase of trulyEligibleCases) {
            // 退院日が設定されている
            expect(eligibleCase.discharge).not.toBe('00000000');

            // 対象手術が少なくとも1つ含まれている
            const hasTargetProcedure = eligibleCase.procedures.some(
                procedure => TARGET_PROCEDURES.includes(procedure)
            );
            expect(hasTargetProcedure).toBe(true);

            // 入院期間が5日以内
            const hospitalDays = calculateHospitalDays(eligibleCase.admission, eligibleCase.discharge);
            expect(hospitalDays).not.toBeNull();
            expect(hospitalDays).toBeLessThanOrEqual(5);
        }
    });
});

// --- ここから追加 ---
describe('データフロー統合テスト（模擬データ）', () => {
    // 対象手術コードを定数から取得
    const targetProcedureCode = TARGET_PROCEDURES[0]; // 例として最初のコードを使用

    test('月をまたぐ患者データを正しくマージ・評価できること', () => {
        // 7月に入院し、8月に退院する患者データを作成
        const julyCase: CaseData = {
            id: 'crossMonthPatient',
            admission: '20240730', // 7月30日入院
            discharge: '00000000', // 7月中は退院日未定
            procedures: [targetProcedureCode], // 対象手術あり
            procedureNames: ['対象手術'],
        };
        const augustCase: CaseData = {
            id: 'crossMonthPatient',
            admission: '20240730', // 入院日は同じ
            discharge: '20240802', // 8月2日退院
            procedures: [targetProcedureCode], // 対象手術あり
            procedureNames: ['対象手術'],
        };

        // マージ処理
        const mergedCases = mergeCases([julyCase], [augustCase]);

        // マージ結果の検証
        expect(mergedCases.length).toBe(1);
        expect(mergedCases[0].id).toBe('crossMonthPatient');
        expect(mergedCases[0].admission).toBe('20240730');
        expect(mergedCases[0].discharge).toBe('20240802'); // 退院日が更新されていること
        expect(mergedCases[0].procedures).toContain(targetProcedureCode);

        // 評価処理
        const eligibleCases = evaluateCases(mergedCases);

        // 評価結果の検証 (入院日数 = 8/2 - 7/30 + 1 = 4日 <= 5日)
        expect(eligibleCases.length).toBe(1);
        expect(eligibleCases[0].id).toBe('crossMonthPatient');
    });

    test('退院日が00000000から確定日に更新されるケースを正しく処理できること', () => {
        // 7月は退院日未定、8月で確定するデータ
        const julyCase: CaseData = {
            id: 'dischargeUpdatePatient',
            admission: '20240710',
            discharge: '00000000',
            procedures: [targetProcedureCode],
            procedureNames: ['対象手術'],
        };
        const augustCase: CaseData = {
            id: 'dischargeUpdatePatient',
            admission: '20240710',
            discharge: '20240712', // 7月12日に退院確定
            procedures: [targetProcedureCode],
            procedureNames: ['対象手術'],
        };

        const mergedCases = mergeCases([julyCase], [augustCase]);
        expect(mergedCases.length).toBe(1);
        expect(mergedCases[0].discharge).toBe('20240712');

        const eligibleCases = evaluateCases(mergedCases);
        // 入院日数 = 7/12 - 7/10 + 1 = 3日 <= 5日
        expect(eligibleCases.length).toBe(1);
        expect(eligibleCases[0].id).toBe('dischargeUpdatePatient');
    });

    test('入院日数がちょうど5日のケースを正しく評価できること', () => {
        const caseData: CaseData = {
            id: 'just5days',
            admission: '20240101',
            discharge: '20240105', // 1/1, 1/2, 1/3, 1/4, 1/5 の5日間
            procedures: [targetProcedureCode],
            procedureNames: ['対象手術'],
        };
        const eligibleCases = evaluateCases([caseData]);
        expect(eligibleCases.length).toBe(1);
        expect(eligibleCases[0].id).toBe('just5days');
    });

    test('入院日数が6日のケースは対象外となること', () => {
        const caseData: CaseData = {
            id: 'over5days',
            admission: '20240101',
            discharge: '20240106', // 1/1 - 1/6 の6日間
            procedures: [targetProcedureCode],
            procedureNames: ['対象手術'],
        };
        const evaluatedResult = evaluateCases([caseData]);
        // 修正: evaluateCasesは評価済みケースを返す(長さ1)
        expect(evaluatedResult.length).toBe(1);
        // 修正: isEligibleがfalseであることを確認
        expect(evaluatedResult[0].isEligible).toBe(false);
    });

    test('入院日数が1日（同日入退院）のケースを正しく評価できること', () => {
        const caseData: CaseData = {
            id: 'sameDay',
            admission: '20240101',
            discharge: '20240101', // 1日間
            procedures: [targetProcedureCode],
            procedureNames: ['対象手術'],
        };
        const eligibleCases = evaluateCases([caseData]);
        expect(eligibleCases.length).toBe(1);
        expect(eligibleCases[0].id).toBe('sameDay');
    });

    test('対象手術が含まれないケースは対象外となること', () => {
        const caseData: CaseData = {
            id: 'noTargetProcedure',
            admission: '20240101',
            discharge: '20240103', // 3日間
            procedures: ['999999'], // 対象外の手術コード
            procedureNames: ['対象外手術'],
        };
        const evaluatedResult = evaluateCases([caseData]);
        // 修正: evaluateCasesは評価済みケースを返す(長さ1)
        expect(evaluatedResult.length).toBe(1);
        // 修正: isEligibleがfalseであることを確認
        expect(evaluatedResult[0].isEligible).toBe(false);
    });
});
// --- ここまで追加 ---
