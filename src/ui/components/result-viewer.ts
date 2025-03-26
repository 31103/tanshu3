import { OutputSettings } from '../../types/types';

/**
 * 結果表示クラス
 * テキスト/テーブル形式での結果表示を管理するコンポーネント
 */
export class ResultViewer {
    private resultTextarea: HTMLTextAreaElement;
    private resultTable: HTMLTableElement;
    private textViewButton: HTMLButtonElement;
    private tableViewButton: HTMLButtonElement;
    private textResultView: HTMLElement;
    private tableResultView: HTMLElement;
    private copyButton: HTMLButtonElement;
    private copyMessage: HTMLElement;
    private downloadLink: HTMLAnchorElement;
    private currentView: 'text' | 'table' = 'text';

    /**
     * 結果表示クラスのコンストラクタ
     */
    constructor() {
        // DOM要素の取得
        this.resultTextarea = document.getElementById('resultTextarea') as HTMLTextAreaElement;
        this.resultTable = document.getElementById('resultTable') as HTMLTableElement;
        this.textViewButton = document.getElementById('textViewButton') as HTMLButtonElement;
        this.tableViewButton = document.getElementById('tableViewButton') as HTMLButtonElement;
        this.textResultView = document.getElementById('textResultView') as HTMLElement;
        this.tableResultView = document.getElementById('tableResultView') as HTMLElement;
        this.copyButton = document.getElementById('copyButton') as HTMLButtonElement;
        this.copyMessage = document.getElementById('copyMessage') as HTMLElement;
        this.downloadLink = document.getElementById('downloadLink') as HTMLAnchorElement;

        if (!this.resultTextarea || !this.resultTable || !this.textViewButton ||
            !this.tableViewButton || !this.textResultView || !this.tableResultView ||
            !this.copyButton || !this.copyMessage || !this.downloadLink) {
            throw new Error('必要なDOM要素が見つかりません');
        }

        this.setupEventListeners();
    }

    /**
     * イベントリスナーのセットアップ
     */
    private setupEventListeners(): void {
        // 表示切替ボタンのイベント
        this.textViewButton.addEventListener('click', () => {
            this.setResultView('text');
        });

        this.tableViewButton.addEventListener('click', () => {
            this.setResultView('table');
        });

        // コピーボタンのイベント
        this.copyButton.addEventListener('click', () => {
            this.copyResultToClipboard();
        });
    }

    /**
     * 結果表示モードを設定する
     * @param viewMode 表示モード ('text' または 'table')
     */
    public setResultView(viewMode: 'text' | 'table'): void {
        this.currentView = viewMode;

        if (viewMode === 'text') {
            this.textResultView.style.display = 'block';
            this.tableResultView.style.display = 'none';
            this.textViewButton.classList.add('active');
            this.tableViewButton.classList.remove('active');
            this.textViewButton.setAttribute('aria-pressed', 'true');
            this.tableViewButton.setAttribute('aria-pressed', 'false');
        } else {
            this.textResultView.style.display = 'none';
            this.tableResultView.style.display = 'block';
            this.textViewButton.classList.remove('active');
            this.tableViewButton.classList.add('active');
            this.textViewButton.setAttribute('aria-pressed', 'false');
            this.tableViewButton.setAttribute('aria-pressed', 'true');
        }
    }

    /**
     * 結果をクリップボードにコピーする
     */
    private copyResultToClipboard(): void {
        if (!this.resultTextarea.value) return;

        // テキストをクリップボードにコピー
        this.resultTextarea.select();
        document.execCommand('copy');

        // 選択を解除
        window.getSelection()?.removeAllRanges();

        // コピー成功メッセージを表示
        this.copyMessage.textContent = 'コピーしました！';
        this.copyMessage.classList.add('visible');

        // メッセージを一定時間後に消す
        setTimeout(() => {
            this.copyMessage.classList.remove('visible');
        }, 2000);
    }

    /**
     * 結果を表示する
     * @param resultText 結果のテキストデータ
     */
    public displayResult(resultText: string, debugInfo?: string): void {
        if (!resultText) return;

        // デバッグ情報がある場合は、結果の前に追加
        const displayText = debugInfo
            ? `=== デバッグ情報 ===\n${debugInfo}\n\n=== 処理結果 ===\n${resultText}`
            : resultText;

        // テキストエリアに表示
        this.resultTextarea.value = displayText;

        // テーブルに表示（デバッグ情報は除外）
        this.updateResultTable(resultText);

        // 結果表示エリアを表示
        const resultContainer = document.getElementById('resultContainer');
        if (resultContainer) {
            resultContainer.classList.remove('hidden');
        }

        // 保存用リンクを更新
        this.updateDownloadLink(resultText);
    }

    /**
     * 結果テーブルをクリアする
     */
    private clearResultTable(): void {
        const tbody = this.resultTable.querySelector('tbody');
        if (tbody) {
            tbody.innerHTML = '';
        }
    }

    /**
     * 結果テーブルを更新する
     * @param resultText タブ区切りのテキスト結果
     */
    private updateResultTable(resultText: string): void {
        if (!resultText) return;

        const tbody = this.resultTable.querySelector('tbody');
        if (!tbody) return;

        this.clearResultTable();

        // テキストを行に分割
        const lines = resultText.trim().split('\n');

        // ヘッダー行をスキップして2行目から処理
        for (let i = 1; i < lines.length; i++) {
            const columns = lines[i].split('\t');

            // 行が正しいフォーマットかチェック
            if (columns.length >= 5) {
                const row = document.createElement('tr');

                // 各列のデータをセルに追加
                for (let j = 0; j < 5; j++) {
                    const cell = document.createElement('td');
                    cell.textContent = columns[j];

                    // 短手３対象症例の列に特別なスタイルを適用
                    if (j === 3) {
                        if (columns[j] === 'Yes') {
                            cell.classList.add('eligible-yes');
                        } else {
                            cell.classList.add('eligible-no');
                        }
                    }

                    row.appendChild(cell);
                }

                tbody.appendChild(row);
            }
        }
    }

    /**
     * ダウンロードリンクを更新する
     * @param resultText 結果テキスト
     */
    private updateDownloadLink(resultText: string): void {
        const blob = new Blob([resultText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        // 既存のURLを解放
        if (this.downloadLink.href) {
            URL.revokeObjectURL(this.downloadLink.href);
        }

        // 新しいURLを設定
        this.downloadLink.href = url;

        // ファイル名の設定
        const date = new Date();
        const dateStr = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
        this.downloadLink.setAttribute('download', `短手3判定結果_${dateStr}.txt`);

        // ダウンロードリンクを表示
        this.downloadLink.classList.remove('hidden');
    }

    /**
     * 現在の表示モードを取得
     * @returns 現在の表示モード
     */
    public getCurrentView(): 'text' | 'table' {
        return this.currentView;
    }

    /**
     * 表示用設定を取得
     * @returns 出力設定
     */
    public getOutputSettings(): OutputSettings {
        const eligibleOnlyRadio = document.getElementById('eligibleOnly') as HTMLInputElement;
        const dateFormatRadios = document.querySelectorAll('input[name="dateFormat"]') as NodeListOf<HTMLInputElement>;

        let dateFormat = 'YYYYMMDD';
        for (const radio of Array.from(dateFormatRadios)) {
            if (radio.checked) {
                dateFormat = radio.value;
                break;
            }
        }

        return {
            outputMode: eligibleOnlyRadio?.checked ? 'eligibleOnly' : 'allCases',
            dateFormat
        };
    }
}

// グローバルでアクセス可能なインスタンスを作成
export const resultViewer = new ResultViewer();