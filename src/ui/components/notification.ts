import { ToastData, TypePriorityMap } from '../../types/types';

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
    this.toastContainer =
      document.getElementById(containerId) || this.createToastContainer(containerId);
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

    // 表示数を制限
    this.manageActiveToasts();

    // 通知を表示
    this.renderToast(toastData);
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
   * アクティブな通知を管理
   */
  private manageActiveToasts(): void {
    // 表示数を制限
    if (this.activeToasts.length > this.MAX_VISIBLE_TOASTS) {
      // 優先度の低い通知を非表示にする
      const visibleToasts = this.activeToasts.slice(0, this.MAX_VISIBLE_TOASTS);
      const hiddenToasts = this.activeToasts.slice(this.MAX_VISIBLE_TOASTS);

      // 非表示にする通知を削除
      hiddenToasts.forEach((toast) => {
        if (toast.element) {
          this.removeToastElement(toast.id);
        }
      });

      // 集約通知を表示（複数の通知がある場合）
      if (hiddenToasts.length > 1) {
        const highestPriorityType = this.getHighestPriorityType(hiddenToasts);
        this.showAggregateToast(hiddenToasts.length, highestPriorityType);
      }

      // アクティブリストを更新
      this.activeToasts = visibleToasts;
    }
  }

  /**
   * 最も優先度の高い通知タイプを取得
   * @param toasts 通知の配列
   * @returns 最も優先度の高い通知タイプ
   */
  private getHighestPriorityType(toasts: ToastData[]): 'success' | 'warning' | 'error' | 'info' {
    const typePriority: TypePriorityMap = { error: 4, warning: 3, info: 2, success: 1 };
    let highestType: 'success' | 'warning' | 'error' | 'info' = 'info';

    toasts.forEach((toast) => {
      if (typePriority[toast.type] > typePriority[highestType]) {
        highestType = toast.type;
      }
    });

    return highestType;
  }

  /**
   * 集約通知を表示
   * @param count 集約する通知の数
   * @param type 通知タイプ
   */
  private showAggregateToast(count: number, type: 'success' | 'warning' | 'error' | 'info'): void {
    const aggregateToastId = 'toast-aggregate';

    // 既存の集約通知を削除
    const existingAggregate = document.getElementById(aggregateToastId);
    if (existingAggregate) {
      existingAggregate.parentNode?.removeChild(existingAggregate);
    }

    // 新しい集約通知を作成
    const toast = document.createElement('div');
    toast.id = aggregateToastId;
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');

    // アイコンを設定
    let icon = '';
    switch (type) {
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

    // 通知の内容を設定
    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-content">
        <h3 class="toast-title">その他の通知</h3>
        <p class="toast-message">他に${count}件の通知があります</p>
      </div>
      <button class="toast-view-all" aria-label="すべての通知を表示">表示</button>
    `;

    // 通知をコンテナに追加
    this.toastContainer.appendChild(toast);

    // 「すべて表示」ボタンのイベントリスナーを設定
    const viewAllButton = toast.querySelector('.toast-view-all');
    viewAllButton?.addEventListener('click', () => this.showNotificationHistory());
  }

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

// グローバルでアクセス可能なインスタンスを作成
export const notificationSystem = new NotificationSystem();
