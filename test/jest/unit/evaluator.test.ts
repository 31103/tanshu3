/**
 * evaluator.ts モジュールのテスト
 * 
 * 評価ロジック関連の機能をテストします。
 */

import { jest } from '@jest/globals';
import { evaluateCases, formatResults } from '../../../src/core/common/evaluator.js';
import { CaseData } from '../../../src/core/common/types.js';
import { MAX_HOSPITAL_DAYS, TARGET_PROCEDURES } from '../../../src/core/common/constants.js';

describe('evaluateCases関数', () => {
    it('空の配列の場合は空の配列を返す', () => {
        const result = evaluateCases([]);
        expect(result).toEqual([]);
    });

    it('短手３該当症例を正しく判定する（基本パターン）', () => {
        const cases: CaseData[] = [
            {
                id: '12345',
                admission: '20220101',
                discharge: '20220103', // 3日間の入院
                procedures: ['160218510'] // 対象手術コード
            }
        ];

        const result = evaluateCases(cases);

        expect(result.length).toBe(1);
        expect(result[0].id).toBe('12345');
    });

    it('退院日が確定していない症例は対象外とする', () => {
        const cases: CaseData[] = [
            {
                id: '12345',
                admission: '20220101',
                discharge: '00000000', // 未確定の退院日
                procedures: ['160218510']
            }
        ];

        const result = evaluateCases(cases);

        expect(result.length).toBe(0);
    });

    it('対象手術等が実施されていない症例は対象外とする', () => {
        const cases: CaseData[] = [
            {
                id: '12345',
                admission: '20220101',
                discharge: '20220103',
                procedures: ['999999999'] // 対象外の手術コード
            }
        ];

        const result = evaluateCases(cases);

        expect(result.length).toBe(0);
    });

    it(`入院期間が${MAX_HOSPITAL_DAYS}日を超える症例は対象外とする`, () => {
        const cases: CaseData[] = [
            {
                id: '12345',
                admission: '20220101',
                discharge: '20220107', // 7日間の入院
                procedures: ['160218510']
            }
        ];

        const result = evaluateCases(cases);

        expect(result.length).toBe(0);
    });

    it('異なる対象手術等を複数実施している症例は対象外とする', () => {
        const cases: CaseData[] = [
            {
                id: '12345',
                admission: '20220101',
                discharge: '20220103',
                procedures: ['160218510', '160218610'] // 異なる対象手術コードを2つ含む
            }
        ];

        const result = evaluateCases(cases);

        expect(result.length).toBe(0);
    });

    it('同一の対象手術等を複数回実施している症例は対象とする（例外処理）', () => {
        const cases: CaseData[] = [
            {
                id: '12345',
                admission: '20220101',
                discharge: '20220103',
                procedures: ['150253010', '150253010'] // 同一の対象手術コード（水晶体再建術）を2回実施
            }
        ];

        const result = evaluateCases(cases);

        expect(result.length).toBe(1);
    });

    it('対象手術等に加えて他の手術を実施している症例は対象外とする', () => {
        const cases: CaseData[] = [
            {
                id: '12345',
                admission: '20220101',
                discharge: '20220103',
                procedures: ['160218510', '150999999'] // 対象手術コードと対象外の手術コード
            }
        ];

        const result = evaluateCases(cases);

        expect(result.length).toBe(0);
    });

    it('内視鏡的大腸ポリープ・粘膜切除術に特定加算がある場合は対象外とする', () => {
        const cases: CaseData[] = [
            {
                id: '12345',
                admission: '20220101',
                discharge: '20220103',
                procedures: ['150285010', '150429570'] // 内視鏡的大腸ポリープ・粘膜切除術と特定加算
            }
        ];

        const result = evaluateCases(cases);

        expect(result.length).toBe(0);
    });

    it('内視鏡的大腸ポリープ・粘膜切除術（長径2cm以上）に特定加算がある場合は対象外とする', () => {
        const cases: CaseData[] = [
            {
                id: '12345',
                admission: '20220101',
                discharge: '20220103',
                procedures: ['150183410', '150429570'] // 内視鏡的大腸ポリープ・粘膜切除術（長径2cm以上）と特定加算
            }
        ];

        const result = evaluateCases(cases);

        expect(result.length).toBe(0);
    });

    it('内視鏡的大腸ポリープ・粘膜切除術で特定加算がない場合は対象とする', () => {
        // 対象手術等コードリストに内視鏡的大腸ポリープ・粘膜切除術のコードが含まれているかチェック
        if (!TARGET_PROCEDURES.includes('150285010') && !TARGET_PROCEDURES.includes('150183410')) {
            console.log('内視鏡的大腸ポリープ・粘膜切除術のコードが対象手術等に含まれていないためテストをスキップします');
            return;
        }

        const cases: CaseData[] = [
            {
                id: '12345',
                admission: '20220101',
                discharge: '20220103',
                procedures: ['150285010'] // 内視鏡的大腸ポリープ・粘膜切除術（加算なし）
            }
        ];

        const result = evaluateCases(cases);
        expect(result.length).toBe(1);
    });

    it('複数の症例をID順にソートして返す', () => {
        const cases: CaseData[] = [
            {
                id: '23456',
                admission: '20220201',
                discharge: '20220203',
                procedures: ['160218510']
            },
            {
                id: '12345',
                admission: '20220101',
                discharge: '20220103',
                procedures: ['160218510']
            },
            {
                id: '34567',
                admission: '20220301',
                discharge: '20220303',
                procedures: ['160218510']
            }
        ];

        const result = evaluateCases(cases);

        expect(result.length).toBe(3);
        expect(result[0].id).toBe('12345');
        expect(result[1].id).toBe('23456');
        expect(result[2].id).toBe('34567');
    });

    it('症例評価中にエラーが発生した場合は対象外とする', () => {
        // 無効な入院日を持つケース（calculateHospitalDaysでエラーが発生する可能性がある）
        const invalidCase: CaseData = {
            id: '12345',
            admission: 'invalid', // 無効な入院日
            discharge: '20220103',
            procedures: ['160218510']
        };

        const result = evaluateCases([invalidCase]);

        // エラーログの出力は検証せず、結果のみを検証
        expect(result.length).toBe(0);
    });
});

describe('formatResults関数', () => {
    it('空の配列の場合は該当する症例がない旨のメッセージを返す', () => {
        const result = formatResults([]);
        expect(result).toBe('該当する症例はありません。');
    });

    it('症例データを正しくフォーマットする', () => {
        const cases: CaseData[] = [
            {
                id: '12345',
                admission: '20220101',
                discharge: '20220103',
                procedures: ['160218510']
            }
        ];

        const result = formatResults(cases);
        const lines = result.split('\n');

        expect(lines.length).toBe(2);
        expect(lines[0]).toBe('データ識別番号\t入院年月日\t退院年月日');
        expect(lines[1]).toBe('12345\t20220101\t20220103');
    });

    it('複数の症例をフォーマットする', () => {
        const cases: CaseData[] = [
            {
                id: '12345',
                admission: '20220101',
                discharge: '20220103',
                procedures: ['160218510']
            },
            {
                id: '23456',
                admission: '20220201',
                discharge: '20220203',
                procedures: ['160218510']
            }
        ];

        const result = formatResults(cases);
        const lines = result.split('\n');

        expect(lines.length).toBe(3);
        expect(lines[1]).toBe('12345\t20220101\t20220103');
        expect(lines[2]).toBe('23456\t20220201\t20220203');
    });

    it('カスタムヘッダーを使用する', () => {
        const cases: CaseData[] = [
            {
                id: '12345',
                admission: '20220101',
                discharge: '20220103',
                procedures: ['160218510']
            }
        ];

        const customHeader = 'ID\t入院日\t退院日';
        const result = formatResults(cases, customHeader);
        const lines = result.split('\n');

        expect(lines.length).toBe(2);
        expect(lines[0]).toBe(customHeader);
    });
}); 