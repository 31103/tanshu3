import { FileValidationResult } from '../../core/file-processor'; // Import from file-processor
import { ErrorHandlerOptions } from '../../core/common/types'; // Import from common/types
import { notificationSystem } from './notification';
import { validateFiles } from '../../core/validator';

/**
 * ファイル管理クラス
 * ファイルの選択、表示、管理を行うコンポーネント
 */
export class FileManager {
  private fileInput: HTMLInputElement;
  private fileInfoArea: HTMLElement;
  private clearButton: HTMLButtonElement;
  private executeButton: HTMLButtonElement;
  private dropArea: HTMLElement;
  private selectedFiles: File[] = [];
  private validFiles: number = 0;

  /**
   * ファイル管理クラスのコンストラクタ
   */
  constructor() {
    // DOM要素の取得
    this.fileInput = document.getElementById('fileInput') as HTMLInputElement;
    this.fileInfoArea = document.getElementById('fileInfoArea') as HTMLElement;
    this.clearButton = document.getElementById('clearButton') as HTMLButtonElement;
    this.executeButton = document.getElementById('executeButton') as HTMLButtonElement;
    this.dropArea = document.getElementById('dropArea') as HTMLElement;

    if (
      !this.fileInput ||
      !this.fileInfoArea ||
      !this.clearButton ||
      !this.executeButton ||
      !this.dropArea
    ) {
      throw new Error('必要なDOM要素が見つかりません');
    }

    this.setupEventListeners();
  }

  /**
   * イベントリスナーのセットアップ
   */
  private setupEventListeners(): void {
    // ファイル選択ボタン
    const fileSelectButton = document.getElementById('fileSelectButton');
    if (fileSelectButton) {
      fileSelectButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.fileInput.click();
      });
    }

    // ファイル選択時の処理
    this.fileInput.addEventListener('change', () => {
      this.processNewFiles(Array.from(this.fileInput.files || []));
    });

    // ドラッグ&ドロップ処理
    this.dropArea.addEventListener('dragover', (e) => this.handleDragOver(e)); // Use public method
    this.dropArea.addEventListener('dragleave', (e) => this.handleDragLeave(e)); // Use public method
    this.dropArea.addEventListener('drop', (e) => this.handleDrop(e)); // Use public method

    // キーボード操作のサポート
    this.dropArea.addEventListener('keydown', (e) => {
      // Enterキーまたはスペースキーでファイル選択ダイアログを開く
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.fileInput.click();
      }
    });

    // ドロップエリア全体をクリック可能に
    this.dropArea.addEventListener('click', (e) => {
      // buttonの場合は、buttonのイベントに任せる
      if ((e.target as HTMLElement).tagName !== 'BUTTON') {
        this.fileInput.click();
      }
    });

    // クリアボタンの処理
    this.clearButton.addEventListener('click', () => {
      this.clearFiles();
    });

    // ファイル削除ボタンのイベントリスナー (イベント委譲)
    this.fileInfoArea.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.classList.contains('delete-file-button')) {
        const fileName = target.dataset.filename;
        if (fileName) {
          this.removeFile(fileName);
        }
      }
    });
  }

  /**
   * ドラッグオーバーイベントのハンドラ
   * @param event ドラッグイベント
   */
  public handleDragOver(event: DragEvent): void {
    // Changed to public
    event.preventDefault(); // デフォルトの処理をキャンセル
    this.dropArea.classList.add('drag-over');
  }

  /**
   * ドラッグリーブイベントのハンドラ
   * @param event ドラッグイベント
   */
  public handleDragLeave(event: DragEvent): void {
    // Changed to public
    event.preventDefault();
    this.dropArea.classList.remove('drag-over');
  }

  /**
   * ドロップイベントのハンドラ
   * @param event ドラッグイベント
   */
  public handleDrop(event: DragEvent): void {
    // Changed to public
    event.preventDefault();
    this.dropArea.classList.remove('drag-over');

    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      // ドロップされたファイルを処理
      this.processNewFiles(Array.from(event.dataTransfer.files));
    }
  }

  /**
   * 新しく選択されたファイルを処理する
   * @param files 処理対象のファイル配列
   */
  public async processNewFiles(files: File[]): Promise<void> {
    // async と Promise<void> を追加
    // テキストファイルのみをフィルタリング
    const textFiles = Array.from(files).filter(
      (file) => file.type === 'text/plain' || file.name.endsWith('.txt'),
    );

    // テキストファイル以外が含まれていた場合
    if (textFiles.length < files.length) {
      this.handleError(new Error('テキストファイル以外が含まれています'), 'file-format');
      return;
    }

    // 既に追加されているファイルと重複するものを確認
    const existingFileNames = Array.from(this.selectedFiles).map((f) => f.name);
    const newFiles = textFiles.filter((file) => !existingFileNames.includes(file.name));
    const duplicateCount = textFiles.length - newFiles.length;

    // 新しいファイルを追加
    newFiles.forEach((file) => this.selectedFiles.push(file));

    // ファイル情報を更新
    this.updateFileInfo();

    // 結果をユーザーに通知
    if (newFiles.length === 0 && textFiles.length > 0) {
      // Check if only duplicates were added
      this.handleError(new Error('すべてのファイルが既に追加されています'), 'file-duplicate', {
        recoveryAction: {
          message: '既存のファイルをクリアして新しいファイルを追加しますか？',
          label: 'クリアして追加',
          handler: () => {
            this.selectedFiles = [...textFiles]; // Keep only the newly added (duplicate) files after clearing
            this.updateFileInfo();
            notificationSystem.showToast(
              'success',
              'ファイル更新完了',
              `${textFiles.length}ファイルを追加しました`,
            );
            this.validateSelectedFiles(); // Re-validate after clearing and adding
          },
        },
      });
    } else if (duplicateCount > 0) {
      notificationSystem.showToast(
        'warning',
        'ファイル重複',
        `${newFiles.length}ファイルを追加しました (${duplicateCount}ファイルは重複)`, // Show count of actually added files
        5000,
        3,
      );
    } else if (newFiles.length > 0) {
      // Only show success if new files were actually added
      notificationSystem.showToast(
        'success',
        'ファイル追加完了',
        `${newFiles.length}ファイルを追加しました`,
        5000,
        2,
      );
    }

    // 新しいファイルがある場合、または重複のみでもファイルが選択されている場合は検証を実行
    if (newFiles.length > 0 || this.selectedFiles.length > 0) {
      await this.validateSelectedFiles(); // await を追加
    }
  }

  /**
   * 選択されたファイルをクリアする
   */
  public clearFiles(): void {
    // 選択されたファイルをクリア
    this.selectedFiles = [];
    this.fileInput.value = '';
    this.validFiles = 0;

    // ファイル情報表示を更新
    this.updateFileInfo();

    // イベント通知
    const event = new CustomEvent('filesClear');
    document.dispatchEvent(event);

    notificationSystem.showToast('info', 'クリア完了', 'ファイル選択をクリアしました');
  }

  /**
   * 指定されたファイルをリストから削除する
   * @param fileName 削除するファイル名
   */
  public removeFile(fileName: string): void {
    const initialLength = this.selectedFiles.length;
    this.selectedFiles = this.selectedFiles.filter((file) => file.name !== fileName);

    // ファイルが実際に削除されたか確認
    if (this.selectedFiles.length < initialLength) {
      notificationSystem.showToast('info', 'ファイル削除', `${fileName} を削除しました`);
      this.updateFileInfo(); // UIを更新
      this.validateSelectedFiles(); // 再検証して実行ボタンの状態を更新
    }
  }

  /**
   * 選択されたファイルを検証する
   */
  public async validateSelectedFiles(): Promise<boolean> {
    if (this.selectedFiles.length === 0) {
      this.updateFileInfo(); // Ensure UI reflects no files selected
      return false;
    }

    try {
      // 外部のvalidateFilesモジュールを使用
      const results = await validateFiles(this.selectedFiles);
      this.updateValidationUI(results);

      // 有効なファイル数を計算（型情報を明示的に指定）
      this.validFiles = results.filter((result: FileValidationResult) => result.isValid).length;

      // 実行ボタンの有効/無効を更新
      this.executeButton.disabled = this.validFiles === 0;

      return this.validFiles > 0;
    } catch (error) {
      this.handleError(
        error instanceof Error ? error : new Error('不明なエラー'),
        'file-validation',
      );
      this.executeButton.disabled = true; // Disable execute button on validation error
      return false;
    }
  }

  /**
   * 検証結果をUIに反映する
   * @param results 検証結果の配列
   */
  private updateValidationUI(results: FileValidationResult[]): void {
    // ファイル情報UIを更新
    this.updateFileInfo(results);
  }

  /**
   * ファイル情報表示を更新する
   * @param validationResults 検証結果があれば反映
   */
  private updateFileInfo(validationResults?: FileValidationResult[]): void {
    // ファイルが選択されているか確認
    if (this.selectedFiles.length === 0) {
      this.fileInfoArea.innerHTML = '<p class="no-file-message">ファイルが選択されていません</p>';
      this.clearButton.disabled = true;
      this.executeButton.disabled = true;
      return;
    }

    // ファイルアイテムのHTMLを生成
    let html = '';

    this.selectedFiles.forEach((file) => {
      // 検証結果を探す
      type FileStatus = {
        status: string;
        messages: Array<{ type: string; text: string }>;
      };
      let fileStatus: FileStatus = { status: 'pending', messages: [] };

      if (validationResults) {
        const result = validationResults.find((r) => r.file === file);
        if (result) {
          fileStatus = {
            status: result.isValid ? (result.warnings.length > 0 ? 'warning' : 'valid') : 'error',
            messages: [
              ...result.errors.map((msg: string) => ({ type: 'error', text: msg })), // Add string type to msg
              ...result.warnings.map((msg: string) => ({ type: 'warning', text: msg })), // Add string type to msg
            ],
          };
        }
      }

      html += `
        <div class="file-item">
          <div class="file-icon">📄</div>
          <div class="file-name">${file.name}</div>
      `;

      // バリデーションメッセージがある場合は表示
      if (fileStatus.messages && fileStatus.messages.length > 0) {
        html += '<div class="validation-feedback">';
        fileStatus.messages.forEach((msg: { type: string; text: string }) => {
          let icon = '';
          switch (msg.type) {
            case 'error':
              icon = '❌';
              break;
            case 'warning':
              icon = '⚠️';
              break;
            case 'info':
              icon = 'ℹ️';
              break;
          }
          html += `
            <div class="validation-message ${msg.type}">
              <span class="validation-icon">${icon}</span>
              <span class="validation-text">${msg.text}</span>
            </div>
          `;
        });
        html += '</div>';
      } else if (fileStatus.status === 'valid') {
        html += `
          <div class="validation-feedback">
            <div class="validation-message success">
              <span class="validation-icon">✅</span>
              <span class="validation-text">ファイル形式は有効です</span>
            </div>
          </div>
        `;
      }

      // 削除ボタンを最後（右側）に配置
      html += `
          <button class="delete-file-button" data-filename="${file.name}" aria-label="${file.name} を削除">×</button>
        </div>`; // file-item end
    });

    // HTMLを適用
    this.fileInfoArea.innerHTML = html;
    this.clearButton.disabled = false;
    // Execute button state is handled by validateSelectedFiles
  }

  /**
   * エラーを処理する
   * @param error エラーオブジェクト
   * @param context エラーが発生したコンテキスト
   * @param options 追加オプション
   */
  private handleError(error: Error, context: string, options: ErrorHandlerOptions = {}): void {
    console.error(`エラー (${context}):`, error);

    // エラータイプに基づいて適切なメッセージと解決策を提供
    let title = 'エラーが発生しました';
    const message = error.message || 'エラーが発生しました';
    let solution = '';
    const priority = 4; // エラーは高い優先度

    switch (context) {
      case 'file-format':
        title = 'ファイル形式エラー';
        solution = 'テキストファイル(.txt)のみ追加できます。ファイル形式を確認してください';
        break;

      case 'file-validation':
        title = 'ファイル検証エラー';
        solution = '正しい形式のEF統合ファイルであることを確認してください';
        break;

      case 'file-duplicate':
        title = 'ファイル重複';
        solution = '別のファイルを選択するか、既存のファイルをクリアしてください';
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

  /**
   * 選択されたファイルを取得
   * @returns 選択されたファイル配列
   */
  public getSelectedFiles(): File[] {
    return this.selectedFiles;
  }

  /**
   * 有効なファイル数を取得
   * @returns 有効なファイル数
   */
  public getValidFileCount(): number {
    return this.validFiles;
  }
}

// グローバルでアクセス可能なインスタンスを作成
let fileManagerInstance: FileManager | null = null;

// インスタンスを取得または作成する関数
/**
 * インスタンスを取得または作成する関数
 * @returns FileManagerのインスタンス
 */
export function getFileManager(): FileManager {
  if (!fileManagerInstance) {
    // DOMが準備できているか確認
    if (document.readyState === 'loading') {
      throw new Error('DOM is not ready. Call this function after DOMContentLoaded');
    }
    fileManagerInstance = new FileManager();
  }
  return fileManagerInstance;
}

// 既存のexport文を削除し、新しい初期化方法を使用
export const fileManager = {
  get instance(): FileManager {
    // 戻り値の型を追加
    return getFileManager();
  },
};
