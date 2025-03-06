/**
 * サンプルテスト
 * 
 * このファイルはJestの設定が正しく機能しているかを確認するためのものです。
 */

describe('基本的なテスト', () => {
    it('trueはtrueであるべき', () => {
        expect(true).toBe(true);
    });

    it('基本的な算術演算が正しい', () => {
        expect(1 + 1).toBe(2);
        expect(2 * 3).toBe(6);
        expect(10 - 5).toBe(5);
        expect(20 / 4).toBe(5);
    });
});

// 非同期処理のテスト
describe('非同期テスト', () => {
    it('Promiseが解決される', async () => {
        const result = await Promise.resolve('success');
        expect(result).toBe('success');
    });

    it('タイムアウト後にPromiseが解決される', async () => {
        const result = await new Promise((resolve) => {
            setTimeout(() => resolve('timeout success'), 100);
        });
        expect(result).toBe('timeout success');
    });
});

// 例外処理のテスト
describe('例外テスト', () => {
    it('エラーがスローされる', () => {
        const throwError = () => {
            throw new Error('テストエラー');
        };
        expect(throwError).toThrow('テストエラー');
    });
}); 