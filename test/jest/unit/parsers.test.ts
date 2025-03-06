/**
 * parsers.ts モジュールのテスト
 * 
 * ファイル解析関連の機能をテストします。
 */

import { parseEFFile, mergeCases } from '../../../src/core/common/parsers.js';
import { CaseData } from '../../../src/core/common/types.js';

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
        const content = `ヘッダー1\tヘッダー2\tヘッダー3\tヘッダー4\tヘッダー5\tヘッダー6\tヘッダー7\tヘッダー8\tヘッダー9
データ1\t12345\t20220101\t20220101\tその他\tその他\tその他\tその他\t123456`;

        const result = parseEFFile(content);

        expect(result.length).toBe(1);
        expect(result[0]).toEqual({
            id: '12345',
            admission: '20220101',
            discharge: '20220101',
            procedures: ['123456']
        });
    });

    it('同一患者の複数の手術コードを適切に統合する', () => {
        const content = `ヘッダー1\tヘッダー2\tヘッダー3\tヘッダー4\tヘッダー5\tヘッダー6\tヘッダー7\tヘッダー8\tヘッダー9
データ1\t12345\t20220101\t20220101\tその他\tその他\tその他\tその他\t123456
データ2\t12345\t20220101\t20220101\tその他\tその他\tその他\tその他\t789012`;

        const result = parseEFFile(content);

        expect(result.length).toBe(1);
        expect(result[0].procedures).toContain('123456');
        expect(result[0].procedures).toContain('789012');
        expect(result[0].procedures.length).toBe(2);
    });

    it('パイプ区切りのデータを正しく処理する', () => {
        const content = `ヘッダー行
データ部|データ1\t12345\t20220101\t20220101\tその他\tその他\tその他\tその他\t123456`;

        const result = parseEFFile(content);

        expect(result.length).toBe(1);
        expect(result[0]).toEqual({
            id: '12345',
            admission: '20220101',
            discharge: '20220101',
            procedures: ['123456']
        });
    });

    it('無効な行は無視される', () => {
        const content = `ヘッダー1\tヘッダー2\tヘッダー3
無効なデータ行
データ1\t12345\t20220101\t20220101\tその他\tその他\tその他\tその他\t123456`;

        const result = parseEFFile(content);

        expect(result.length).toBe(1);
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
                procedures: ['123456']
            }
        ];

        const newCases: CaseData[] = [
            {
                id: '12345',
                admission: '20220101',
                discharge: '20220105', // 確定した退院日
                procedures: ['789012']
            }
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
                procedures: ['123456']
            }
        ];

        const newCases: CaseData[] = [
            {
                id: '67890', // 新しいID
                admission: '20220201',
                discharge: '20220205',
                procedures: ['789012']
            }
        ];

        const result = mergeCases(existingCases, newCases);

        expect(result.length).toBe(2);
        expect(result.find(c => c.id === '67890')).toBeTruthy();
    });

    it('手術コードの重複が排除される', () => {
        const existingCases: CaseData[] = [
            {
                id: '12345',
                admission: '20220101',
                discharge: '20220105',
                procedures: ['123456', '789012']
            }
        ];

        const newCases: CaseData[] = [
            {
                id: '12345',
                admission: '20220101',
                discharge: '20220105',
                procedures: ['789012', '345678'] // 一部重複するコード
            }
        ];

        const result = mergeCases(existingCases, newCases);

        expect(result.length).toBe(1);
        expect(result[0].procedures).toContain('123456');
        expect(result[0].procedures).toContain('789012');
        expect(result[0].procedures).toContain('345678');
        expect(result[0].procedures.length).toBe(3); // 重複は1つだけ排除
    });
}); 