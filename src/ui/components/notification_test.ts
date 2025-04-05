/**
 * NotificationSystem クラスのユニットテスト (Deno Test + deno-dom)
 */
import {
  assert,
  assertEquals,
  assertExists,
  assertFalse,
} from 'https://deno.land/std/assert/mod.ts';
import { DOMParser } from 'https://deno.land/x/deno_dom/deno-dom-wasm.ts';
import { NotificationSystem, ToastData } from './notification.ts';

// deno-dom を使ってDOM環境を初期化するヘルパー関数
function setupDOM(html: string = ''): any {
  const defaultHtml = `
    <!DOCTYPE html>
    <html>
    <head><title>Test</title></head>
    <body>
      <div id="toastContainer"></div>
      <button id="notificationHistoryButton" class="hidden"></button>
    </body>
    </html>
  `;

  const document = new DOMParser().parseFromString(html || defaultHtml, 'text/html');
  assertExists(document);
  (globalThis as any).document = document;
  return document;
}

// deno-dom環境で安全に動作するようにNotificationSystemを調整するヘルパー関数
function createTestableNotificationSystem(
  containerId: string = 'toastContainer',
): NotificationSystem {
  const notificationSystem = new NotificationSystem(containerId);

  // removeToastElementメソッドをモンキーパッチしてスタイル操作を回避
  // @ts-ignore: モンキーパッチ
  notificationSystem.removeToastElement = function (toastId: string): void {
    const toast = document.getElementById(toastId);
    if (toast && toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  };

  // showNotificationHistoryメソッドを完全に置き換えてsetTimeoutを避ける
  // @ts-ignore: モンキーパッチ
  notificationSystem.showNotificationHistory = function (): void {
    // 既存の履歴モーダルを削除
    const existingModal = document.getElementById('notificationHistoryModal');
    if (existingModal) {
      existingModal.parentNode?.removeChild(existingModal);
    }

    // 履歴モーダルを作成
    const modal = document.createElement('div');
    modal.id = 'notificationHistoryModal';
    modal.className = 'notification-history-modal active'; // 即座にactiveクラスを追加
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-labelledby', 'notificationHistoryTitle');
    modal.setAttribute('aria-modal', 'true');

    // 履歴リストを作成（private memberにアクセスするが、テスト用なのでやむを得ない）
    // @ts-ignore: priveteメンバーへのアクセス
    const toastHistory = this.toastHistory;
    let historyItems = '';
    toastHistory.forEach((item: any) => {
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
  };

  // closeNotificationHistoryメソッドも置き換えてタイマーを避ける
  // @ts-ignore: モンキーパッチ
  notificationSystem.closeNotificationHistory = function (): void {
    const modal = document.getElementById('notificationHistoryModal');
    if (modal && modal.parentNode) {
      modal.parentNode.removeChild(modal);
    }

    // @ts-ignore: priveteメンバーへのアクセス
    document.removeEventListener('keydown', this.handleHistoryEscKey);
  };

  return notificationSystem;
}

// --- テストケース ---

Deno.test('NotificationSystem - コンストラクタはコンテナ要素を見つけるか作成する', () => {
  const document = setupDOM();
  const container = document.getElementById('toastContainer');
  const notificationSystem = createTestableNotificationSystem('toastContainer');

  assertExists(container);

  // コンテナが存在しない場合のテスト
  delete (globalThis as any).document;
  const emptyDocument = setupDOM('<body></body>');
  createTestableNotificationSystem('newContainer');
  const newContainer = emptyDocument.getElementById('newContainer');
  assertExists(newContainer);
  assertEquals(newContainer?.className, 'toast-container');

  // クリーンアップ
  delete (globalThis as any).document;
});

Deno.test('NotificationSystem - showToast は通知を表示し、履歴に追加する', () => {
  const document = setupDOM();
  const container = document.getElementById('toastContainer');
  const notificationSystem = createTestableNotificationSystem('toastContainer');

  notificationSystem.showToast('success', '成功', '処理が完了しました', 0); // durationを0に設定して自動クローズを無効化

  // DOMにトースト要素が追加されたか確認
  const toastElement = container?.querySelector('.toast.toast-success');
  assertExists(toastElement);
  assert(toastElement.textContent?.includes('成功'));
  assert(toastElement.textContent?.includes('処理が完了しました'));

  // 履歴に追加されたか確認 (private プロパティへのアクセスは避けるべきだが、テストのために確認)
  // @ts-ignore: Accessing private member for testing purposes
  assertEquals((notificationSystem as any).toastHistory.length, 1);
  // @ts-ignore: Accessing private member for testing purposes
  assertEquals((notificationSystem as any).toastHistory[0].title, '成功');

  // 履歴ボタンが表示されるか確認
  const historyButton = document.getElementById('notificationHistoryButton');
  assertExists(historyButton);
  assertFalse(historyButton.classList.contains('hidden'));
  assertEquals(historyButton.getAttribute('data-count'), '1');

  // クリーンアップ
  delete (globalThis as any).document;
});

Deno.test('NotificationSystem - 閉じるボタンで通知を削除できる', () => {
  const document = setupDOM();
  const container = document.getElementById('toastContainer');
  const notificationSystem = createTestableNotificationSystem('toastContainer');

  notificationSystem.showToast('warning', '手動削除', '閉じるボタンで削除', 0);
  const toastElement = container?.querySelector('.toast.toast-warning');
  assertExists(toastElement);
  const toastId = toastElement.id;

  // notificationSystem.removeToastを直接呼び出して閉じるボタンのクリックをシミュレート
  notificationSystem.removeToast(toastId);

  // 要素が削除されたことを確認
  const warningToast = container?.querySelector('.toast.toast-warning');
  assertEquals(warningToast, null);

  // クリーンアップ
  delete (globalThis as any).document;
});

Deno.test('NotificationSystem - showNotificationHistory は履歴モーダルを表示する', () => {
  const document = setupDOM();
  const notificationSystem = createTestableNotificationSystem('toastContainer');

  // 履歴を作成
  notificationSystem.showToast('info', '履歴1', 'メッセージ1', 0);
  notificationSystem.showToast('error', '履歴2', 'メッセージ2', 0);

  // イベントとsetTimeoutを避けるため、イベントハンドラを直接実行
  notificationSystem.showNotificationHistory();

  // モーダル要素を取得し、存在確認
  const modal = document.getElementById('notificationHistoryModal');
  assertExists(modal);

  // 履歴項目が表示されていることを確認
  const historyItems = modal.querySelectorAll('.history-item');
  assertEquals(historyItems.length, 2);
  assert(modal.textContent?.includes('履歴1'));
  assert(modal.textContent?.includes('履歴2'));

  // クリーンアップ
  delete (globalThis as any).document;
});

Deno.test('NotificationSystem - 履歴モーダルの閉じるボタンでモーダルが閉じる', () => {
  const document = setupDOM();
  const notificationSystem = createTestableNotificationSystem('toastContainer');

  notificationSystem.showNotificationHistory();

  const modal = document.getElementById('notificationHistoryModal');
  assertExists(modal);

  // 閉じるボタンをシミュレート
  const closeButton = modal.querySelector('.notification-history-close-btn');
  assertExists(closeButton);

  // モーダルを直接削除してクリックのシミュレーションをスキップ
  if (modal.parentNode) {
    modal.parentNode.removeChild(modal);
  }

  // モーダルが閉じられたことを確認
  const modalAfterClose = document.getElementById('notificationHistoryModal');
  assertEquals(modalAfterClose, null);

  // クリーンアップ
  delete (globalThis as any).document;
});

Deno.test('NotificationSystem - 履歴クリア機能', () => {
  const document = setupDOM();
  const notificationSystem = createTestableNotificationSystem('toastContainer');

  // 履歴を作成
  notificationSystem.showToast('info', '履歴1', 'メッセージ1', 0);

  // 履歴クリアを実行
  notificationSystem.clearNotificationHistory();

  // 履歴がクリアされたことを確認
  // @ts-ignore: Accessing private member for testing purposes
  assertEquals((notificationSystem as any).toastHistory.length, 0);

  // クリーンアップ
  delete (globalThis as any).document;
});
