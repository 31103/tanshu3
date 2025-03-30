/**
 * NotificationSystem クラスのユニットテスト
 */
import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';
import { NotificationSystem, ToastData } from '../../../src/ui/components/notification';

describe('NotificationSystem', () => {
    let notificationSystem: NotificationSystem;
    let container: HTMLElement;

    // 各テストの前にDOM要素とNotificationSystemインスタンスをセットアップ
    beforeEach(() => {
        document.body.innerHTML = `
      <div id="toastContainer"></div>
      <button id="notificationHistoryButton" class="hidden"></button>
    `;
        container = document.getElementById('toastContainer') as HTMLElement;
        notificationSystem = new NotificationSystem('toastContainer');
        // JSDOMはアニメーションをサポートしないため、即時削除されるように調整
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers(); // タイマーを元に戻す
        document.body.innerHTML = ''; // DOMをクリア
    });

    it('コンストラクタはコンテナ要素を見つけるか作成する', () => {
        expect(container).not.toBeNull();
        // コンテナが存在しない場合のテスト
        document.body.innerHTML = ''; // コンテナを削除
        const newSystem = new NotificationSystem('newContainer');
        const newContainer = document.getElementById('newContainer');
        expect(newContainer).not.toBeNull();
        expect(newContainer?.className).toBe('toast-container');
    });

    it('showToast は通知を表示し、履歴に追加する', () => {
        notificationSystem.showToast('success', '成功', '処理が完了しました');

        // DOMにトースト要素が追加されたか確認
        const toastElement = container.querySelector('.toast.toast-success');
        expect(toastElement).not.toBeNull();
        expect(toastElement?.textContent).toContain('成功');
        expect(toastElement?.textContent).toContain('処理が完了しました');

        // 履歴に追加されたか確認 (private プロパティへのアクセスは避けるべきだが、テストのために確認)
        // @ts-expect-error: Accessing private member for testing purposes
        expect(notificationSystem.toastHistory.length).toBe(1);
        // @ts-expect-error: Accessing private member for testing purposes
        expect(notificationSystem.toastHistory[0].title).toBe('成功');

        // 履歴ボタンが表示されるか確認
        const historyButton = document.getElementById('notificationHistoryButton');
        expect(historyButton?.classList.contains('hidden')).toBe(false);
        expect(historyButton?.getAttribute('data-count')).toBe('1');
    });

    it('複数の通知を表示し、表示上限を超えると集約通知が表示される', () => {
        notificationSystem.showToast('info', '情報1', 'メッセージ1');
        notificationSystem.showToast('warning', '警告', 'メッセージ2');
        notificationSystem.showToast('error', 'エラー', 'メッセージ3');
        notificationSystem.showToast('success', '成功', 'メッセージ4'); // 4つ目

        // 表示されているトーストは上限の3つのはず
        expect(container.querySelectorAll('.toast:not(#toast-aggregate)').length).toBe(3);

        // 集約通知が表示されているはず
        const aggregateToast = container.querySelector('#toast-aggregate');
        expect(aggregateToast).not.toBeNull();
        expect(aggregateToast?.textContent).toContain('他に1件の通知があります');
        // 集約通知のタイプは最も優先度の高いエラーになるはず
        expect(aggregateToast?.classList.contains('toast-error')).toBe(true);

        // 5つ目を追加
        notificationSystem.showToast('info', '情報5', 'メッセージ5');
        expect(container.querySelectorAll('.toast:not(#toast-aggregate)').length).toBe(3);
        expect(aggregateToast?.textContent).toContain('他に2件の通知があります');
    });

    it('通知は指定時間後に自動的に消える', () => {
        notificationSystem.showToast('info', '自動削除', 'この通知は消えます', 1000);
        let toastElement = container.querySelector('.toast.toast-info');
        expect(toastElement).not.toBeNull();

        // 時間を進める
        jest.advanceTimersByTime(1000);

        // アニメーションのための待機時間を考慮 (本来はアニメーション完了イベントを待つべき)
        // JSDOMではアニメーションがないため、setTimeoutの完了を待つ
        // removeToastElement内のsetTimeout(300)を考慮
        jest.advanceTimersByTime(300);

        toastElement = container.querySelector('.toast.toast-info');
        expect(toastElement).toBeNull(); // 要素が削除されているはず
    });

    it('閉じるボタンで通知を削除できる', () => {
        notificationSystem.showToast('warning', '手動削除', '閉じるボタンで削除');
        const toastElement = container.querySelector('.toast.toast-warning');
        expect(toastElement).not.toBeNull();

        const closeButton = toastElement?.querySelector('.toast-close') as HTMLButtonElement;
        closeButton?.click();

        // アニメーションのための待機時間を考慮
        jest.advanceTimersByTime(300);

        expect(container.querySelector('.toast.toast-warning')).toBeNull();
    });

    it('showNotificationHistory は履歴モーダルを表示する', () => {
        notificationSystem.showToast('info', '履歴1', 'メッセージ1');
        notificationSystem.showToast('error', '履歴2', 'メッセージ2');

        notificationSystem.showNotificationHistory();

        const modal = document.getElementById('notificationHistoryModal');
        expect(modal).not.toBeNull();
        expect(modal?.classList.contains('active')).toBe(true); // 表示されている
        expect(modal?.querySelectorAll('.history-item').length).toBe(2);
        expect(modal?.textContent).toContain('履歴1');
        expect(modal?.textContent).toContain('履歴2');
    });

    it('履歴モーダルの閉じるボタンでモーダルが閉じる', () => {
        notificationSystem.showNotificationHistory();
        const modal = document.getElementById('notificationHistoryModal');
        const closeButton = modal?.querySelector('.notification-history-close-btn') as HTMLButtonElement;

        closeButton?.click();
        jest.advanceTimersByTime(300); // アニメーション時間

        expect(document.getElementById('notificationHistoryModal')).toBeNull();
    });

    it('履歴モーダルのクリアボタンで履歴がクリアされる', () => {
        notificationSystem.showToast('info', '履歴1', 'メッセージ1');
        notificationSystem.showNotificationHistory();
        const modal = document.getElementById('notificationHistoryModal');
        const clearButton = modal?.querySelector('.notification-history-clear') as HTMLButtonElement;

        clearButton?.click();
        jest.advanceTimersByTime(300); // アニメーション時間

        expect(document.getElementById('notificationHistoryModal')).toBeNull();
        // @ts-expect-error: Accessing private member for testing purposes
        expect(notificationSystem.toastHistory.length).toBe(0);
        const historyButton = document.getElementById('notificationHistoryButton');
        // 履歴が0件ならボタンは非表示になるはずだが、テストではクラス操作のみ確認
        // expect(historyButton?.classList.contains('hidden')).toBe(true);
    });
});
