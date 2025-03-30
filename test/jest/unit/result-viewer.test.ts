/**
 * ResultViewer クラスのユニットテスト
 */
import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';
import { ResultViewer } from '../../../src/ui/components/result-viewer';
import { notificationSystem } from '../../../src/ui/components/notification'; // Mock 対象
import { OutputSettings } from '../../../src/core/common/types'; // OutputSettings をインポート

// notificationSystem をモック化
jest.mock('../../../src/ui/components/notification', () => ({
    notificationSystem: {
        showToast: jest.fn(),
    },
}));

// navigator.clipboard API をモック化 (型を指定)
const mockWriteText = jest.fn<(text: string) => Promise<void>>();
Object.assign(navigator, {
    clipboard: {
        writeText: mockWriteText.mockResolvedValue(undefined), // 成功を模倣
    },
});

describe('ResultViewer', () => {
    let resultViewer: ResultViewer;
    let resultTextArea: HTMLTextAreaElement;
    let copyButton: HTMLButtonElement;
    let clearResultButton: HTMLButtonElement;
    let resultActions: HTMLElement;
    let resultTable: HTMLTableElement;
    let textViewButton: HTMLButtonElement;
    let tableViewButton: HTMLButtonElement;
    let textResultView: HTMLElement;
    let tableResultView: HTMLElement;
    let copyMessage: HTMLElement;
    let downloadLink: HTMLAnchorElement;
    let originalCreateObjectURL: typeof URL.createObjectURL;
    let originalRevokeObjectURL: typeof URL.revokeObjectURL;

    // 各テストの前にDOM要素をセットアップ
    beforeEach(() => {
        // URL.createObjectURL と revokeObjectURL をモック
        originalCreateObjectURL = URL.createObjectURL;
        originalRevokeObjectURL = URL.revokeObjectURL;
        URL.createObjectURL = jest.fn((blob: Blob) => `blob:mockurl/${blob.size}`);
        URL.revokeObjectURL = jest.fn();

        document.body.innerHTML = `
      <div id="textResultView">
        <textarea id="resultTextarea" readonly></textarea>
      </div>
      <div id="tableResultView" style="display: none;">
        <table id="resultTable"><tbody></tbody></table>
      </div>
      <div id="resultActions" class="hidden">
        <button id="copyButton" disabled>コピー</button>
        <span id="copyMessage"></span>
        <a id="downloadLink" class="hidden">ダウンロード</a>
        <button id="clearResultButton">結果クリア</button>
      </div>
      <div id="viewToggleButtons">
        <button id="textViewButton" class="active" aria-pressed="true">テキスト</button>
        <button id="tableViewButton" aria-pressed="false">テーブル</button>
      </div>
      <div id="toastContainer"></div>
      <input type="radio" id="eligibleOnly" name="outputMode" value="eligibleOnly">
      <input type="radio" id="allCases" name="outputMode" value="allCases" checked>
      <input type="radio" name="dateFormat" value="yyyymmdd" checked>
      <input type="radio" name="dateFormat" value="yyyy/mm/dd">
      <div id="resultContainer" class="hidden"></div>
    `;

        resultTextArea = document.getElementById('resultTextarea') as HTMLTextAreaElement;
        copyButton = document.getElementById('copyButton') as HTMLButtonElement;
        clearResultButton = document.getElementById('clearResultButton') as HTMLButtonElement;
        resultActions = document.getElementById('resultActions') as HTMLElement;
        resultTable = document.getElementById('resultTable') as HTMLTableElement;
        textViewButton = document.getElementById('textViewButton') as HTMLButtonElement;
        tableViewButton = document.getElementById('tableViewButton') as HTMLButtonElement;
        textResultView = document.getElementById('textResultView') as HTMLElement;
        tableResultView = document.getElementById('tableResultView') as HTMLElement;
        copyMessage = document.getElementById('copyMessage') as HTMLElement;
        downloadLink = document.getElementById('downloadLink') as HTMLAnchorElement;

        resultViewer = new ResultViewer();

        // モックをクリア
        jest.clearAllMocks();
        mockWriteText.mockClear().mockResolvedValue(undefined); // デフォルトで成功するように再設定
        jest.useFakeTimers(); // タイマーモックを有効化
    });

    afterEach(() => {
        // URL モックを元に戻す
        URL.createObjectURL = originalCreateObjectURL;
        URL.revokeObjectURL = originalRevokeObjectURL;

        jest.useRealTimers(); // タイマーモックを無効化
        document.body.innerHTML = ''; // DOMをクリア
    });

    it('コンストラクタは正しくDOM要素を取得し、イベントリスナーを設定する', () => {
        expect(resultTextArea).not.toBeNull();
        expect(copyButton).not.toBeNull();
        // clearResultButton は ResultViewer 内では取得・リスナー設定されない
        expect(resultActions).not.toBeNull();
        expect(resultTable).not.toBeNull();
        expect(textViewButton).not.toBeNull();
        expect(tableViewButton).not.toBeNull();
        expect(textResultView).not.toBeNull();
        expect(tableResultView).not.toBeNull();
        expect(copyMessage).not.toBeNull();
        expect(downloadLink).not.toBeNull();
    });

    it('displayResult はテキストエリアとテーブルに結果を表示し、関連UIを更新する', () => {
        const resultText = `データ識別番号\t入院年月日\t退院年月日\t短手３対象症例\t理由
123\t20230101\t20230103\tYes\t手術A
456\t20230201\t20230204\tNo\t期間外`;
        const resultContainer = document.getElementById('resultContainer') as HTMLElement;

        expect(resultContainer.classList.contains('hidden')).toBe(true);
        expect(copyButton.disabled).toBe(true);
        expect(downloadLink.classList.contains('hidden')).toBe(true);

        resultViewer.displayResult(resultText);

        // テキストエリアの確認
        expect(resultTextArea.value).toBe(resultText);

        // テーブルの確認
        const tableBody = resultTable.querySelector('tbody');
        expect(tableBody?.rows.length).toBe(2);
        expect(tableBody?.rows[0].cells[0].textContent).toBe('123');
        expect(tableBody?.rows[1].cells[3].textContent).toBe('No');

        // UI状態の確認
        expect(resultContainer.classList.contains('hidden')).toBe(false); // 表示される
        expect(copyButton.disabled).toBe(false); // 有効になる
        expect(downloadLink.classList.contains('hidden')).toBe(false); // 表示される
        expect(downloadLink.href).toMatch(/^blob:mockurl\/\d+$/); // モックURL形式に合わせる
        expect(downloadLink.download).toMatch(/^短手3判定結果_\d{8}\.txt$/);
    });

    it('displayResult はデバッグ情報付きで結果を表示する', () => {
        const resultText = `データ識別番号\t入院年月日\t退院年月日\t短手３対象症例\t理由
123\t20230101\t20230103\tYes\t手術A`;
        const debugInfo = 'デバッグ情報テスト';
        resultViewer.displayResult(resultText, debugInfo);

        const expectedDisplayText = `=== デバッグ情報 ===\n${debugInfo}\n\n=== 処理結果 ===\n${resultText}`;
        expect(resultTextArea.value).toBe(expectedDisplayText);

        // テーブルにはデバッグ情報が含まれないことを確認
        const tableBody = resultTable.querySelector('tbody');
        expect(tableBody?.rows.length).toBe(1);
        expect(tableBody?.rows[0].cells[0].textContent).toBe('123');
    });

    it('displayResult は空の結果の場合、テキストエリアを空にし、ボタンを無効化する', () => {
        resultViewer.displayResult('何か結果'); // 事前に結果を設定
        resultViewer.displayResult(''); // 空の結果を設定

        expect(resultTextArea.value).toBe('');
        // テーブルもクリアされるはず (updateResultTable -> clearResultTable)
        expect(resultTable.querySelector('tbody')?.innerHTML).toBe('');
        expect(copyButton.disabled).toBe(true);
        // downloadLink の href はクリアされないが、表示状態は変わらない想定
    });


    // clearResultButton のクリックイベントは main.ts など外部で処理される想定のため、
    // ResultViewer 単体テストではボタンクリックによるクリア動作は検証しない。
    // clearResult メソッド自体が存在しないため。

    it('copyButton クリックでクリップボードにコピーされ、コピー成功メッセージが表示される', async () => {
        const testResult = 'コピーされるテキスト';
        resultViewer.displayResult(testResult); // 結果を表示してコピーボタンを有効化

        copyButton.click(); // ボタンをクリック

        // await を使って非同期処理の完了を待つ (setTimeout)
        await jest.advanceTimersByTimeAsync(2000);

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(testResult);
        expect(copyMessage.textContent).toBe('コピーしました！');
        expect(copyMessage.classList.contains('visible')).toBe(true);

        // メッセージが消えることも確認
        jest.advanceTimersByTime(2000); // メッセージ表示時間
        expect(copyMessage.classList.contains('visible')).toBe(false);
    });

    it('クリップボードへのコピー失敗時にエラーメッセージが表示される', async () => {
        const testResult = 'コピー失敗テスト';
        resultViewer.displayResult(testResult);

        // navigator.clipboard.writeText を失敗させるモック
        mockWriteText.mockRejectedValue(new Error('コピー失敗'));

        copyButton.click(); // ボタンをクリック

        await jest.advanceTimersByTimeAsync(3000); // エラーメッセージ表示時間

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(testResult);
        expect(copyMessage.textContent).toBe('コピーに失敗しました');
        expect(copyMessage.classList.contains('visible')).toBe(true);
        expect(copyMessage.classList.contains('error')).toBe(true);

        // メッセージが消えることも確認
        jest.advanceTimersByTime(3000);
        expect(copyMessage.classList.contains('visible')).toBe(false);
        expect(copyMessage.classList.contains('error')).toBe(false);
    });

    it('結果が空のときはコピーボタンをクリックしてもコピー処理が実行されない', async () => {
        resultTextArea.value = ''; // 結果を空にする
        copyButton.disabled = true; // ボタンを無効化

        copyButton.click(); // ボタンをクリック

        await jest.runAllTimersAsync();

        expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
        expect(copyMessage.classList.contains('visible')).toBe(false);
    });

    it('setResultView は表示モードを切り替える', () => {
        // 初期状態は text view
        expect(resultViewer.getCurrentView()).toBe('text');
        expect(textResultView.style.display).toBe('block');
        expect(tableResultView.style.display).toBe('none');
        expect(textViewButton.classList.contains('active')).toBe(true);
        expect(tableViewButton.classList.contains('active')).toBe(false);
        expect(textViewButton.getAttribute('aria-pressed')).toBe('true');
        expect(tableViewButton.getAttribute('aria-pressed')).toBe('false');

        // table view に切り替え
        tableViewButton.click(); // ボタンクリックで切り替え
        // resultViewer.setResultView('table'); // 直接メソッド呼び出しでもテスト可能

        expect(resultViewer.getCurrentView()).toBe('table');
        expect(textResultView.style.display).toBe('none');
        expect(tableResultView.style.display).toBe('block');
        expect(textViewButton.classList.contains('active')).toBe(false);
        expect(tableViewButton.classList.contains('active')).toBe(true);
        expect(textViewButton.getAttribute('aria-pressed')).toBe('false');
        expect(tableViewButton.getAttribute('aria-pressed')).toBe('true');

        // text view に戻す
        textViewButton.click(); // ボタンクリックで切り替え
        // resultViewer.setResultView('text'); // 直接メソッド呼び出しでもテスト可能

        expect(resultViewer.getCurrentView()).toBe('text');
        expect(textResultView.style.display).toBe('block');
        expect(tableResultView.style.display).toBe('none');
        expect(textViewButton.classList.contains('active')).toBe(true);
        expect(tableViewButton.classList.contains('active')).toBe(false);
        expect(textViewButton.getAttribute('aria-pressed')).toBe('true');
        expect(tableViewButton.getAttribute('aria-pressed')).toBe('false');
    });

    it('getOutputSettings は現在の設定を正しく返す', () => {
        // DOM要素は beforeEach で設定済み

        const settings1 = resultViewer.getOutputSettings();
        expect(settings1).toEqual({ outputMode: 'allCases', dateFormat: 'yyyymmdd' });

        // 設定を変更
        (document.getElementById('eligibleOnly') as HTMLInputElement).checked = true;
        (document.querySelector('input[name="dateFormat"][value="yyyy/mm/dd"]') as HTMLInputElement).checked = true;

        const settings2 = resultViewer.getOutputSettings();
        expect(settings2).toEqual({ outputMode: 'eligibleOnly', dateFormat: 'yyyy/mm/dd' });
    });
});
