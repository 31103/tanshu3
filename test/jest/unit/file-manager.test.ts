/**
 * FileManager クラスのユニットテスト
 */
import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import { FileManager, getFileManager } from '../../../src/ui/components/file-manager';
import { notificationSystem } from '../../../src/ui/components/notification'; // Mock 対象
import { validateFiles } from '../../../src/core/validator'; // Mock 対象
import { FileValidationResult } from '../../../src/core/file-processor'; // FileValidationResult をインポート

// notificationSystem と validateFiles をモック化
jest.mock('../../../src/ui/components/notification', () => ({
    notificationSystem: {
        showToast: jest.fn(),
        showRecoveryToast: jest.fn(),
    },
}));
// validateFiles のモックに関数の型シグネチャを指定
jest.mock('../../../src/core/validator', () => ({
    validateFiles: jest.fn<() => Promise<FileValidationResult[]>>(),
}));

// validateFiles のモックを型付けして取得 (テスト内で使用するため)
const mockedValidateFiles = validateFiles as jest.MockedFunction<typeof validateFiles>;


describe('FileManager', () => {
    let fileManager: FileManager;
    let fileInput: HTMLInputElement;
    let fileInfoArea: HTMLElement;
    let clearButton: HTMLButtonElement;
    let executeButton: HTMLButtonElement;
    let dropArea: HTMLElement;
    let fileSelectButton: HTMLButtonElement;

    // 各テストの前にDOM要素をセットアップ
    beforeEach(() => {
        document.body.innerHTML = `
      <div id="dropArea" tabindex="0">
        <input type="file" id="fileInput" multiple style="display: none;">
        <button id="fileSelectButton">ファイル選択</button>
        <div id="fileInfoArea"></div>
        <button id="clearButton" disabled>クリア</button>
        <button id="executeButton" disabled>実行</button>
      </div>
      <div id="toastContainer"></div>
      <button id="notificationHistoryButton" class="hidden"></button>
    `;

        // モックをクリア
        jest.clearAllMocks();

        // FileManager インスタンスを作成 (シングルトンパターンを考慮)
        // getFileManager を直接呼び出すのではなく、インスタンスを new で作成してテスト
        fileManager = new FileManager();

        // DOM要素を再取得
        fileInput = document.getElementById('fileInput') as HTMLInputElement;
        fileInfoArea = document.getElementById('fileInfoArea') as HTMLElement;
        clearButton = document.getElementById('clearButton') as HTMLButtonElement;
        executeButton = document.getElementById('executeButton') as HTMLButtonElement;
        dropArea = document.getElementById('dropArea') as HTMLElement;
        fileSelectButton = document.getElementById('fileSelectButton') as HTMLButtonElement;
    });

    it('コンストラクタは正しくDOM要素を取得し、イベントリスナーを設定する', () => {
        expect(fileInput).not.toBeNull();
        expect(fileInfoArea).not.toBeNull();
        expect(clearButton).not.toBeNull();
        expect(executeButton).not.toBeNull();
        expect(dropArea).not.toBeNull();
        // イベントリスナーの設定は直接テストしにくいが、要素が存在することを確認
    });

    it('ファイル選択ボタンクリックで fileInput.click() が呼ばれる', () => {
        const clickSpy = jest.spyOn(fileInput, 'click');
        fileSelectButton.click();
        expect(clickSpy).toHaveBeenCalled();
    });

    it('processNewFiles は新しいテキストファイルを追加し、UIを更新する', async () => {
        const file1 = new File(['content1'], 'file1.txt', { type: 'text/plain' });
        const file2 = new File(['content2'], 'file2.txt', { type: 'text/plain' });

        // validateFiles モックの設定 (キャスト不要)
        mockedValidateFiles.mockResolvedValue([
            { file: file1, isValid: true, warnings: [], errors: [] },
            { file: file2, isValid: true, warnings: [], errors: [] },
        ]);

        await fileManager.processNewFiles([file1, file2]);

        expect(fileManager.getSelectedFiles().length).toBe(2);
        expect(fileInfoArea.querySelectorAll('.file-item').length).toBe(2);
        expect(fileInfoArea.textContent).toContain('file1.txt');
        expect(fileInfoArea.textContent).toContain('file2.txt');
        expect(clearButton.disabled).toBe(false);
        expect(executeButton.disabled).toBe(false); // 検証結果が true なので有効になるはず
        expect(notificationSystem.showToast).toHaveBeenCalledWith(
            'success',
            'ファイル追加完了',
            '2ファイルを追加しました',
            5000,
            2,
        );
        expect(validateFiles).toHaveBeenCalledWith([file1, file2]);
    });

    it('processNewFiles は非テキストファイルを拒否し、エラーを表示する', async () => {
        const file1 = new File(['content1'], 'file1.txt', { type: 'text/plain' });
        const file2 = new File([''], 'image.png', { type: 'image/png' }); // 非テキストファイル

        await fileManager.processNewFiles([file1, file2]);

        expect(fileManager.getSelectedFiles().length).toBe(0); // ファイルは追加されない
        expect(fileInfoArea.textContent).toContain('ファイルが選択されていません');
        expect(notificationSystem.showToast).toHaveBeenCalledWith(
            'error',
            'ファイル形式エラー',
            expect.stringContaining('テキストファイル以外が含まれています'),
            8000,
            4,
        );
        expect(validateFiles).not.toHaveBeenCalled(); // 検証は呼ばれない
    });

    it('processNewFiles は重複ファイルを無視し、警告を表示する', async () => {
        const file1 = new File(['content1'], 'file1.txt', { type: 'text/plain' });
        const file2 = new File(['content2'], 'file2.txt', { type: 'text/plain' });

        // validateFiles モックの設定 (キャスト不要)
        mockedValidateFiles.mockResolvedValue([
            { file: file1, isValid: true, warnings: [], errors: [] },
        ]);
        await fileManager.processNewFiles([file1]); // 最初に file1 を追加

        // 再度 file1 と file2 を追加しようとする (キャスト不要)
        mockedValidateFiles.mockResolvedValue([
            { file: file1, isValid: true, warnings: [], errors: [] }, // file1 は検証済み
            { file: file2, isValid: true, warnings: [], errors: [] }, // file2 は新規
        ]);
        await fileManager.processNewFiles([file1, file2]);

        expect(fileManager.getSelectedFiles().length).toBe(2); // file1 と file2
        expect(fileInfoArea.querySelectorAll('.file-item').length).toBe(2);
        expect(notificationSystem.showToast).toHaveBeenCalledWith(
            'warning',
            'ファイル重複',
            '1ファイルを追加しました (1ファイルは重複)',
            5000,
            3,
        );
        // validateSelectedFiles が呼ばれることを確認
        expect(validateFiles).toHaveBeenCalledTimes(2); // 2回呼ばれるはず
    });

    it('clearFiles は選択されたファイルをクリアし、UIをリセットする', async () => {
        const file1 = new File(['content1'], 'file1.txt', { type: 'text/plain' });
        // validateFiles モックの設定 (キャスト不要)
        mockedValidateFiles.mockResolvedValue([
            { file: file1, isValid: true, warnings: [], errors: [] },
        ]);
        await fileManager.processNewFiles([file1]); // ファイルを追加

        // filesClear イベントを監視
        const clearEventSpy = jest.fn();
        document.addEventListener('filesClear', clearEventSpy);

        fileManager.clearFiles();

        expect(fileManager.getSelectedFiles().length).toBe(0);
        expect(fileInfoArea.textContent).toContain('ファイルが選択されていません');
        expect(clearButton.disabled).toBe(true);
        expect(executeButton.disabled).toBe(true);
        expect(fileInput.value).toBe('');
        expect(notificationSystem.showToast).toHaveBeenCalledWith(
            'info',
            'クリア完了',
            'ファイル選択をクリアしました',
        );
        expect(clearEventSpy).toHaveBeenCalled();

        // イベントリスナーを削除
        document.removeEventListener('filesClear', clearEventSpy);
    });

    it('validateSelectedFiles は検証結果に応じて実行ボタンの状態を更新する', async () => {
        const file1 = new File(['content1'], 'file1.txt', { type: 'text/plain' });
        const file2 = new File(['invalid'], 'file2.txt', { type: 'text/plain' });

        // 1. 両方有効な場合 (キャスト不要)
        mockedValidateFiles.mockResolvedValue([
            { file: file1, isValid: true, warnings: [], errors: [] },
            { file: file2, isValid: true, warnings: [], errors: [] },
        ]);
        await fileManager.processNewFiles([file1, file2]);
        expect(executeButton.disabled).toBe(false);
        expect(fileManager.getValidFileCount()).toBe(2);

        // 2. 一部無効な場合 (キャスト不要)
        mockedValidateFiles.mockResolvedValue([
            { file: file1, isValid: true, warnings: [], errors: [] },
            { file: file2, isValid: false, warnings: [], errors: ['エラーあり'] },
        ]);
        await fileManager.validateSelectedFiles(); // 再検証
        expect(executeButton.disabled).toBe(false); // 1つでも有効なら有効
        expect(fileManager.getValidFileCount()).toBe(1);
        expect(fileInfoArea.textContent).toContain('エラーあり');

        // 3. 全て無効な場合 (キャスト不要)
        mockedValidateFiles.mockResolvedValue([
            { file: file1, isValid: false, warnings: [], errors: ['エラー1'] },
            { file: file2, isValid: false, warnings: [], errors: ['エラー2'] },
        ]);
        await fileManager.validateSelectedFiles(); // 再検証
        expect(executeButton.disabled).toBe(true);
        expect(fileManager.getValidFileCount()).toBe(0);
    });

    // ドラッグ＆ドロップのテスト（イベント発火のシミュレーション）
    it('ドラッグオーバーで drag-over クラスが付与される', () => {
        const dragOverEvent = new DragEvent('dragover', { bubbles: true, cancelable: true });
        dropArea.dispatchEvent(dragOverEvent);
        expect(dropArea.classList.contains('drag-over')).toBe(true);
    });

    it('ドラッグリーブで drag-over クラスが削除される', () => {
        dropArea.classList.add('drag-over'); // 事前にクラスを追加
        const dragLeaveEvent = new DragEvent('dragleave', { bubbles: true, cancelable: true });
        dropArea.dispatchEvent(dragLeaveEvent);
        expect(dropArea.classList.contains('drag-over')).toBe(false);
    });

    // ドロップイベントのテストは DataTransfer のモックが複雑なため、ここでは基本的な動作のみ確認
    it('ドロップイベントで processNewFiles が呼ばれる（ファイルがある場合）', () => {
        const processSpy = jest.spyOn(fileManager, 'processNewFiles');
        const file = new File(['content'], 'drop.txt', { type: 'text/plain' });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);

        const dropEvent = new DragEvent('drop', { dataTransfer, bubbles: true, cancelable: true });
        dropArea.dispatchEvent(dropEvent);

        expect(processSpy).toHaveBeenCalledWith([file]);
    });
});
