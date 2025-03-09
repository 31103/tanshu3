/**
 * 短期滞在手術等基本料３判定プログラム - メインアプリケーション
 *
 * このファイルは、アプリケーションのエントリーポイントです。
 * 各コンポーネントの初期化と連携を行います。
 */
import { fileManager } from '../ui/components/file-manager';
import { resultViewer } from '../ui/components/result-viewer';
import { stepManager } from '../ui/components/step-manager';
import { notificationSystem } from '../ui/components/notification';
import { fileProcessor } from '../core/file-processor';
/**
 * アプリケーションクラス
 */
class Application {
    constructor() {
        this.loadingIndicator = null;
        this.executeButton = null;
    }
    /**
     * アプリケーションの初期化
     */
    init() {
        // DOM要素の取得
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.executeButton = document.getElementById('executeButton');
        // イベントリスナーの設定
        this.setupEventListeners();
        // 初期ステップの設定
        stepManager.updateStep(0);
        // 初期化完了のログ
        console.log('短期滞在手術等基本料３判定プログラムが初期化されました');
    }
    /**
     * イベントリスナーの設定
     */
    setupEventListeners() {
        // 実行ボタンのイベント
        if (this.executeButton) {
            this.executeButton.addEventListener('click', () => {
                this.processFiles();
            });
        }
        // 他のイベントリスナーを設定...
        document.addEventListener('filesClear', () => {
            stepManager.updateStep(0);
        });
    }
    /**
     * ファイル処理の実行
     */
    async processFiles() {
        try {
            // ステップを更新
            stepManager.updateStep(2);
            // ファイルが選択されているか確認
            const selectedFiles = fileManager.getSelectedFiles();
            if (selectedFiles.length === 0) {
                this.handleError(new Error('ファイルが選択されていません'), 'no-files', {
                    recoveryAction: {
                        message: 'ファイルを選択してください',
                        label: 'ファイル選択',
                        handler: () => {
                            const fileInput = document.getElementById('fileInput');
                            if (fileInput)
                                fileInput.click();
                        }
                    }
                });
                return;
            }
            // 処理中表示
            if (this.loadingIndicator) {
                this.loadingIndicator.classList.add('active');
            }
            // ファイルの検証
            const isValid = await fileManager.validateSelectedFiles();
            if (!isValid) {
                if (this.loadingIndicator) {
                    this.loadingIndicator.classList.remove('active');
                }
                stepManager.updateStep(1);
                return;
            }
            // 処理の実行
            const resultText = await fileProcessor.processFiles(selectedFiles);
            // 結果の表示
            resultViewer.displayResult(resultText);
            // ステップを更新
            stepManager.updateStep(3);
            // 成功通知
            notificationSystem.showToast('success', '処理完了', '処理が正常に完了しました', 5000, 2);
        }
        catch (error) {
            this.handleError(error instanceof Error ? error : new Error('不明なエラー'), 'processing', {
                recoveryAction: {
                    message: '設定を変更して再試行しますか？',
                    label: '再試行',
                    handler: () => {
                        if (this.executeButton)
                            this.executeButton.click();
                    }
                },
                updateUI: () => {
                    // エラー時のUI更新
                    stepManager.updateStep(1);
                }
            });
        }
        finally {
            // 処理中表示を非表示
            if (this.loadingIndicator) {
                this.loadingIndicator.classList.remove('active');
            }
        }
    }
    /**
     * エラーハンドリング
     * @param error エラーオブジェクト
     * @param context エラーコンテキスト
     * @param options 追加オプション
     */
    handleError(error, context, options = {}) {
        console.error(`エラー (${context}):`, error);
        // エラータイプに基づいて適切なメッセージと解決策を提供
        let title = 'エラーが発生しました';
        let message = error.message || 'エラーが発生しました';
        let solution = '';
        let priority = 4; // エラーは高い優先度
        switch (context) {
            case 'processing':
                title = '処理エラー';
                if (error.message.includes('メモリ')) {
                    solution = 'ファイルサイズが大きすぎる可能性があります。小さなファイルに分割して処理してください';
                }
                else {
                    solution = '入力データを確認し、再度実行してください';
                }
                break;
            case 'no-files':
                title = 'ファイル未選択';
                message = 'ファイルが選択されていません';
                solution = 'ファイルを選択してから処理を実行してください';
                break;
            default:
                solution = '問題が解決しない場合は、ページを再読み込みしてください';
        }
        // 解決策がある場合はメッセージに追加
        const fullMessage = solution ? `${message}<br><span class="error-solution">解決策: ${solution}</span>` : message;
        // 通知を表示
        notificationSystem.showToast('error', title, fullMessage, 8000, priority);
        // エラー回復のためのアクションを提供
        if (options.recoveryAction && options.recoveryAction.message &&
            options.recoveryAction.label && options.recoveryAction.handler) {
            const recoveryAction = {
                message: options.recoveryAction.message,
                label: options.recoveryAction.label,
                handler: options.recoveryAction.handler
            };
            setTimeout(() => {
                notificationSystem.showRecoveryToast(recoveryAction);
            }, 1000);
        }
        // エラー状態をUIに反映
        if (options.updateUI) {
            options.updateUI();
        }
    }
}
// DOMContentLoaded イベントで初期化
document.addEventListener('DOMContentLoaded', () => {
    const app = new Application();
    app.init();
});
//# sourceMappingURL=main.js.map