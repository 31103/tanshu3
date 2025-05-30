// トースト通知型
export interface ToastData {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: number;
  priority: number;
  duration: number;
  element?: HTMLElement;
}

// タイプ優先度マップ (削除予定だが、他の箇所で使われている可能性を考慮し一旦残す)
export interface TypePriorityMap {
  [key: string]: number;
  error: number;
  warning: number;
  info: number;
  success: number;
}

/**
 * 通知システム
 * ユーザーへの通知表示を管理するモジュール
 */
export class NotificationSystem {
  private toastContainer: HTMLElement;
  private activeToasts: ToastData[] = [];
  private toastHistory: Partial<ToastData>[] = [];
  private readonly MAX_VISIBLE_TOASTS = 3;
  private readonly MAX_HISTORY_ITEMS = 10;

  /**
   * 通知システムのコンストラクタ
   * @param containerId 通知コンテナのID
   */
  constructor(containerId: string = 'toastContainer') {
    this.toastContainer = document.getElementById(containerId) ||
      this.createToastContainer(containerId);
    this.setupHistoryButton();
  }

  /**
   * トースト通知コンテナを作成
   * @param containerId コンテナID
   * @returns 作成されたコンテナ要素
   */
  private createToastContainer(containerId: string): HTMLElement {
    const container = document.createElement('div');
    container.id = containerId;
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
  }

  /**
   * 履歴ボタンの初期設定
   */
  private setupHistoryButton(): void {
    let historyButton = document.getElementById('notificationHistoryButton');
    if (!historyButton) {
      historyButton = document.createElement('button');
      historyButton.id = 'notificationHistoryButton';
      historyButton.className = 'notification-history-button hidden';
      historyButton.setAttribute('aria-label', '通知履歴を表示');
      historyButton.innerHTML = '<span class="history-icon">🔔</span>';
      document.body.appendChild(historyButton);

      historyButton.addEventListener('click', () => this.showNotificationHistory());
    }
  }

  /**
   * トースト通知を表示
   * @param type 通知タイプ（success, warning, error, info）
   * @param title 通知タイトル
   * @param message 通知メッセージ
   * @param duration 表示時間（ミリ秒）
   * @param priority 優先度（1-5、5が最高）
   */
  public showToast(
    type: 'success' | 'warning' | 'error' | 'info',
    title: string,
    message: string,
    duration: number = 5000,
    priority: number = 3,
  ): void {
    // 通知オブジェクトを作成
    const timestamp = Date.now();
    const toastId = 'toast-' + timestamp;
    const toastData: ToastData = {
      id: toastId,
      type,
      title,
      message,
      timestamp,
      priority,
      duration,
    };

    // 通知履歴に追加
    this.addToastToHistory(toastData);

    // 通知を表示キューに追加
    this.activeToasts.push(toastData);

    // 優先度順にソート（優先度が高く、新しいものが上位）
    this.activeToasts.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return b.timestamp - a.timestamp;
    });

    // 表示数を制限し、アクティブリストを更新
    this.manageActiveToasts();

    // このトーストが表示対象として残っている場合のみレンダリング
    if (this.activeToasts.some((toast) => toast.id === toastId)) {
      this.renderToast(toastData);
    }
  }

  /**
   * 通知履歴に追加
   * @param toastData 通知データ
   */
  private addToastToHistory(toastData: ToastData): void {
    // 履歴に追加
    this.toastHistory.unshift({
      type: toastData.type,
      title: toastData.title,
      message: toastData.message,
      timestamp: toastData.timestamp,
    });

    // 履歴の最大数を制限
    if (this.toastHistory.length > this.MAX_HISTORY_ITEMS) {
      this.toastHistory = this.toastHistory.slice(0, this.MAX_HISTORY_ITEMS);
    }

    // 履歴ボタンを更新
    this.updateHistoryButton();
  }

  /**
   * 履歴ボタンを更新
   */
  private updateHistoryButton(): void {
    const historyButton = document.getElementById('notificationHistoryButton');
    if (historyButton && this.toastHistory.length > 0) {
      historyButton.classList.remove('hidden');
      historyButton.setAttribute('data-count', this.toastHistory.length.toString());
    }
  }

  /**
   * アクティブな通知を管理（表示上限のみ）
   */
  private manageActiveToasts(): void {
    // 常に優先度と時間でソートしておく
    this.activeToasts.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // 優先度高い順
      }
      return b.timestamp - a.timestamp; // 新しい順
    });

    // 表示上限を超えている場合
    if (this.activeToasts.length > this.MAX_VISIBLE_TOASTS) {
      // 表示されるトーストと隠れるトーストに分ける
      const visibleToasts = this.activeToasts.slice(0, this.MAX_VISIBLE_TOASTS);
      const hiddenToasts = this.activeToasts.slice(this.MAX_VISIBLE_TOASTS);

      // 隠れるトーストの要素をDOMから削除
      hiddenToasts.forEach((toast) => {
        if (toast.element) {
          this.removeToastElement(toast.id);
        }
      });

      // アクティブリストを表示されるものだけに更新
      this.activeToasts = visibleToasts;
    }
    // 集約通知関連のロジックは削除
  }

  // 不要になった getHighestPriorityType メソッドを削除

  // 不要になった showAggregateToast メソッドを削除

  /**
   * 通知履歴を表示
   */
  public showNotificationHistory(): void {
    // 既存の履歴モーダルを削除
    const existingModal = document.getElementById('notificationHistoryModal');
    if (existingModal) {
      existingModal.parentNode?.removeChild(existingModal);
    }

    // 履歴モーダルを作成
    const modal = document.createElement('div');
    modal.id = 'notificationHistoryModal';
    modal.className = 'notification-history-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-labelledby', 'notificationHistoryTitle');
    modal.setAttribute('aria-modal', 'true');

    // 履歴リストを作成
    let historyItems = '';
    this.toastHistory.forEach((item) => {
      if (item.timestamp) {
        const date = new Date(item.timestamp);
        const timeString = date.toLocaleTimeString();
        historyItems += `
          <div class="history-item history-item-${item.type}">
            <div class="history-item-time">${timeString}</div>
            <div class="history-item-content">
              <h4 class="history-item-title">${item.title || ''}</h4>
              <p class="history-item-message">${item.message || ''}</p>
            </div>
          </div>
        `;
      }
    });

    // モーダルの内容を設定
    modal.innerHTML = `
      <div class="notification-history-content">
        <div class="notification-history-header">
          <h3 id="notificationHistoryTitle">通知履歴</h3>
          <button class="notification-history-close" aria-label="履歴を閉じる">×</button>
        </div>
        <div class="notification-history-list">
          ${historyItems.length ? historyItems : '<p class="no-history">通知履歴はありません</p>'}
        </div>
        <div class="notification-history-footer">
          <button class="secondary-button notification-history-clear">履歴をクリア</button>
          <button class="primary-button notification-history-close-btn">閉じる</button>
        </div>
      </div>
    `;

    // モーダルをページに追加
    document.body.appendChild(modal);

    // モーダルを表示（アニメーション用）
    setTimeout(() => {
      modal.classList.add('active');
    }, 10);

    // 閉じるボタンのイベントリスナーを設定
    const closeButtons = modal.querySelectorAll(
      '.notification-history-close, .notification-history-close-btn',
    );
    closeButtons.forEach((button) => {
      button.addEventListener('click', () => {
        this.closeNotificationHistory();
      });
    });

    // クリアボタンのイベントリスナーを設定
    const clearButton = modal.querySelector('.notification-history-clear');
    clearButton?.addEventListener('click', () => {
      this.clearNotificationHistory();
      this.closeNotificationHistory();
    });

    // モーダル外クリックで閉じる
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeNotificationHistory();
      }
    });

    // ESCキーで閉じる
    document.addEventListener('keydown', this.handleHistoryEscKey);
  }

  /**
   * 履歴モーダルのESCキーハンドラ
   */
  private handleHistoryEscKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      this.closeNotificationHistory();
    }
  };

  /**
   * 通知履歴モーダルを閉じる
   */
  private closeNotificationHistory(): void {
    const modal = document.getElementById('notificationHistoryModal');
    if (modal) {
      modal.classList.remove('active');
      setTimeout(() => {
        if (modal.parentNode) {
          modal.parentNode.removeChild(modal);
        }
      }, 300);
    }

    // ESCキーイベントリスナーを削除
    document.removeEventListener('keydown', this.handleHistoryEscKey);
  }

  /**
   * 通知履歴をクリア
   */
  public clearNotificationHistory(): void {
    this.toastHistory = [];
    this.updateHistoryButton();
  }

  /**
   * トースト通知を描画
   * @param toastData 通知データ
   */
  private renderToast(toastData: ToastData): void {
    // トーストのHTML構造を作成
    const toast = document.createElement('div');
    toast.id = toastData.id;
    toast.className = `toast toast-${toastData.type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');

    // アイコンを設定
    let icon = '';
    switch (toastData.type) {
      case 'success':
        icon = '✅';
        break;
      case 'warning':
        icon = '⚠️';
        break;
      case 'error':
        icon = '❌';
        break;
      case 'info':
        icon = 'ℹ️';
        break;
    }

    // トーストの内容を設定
    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-content">
        <h3 class="toast-title">${toastData.title}</h3>
        <p class="toast-message">${toastData.message}</p>
      </div>
      <button class="toast-close" aria-label="通知を閉じる">×</button>
    `;

    // トーストをコンテナに追加
    this.toastContainer.appendChild(toast);

    // 要素への参照を保存
    toastData.element = toast;

    // 閉じるボタンのイベントリスナーを設定
    const closeButton = toast.querySelector('.toast-close');
    closeButton?.addEventListener('click', () => {
      this.removeToast(toastData.id);
    });

    // 一定時間後に自動的に閉じる
    if (toastData.duration > 0) {
      setTimeout(() => {
        this.removeToast(toastData.id);
      }, toastData.duration);
    }
  }

  /**
   * トースト通知を削除
   * @param toastId 削除するトーストのID
   */
  public removeToast(toastId: string): void {
    // アクティブリストから削除
    this.activeToasts = this.activeToasts.filter((toast) => toast.id !== toastId);

    // 要素を削除
    this.removeToastElement(toastId);
  }

  /**
   * トースト要素を削除
   * @param toastId 削除するトースト要素のID
   */
  private removeToastElement(toastId: string): void {
    const toast = document.getElementById(toastId);
    if (toast) {
      // フェードアウトのためのスタイルを適用
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';

      // アニメーション完了後に要素を削除
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }
  }

  /**
   * エラー回復のための通知を表示
   * @param action 回復アクション情報
   */
  public showRecoveryToast(action: { message: string; label: string; handler: () => void }): void {
    const recoveryToastId = 'toast-recovery-' + Date.now();
    const toast = document.createElement('div');
    toast.id = recoveryToastId;
    toast.className = 'toast toast-info';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');

    toast.innerHTML = `
      <div class="toast-icon">🔄</div>
      <div class="toast-content">
        <h3 class="toast-title">回復アクション</h3>
        <p class="toast-message">${action.message}</p>
      </div>
      <button class="toast-action" aria-label="${action.label}">${action.label}</button>
      <button class="toast-close" aria-label="通知を閉じる">×</button>
    `;

    this.toastContainer.appendChild(toast);

    // アクションボタンのイベントリスナーを設定
    const actionButton = toast.querySelector('.toast-action');
    actionButton?.addEventListener('click', () => {
      action.handler();
      this.removeToastElement(recoveryToastId);
    });

    // 閉じるボタンのイベントリスナーを設定
    const closeButton = toast.querySelector('.toast-close');
    closeButton?.addEventListener('click', () => {
      this.removeToastElement(recoveryToastId);
    });

    // 一定時間後に自動的に閉じる
    setTimeout(() => {
      this.removeToastElement(recoveryToastId);
    }, 15000); // 回復アクションは長めに表示
  }
}

// グローバルインスタンス（遅延初期化）
let notificationSystemInstance: NotificationSystem | null = null;

/**
 * NotificationSystem のシングルトンインスタンスを取得する関数
 * @returns NotificationSystem のインスタンス
 */
export function getNotificationSystem(): NotificationSystem {
  if (!notificationSystemInstance) {
    // DOMが準備できているか確認してからインスタンス化
    if (typeof document === 'undefined' || document.readyState === 'loading') {
      // DOM準備前に呼ばれた場合のエラーハンドリング（テスト環境などを考慮）
      // 仮のコンテナIDで初期化するか、エラーを投げるか検討。
      // ここでは、テスト環境で document が未定義の場合を考慮し、
      // documentアクセスを避けるか、モックを期待する。
      // 実際のブラウザ環境では DOMContentLoaded 後に呼ばれる想定。
      // 簡単のため、ここではインスタンス化を試みる。
      // テスト側で document を適切にモックする必要がある。
      try {
        notificationSystemInstance = new NotificationSystem();
      } catch (e) {
        // document が利用できない場合のエラー処理
        console.error('Failed to initialize NotificationSystem likely due to missing document.', e);
        // 代替実装やエラーを投げるなど、適切な処理を追加
        throw new Error('NotificationSystem cannot be initialized without a document.');
      }
    } else {
      notificationSystemInstance = new NotificationSystem();
    }
  }
  if (!notificationSystemInstance) {
    // 上記 try-catch で初期化失敗した場合のフォールバック
    throw new Error('Failed to get NotificationSystem instance.');
  }
  return notificationSystemInstance;
}

// notificationSystem を直接エクスポートする代わりにゲッターを使用
// export const notificationSystem = getNotificationSystem(); // これは即時実行されるためNG
