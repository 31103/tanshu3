/**
 * 短期滞在手術等基本料３判定プログラム - メインアプリケーション
 *
 * このファイルは、アプリケーションのエントリーポイントです。
 * 各コンポーネントの初期化と連携を行います。
 */
import { fileManager } from '../ui/components/file-manager';
import { resultViewer } from '../ui/components/result-viewer';
import { notificationSystem } from '../ui/components/notification';
import { fileProcessor } from '../core/file-processor';
import { ErrorHandlerOptions } from '../types/types';

/**
 * アプリケーションクラス
 */
class Application {
  private loadingIndicator: HTMLElement | null = null;
  private executeButton: HTMLButtonElement | null = null;
  private fileManagerInstance = fileManager.instance;

  /**
   * アプリケーションの初期化
   */
  public init(): void {
    // DOM要素の取得
    this.loadingIndicator = document.getElementById('loadingIndicator');
    this.executeButton = document.getElementById('executeButton') as HTMLButtonElement;

    // イベントリスナーの設定
    this.setupEventListeners();
  }

  /**
   * イベントリスナーの設定
   */
  private setupEventListeners(): void {
    // 実行ボタンのイベント
    if (this.executeButton) {
      this.executeButton.addEventListener('click', () => {
        this.processFiles();
      });
    }

    // 他のイベントリスナーを設定...
    document.addEventListener('filesClear', () => {
      // ファイルクリア時の処理（ステップ更新は削除）
    });
  }

  /**
   * ファイル処理の実行
   */
  private async processFiles(): Promise<void> {
    try {
      // ファイルが選択されているか確認
      const selectedFiles = this.fileManagerInstance.getSelectedFiles();
      if (selectedFiles.length === 0) {
        this.handleError(new Error('ファイルが選択されていません'), 'no-files', {
          recoveryAction: {
            message: 'ファイルを選択してください',
            label: 'ファイル選択',
            handler: () => {
              const fileInput = document.getElementById('fileInput');
              if (fileInput) fileInput.click();
            },
          },
        });
        return;
      }

      // 処理中表示
      if (this.loadingIndicator) {
        this.loadingIndicator.classList.add('active');
      }

      // ファイルの検証
      const isValid = await this.fileManagerInstance.validateSelectedFiles();
      if (!isValid) {
        if (this.loadingIndicator) {
          this.loadingIndicator.classList.remove('active');
        }
        // ステップ更新は削除
        return;
      }

      // UIから出力設定を取得
      const outputSettings = resultViewer.getOutputSettings();

      // 処理の実行 (設定を渡す)
      const resultText = await fileProcessor.processFiles(selectedFiles, outputSettings);

      // 結果の表示
      resultViewer.displayResult(resultText);

      // 成功通知
      notificationSystem.showToast('success', '処理完了', '処理が正常に完了しました', 5000, 2);
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error('不明なエラー'), 'processing', {
        recoveryAction: {
          message: '設定を変更して再試行しますか？',
          label: '再試行',
          handler: () => {
            if (this.executeButton) this.executeButton.click();
          },
        },
        updateUI: () => {
          // エラー時のUI更新（ステップ更新は削除）
        },
      });
    } finally {
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
  private handleError(error: Error, context: string, options: ErrorHandlerOptions = {}): void {
    console.error(`エラー (${context}):`, error);

    // エラータイプに基づいて適切なメッセージと解決策を提供
    let title = 'エラーが発生しました';
    let message = error.message || 'エラーが発生しました';
    let solution = '';
    const priority = 4; // エラーは高い優先度

    switch (context) {
      case 'processing':
        title = '処理エラー';
        if (error.message.includes('メモリ')) {
          solution =
            'ファイルサイズが大きすぎる可能性があります。小さなファイルに分割して処理してください';
        } else {
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
    const fullMessage = solution
      ? `${message}<br><span class="error-solution">解決策: ${solution}</span>`
      : message;

    // 通知を表示
    notificationSystem.showToast('error', title, fullMessage, 8000, priority);

    // エラー回復のためのアクションを提供
    if (
      options.recoveryAction &&
      options.recoveryAction.message &&
      options.recoveryAction.label &&
      options.recoveryAction.handler
    ) {
      const recoveryAction = {
        message: options.recoveryAction.message,
        label: options.recoveryAction.label,
        handler: options.recoveryAction.handler,
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
  try {
    const app = new Application();
    app.init();
  } catch (error) {
    console.error('初期化エラー:', error);
    // エラーメッセージを画面に表示
    const errorDiv = document.createElement('div');
    errorDiv.className = 'initialization-error';
    errorDiv.textContent = '初期化中にエラーが発生しました。ページを再読み込みしてください。';
    document.body.prepend(errorDiv);
  }
});
