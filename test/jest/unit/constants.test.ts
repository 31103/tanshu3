/**
 * constants.ts モジュールのテスト
 * 
 * 定数定義をテストします。
 */

import { TARGET_PROCEDURES, COLONOSCOPY_SPECIAL_ADDITIONS, DEFAULT_RESULT_HEADER, MAX_HOSPITAL_DAYS } from '../../../src/core/common/constants.js';

describe('定数定義', () => {
    describe('TARGET_PROCEDURES', () => {
        it('対象手術等のコード一覧が配列として定義されている', () => {
            expect(Array.isArray(TARGET_PROCEDURES)).toBe(true);
            expect(TARGET_PROCEDURES.length).toBeGreaterThan(0);
        });

        it('コードはすべて文字列である', () => {
            TARGET_PROCEDURES.forEach(code => {
                expect(typeof code).toBe('string');
            });
        });

        it('重複するコードが含まれていない', () => {
            const uniqueCodes = new Set(TARGET_PROCEDURES);
            expect(uniqueCodes.size).toBe(TARGET_PROCEDURES.length);
        });

        it('対象手術コードが定義されている', () => {
            // 対象手術コードの一部をチェック（実際のデータに合わせて調整）
            expect(TARGET_PROCEDURES).toContain('160218510');
            expect(TARGET_PROCEDURES).toContain('150011310');
        });
    });

    describe('COLONOSCOPY_SPECIAL_ADDITIONS', () => {
        it('内視鏡的大腸ポリープ・粘膜切除術の特定加算コードが配列として定義されている', () => {
            expect(Array.isArray(COLONOSCOPY_SPECIAL_ADDITIONS)).toBe(true);
            expect(COLONOSCOPY_SPECIAL_ADDITIONS.length).toBeGreaterThan(0);
        });

        it('コードはすべて文字列である', () => {
            COLONOSCOPY_SPECIAL_ADDITIONS.forEach(code => {
                expect(typeof code).toBe('string');
            });
        });

        it('正しいコードを含んでいる', () => {
            expect(COLONOSCOPY_SPECIAL_ADDITIONS).toContain('150429570');
            expect(COLONOSCOPY_SPECIAL_ADDITIONS).toContain('150437170');
        });

        it('重複するコードが含まれていない', () => {
            const uniqueCodes = new Set(COLONOSCOPY_SPECIAL_ADDITIONS);
            expect(uniqueCodes.size).toBe(COLONOSCOPY_SPECIAL_ADDITIONS.length);
        });
    });

    describe('DEFAULT_RESULT_HEADER', () => {
        it('デフォルトの結果ヘッダーが文字列として定義されている', () => {
            expect(typeof DEFAULT_RESULT_HEADER).toBe('string');
            expect(DEFAULT_RESULT_HEADER.length).toBeGreaterThan(0);
        });

        it('タブ区切りの形式である', () => {
            expect(DEFAULT_RESULT_HEADER.includes('\t')).toBe(true);
        });

        it('正しいヘッダー文字列である', () => {
            // 更新された出力フォーマットに合わせて期待値を修正
            expect(DEFAULT_RESULT_HEADER).toBe('データ識別番号\t入院年月日\t退院年月日\t短手３対象症例\t理由');
        });
    });

    describe('MAX_HOSPITAL_DAYS', () => {
        it('入院期間の最大日数が数値として定義されている', () => {
            expect(typeof MAX_HOSPITAL_DAYS).toBe('number');
        });

        it('正の整数である', () => {
            expect(Number.isInteger(MAX_HOSPITAL_DAYS)).toBe(true);
            expect(MAX_HOSPITAL_DAYS).toBeGreaterThan(0);
        });

        it('5日間と定義されている', () => {
            expect(MAX_HOSPITAL_DAYS).toBe(5);
        });
    });
});