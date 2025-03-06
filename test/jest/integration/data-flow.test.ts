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

        // 評価結果が妥当か検証（短手3の対象は5日以内の入院で対象手術を実施した患者）
        for (const eligibleCase of eligibleCases) {
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