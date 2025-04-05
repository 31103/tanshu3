/**
 * FileManager クラスのユニットテスト (Deno Test + deno-dom)
 */
import {
  assert,
  assertEquals,
  assertExists,
  assertFalse,
} from 'https://deno.land/std/assert/mod.ts';
import { DOMParser } from 'https://deno.land/x/deno_dom/deno-dom-wasm.ts';
import { assertSpyCalls, spy } from 'https://deno.land/std/testing/mock.ts'; // assertSpyCallsを追加
import { FileManager } from './file-manager.ts';
// notification モジュールは不要になったため削除
import * as validator from '../../core/validator.ts'; // validator は必要に応じてモック化

// notificationSystem のモック (テストに必要なメソッドのみ)
const mockNotificationSystem = {
  showToast: spy(),
  showRecoveryToast: spy(),
  // 必要に応じて他のメソッドも spy() でモック化
};

// deno-dom を使ってDOM環境を初期化するヘルパー関数
function setupDOM(): any { // 戻り値の型を any に修正 (三度目)
  const html = `
    <!DOCTYPE html>
    <html>
    <head><title>Test</title></head>
    <body>
      <div id="dropArea" tabindex="0">
        <input type="file" id="fileInput" multiple style="display: none;">
        <button id="fileSelectButton">ファイル選択</button>
        <div id="fileInfoArea">ファイルが選択されていません</div>
        <button id="clearButton" disabled>クリア</button>
        <button id="executeButton" disabled>実行</button>
      </div>
      <div id="toastContainer"></div>
      <button id="notificationHistoryButton" class="hidden"></button>
    </body>
    </html>
  `;
  const document = new DOMParser().parseFromString(html, 'text/html');
  assertExists(document);
  (globalThis as any).document = document;
  return document;
}

// --- テストケース ---

Deno.test('FileManager - 基本DOM操作テスト: コンストラクタ', () => {
  // テスト用のNotificationシステムのモックを再作成（各テストで独立させる）
  const testMockNotification = {
    showToast: spy(),
    showRecoveryToast: spy(),
  };
  
  const document = setupDOM();
  // FileManagerインスタンスを作成し、モックを注入
  const fileManager = new FileManager(testMockNotification as any);

  // 要素が正しく取得できていることを確認
  const fileInput = document.getElementById('fileInput');
  const fileInfoArea = document.getElementById('fileInfoArea');
  const clearButton = document.getElementById('clearButton');
  const executeButton = document.getElementById('executeButton');
  const dropArea = document.getElementById('dropArea');

  assertExists(fileInput);
  assertExists(fileInfoArea);
  assertExists(clearButton);
  assertExists(executeButton);
  assertExists(dropArea);

  // 初期状態の確認
  // deno-domではプロパティが適切に設定されていない可能性があるので、HTMLの属性で確認する
  assert(clearButton?.hasAttribute('disabled'), 'clearButtonはdisabledであるべき');
  assert(executeButton?.hasAttribute('disabled'), 'executeButtonはdisabledであるべき');
  assert(fileInfoArea?.textContent?.includes('ファイルが選択されていません'));

  // クリーンアップ
  delete (globalThis as any).document;
  // spy は新しい spy で置き換える
  testMockNotification.showToast = spy();
  testMockNotification.showRecoveryToast = spy();
});

Deno.test('FileManager - 基本DOM操作テスト: ファイル選択ボタンクリック', () => {
  // テスト用のNotificationシステムのモックを再作成
  const testMockNotification = {
    showToast: spy(),
    showRecoveryToast: spy(),
  };

  const document = setupDOM();
  const fileManager = new FileManager(testMockNotification as any);
  const fileInput = document.getElementById('fileInput') as HTMLInputElement;
  const fileSelectButton = document.getElementById('fileSelectButton') as HTMLButtonElement;

  // clickメソッドを直接モックする代わりに、イベントハンドラが呼び出されることを検証する別のアプローチ
  let clickCalled = false;
  const originalClick = fileInput.click;
  fileInput.click = function() {
    clickCalled = true;
  } as any;

  // ボタンをクリックしたとき、fileInput.clickが呼ばれることを確認
  // deno-domでは.click()メソッドが存在しないため、直接イベントをディスパッチする
  const clickEvent = new Event('click');
  fileSelectButton.dispatchEvent(clickEvent);
  
  assert(clickCalled, 'fileInput.click() should be called');

  // クリーンアップ
  fileInput.click = originalClick;
  delete (globalThis as any).document;
  // spy は新しい spy で置き換える
  testMockNotification.showToast = spy();
  testMockNotification.showRecoveryToast = spy();
});

Deno.test('FileManager - 基本DOM操作テスト: handleDragOver', () => {
  // テスト用のNotificationシステムのモックを再作成
  const testMockNotification = {
    showToast: spy(),
    showRecoveryToast: spy(),
  };
  
  const document = setupDOM();
  const fileManager = new FileManager(testMockNotification as any);
  const dropArea = document.getElementById('dropArea') as HTMLElement;

  // DragEventのモック - 通常の関数として作成して変数にキャプチャ
  let preventDefaultCalled = false;
  const mockEvent = {
    preventDefault: function() {
      preventDefaultCalled = true;
    },
    dataTransfer: null,
  } as unknown as DragEvent;

  fileManager.handleDragOver(mockEvent);

  assert(dropArea.classList.contains('drag-over'));
  assert(preventDefaultCalled, 'preventDefault should be called');

  // クリーンアップ
  delete (globalThis as any).document;
  testMockNotification.showToast = spy();
  testMockNotification.showRecoveryToast = spy();
});

Deno.test('FileManager - 基本DOM操作テスト: handleDragLeave', () => {
  // テスト用のNotificationシステムのモックを再作成
  const testMockNotification = {
    showToast: spy(),
    showRecoveryToast: spy(),
  };
  
  const document = setupDOM();
  const fileManager = new FileManager(testMockNotification as any); // モックを注入
  const dropArea = document.getElementById('dropArea') as HTMLElement;
  dropArea.classList.add('drag-over'); // 事前にクラスを追加

  // mockPreventDefault をクラシックなモックに変更
  let preventDefaultCalled = false;
  const mockEvent = {
    preventDefault: function() {
      preventDefaultCalled = true;
    },
    dataTransfer: null,
  } as unknown as DragEvent;

  fileManager.handleDragLeave(mockEvent);

  assertFalse(dropArea.classList.contains('drag-over'));
  assert(preventDefaultCalled, 'preventDefault should be called');

  // クリーンアップ
  delete (globalThis as any).document;
  testMockNotification.showToast = spy();
  testMockNotification.showRecoveryToast = spy();
});

// 注意: handleDrop や processNewFiles のテストは、
// File オブジェクトや DataTransfer の完全なシミュレーション、
// validator のモック化が必要となり、
// Deno Test + deno-dom 環境では複雑になります。
// この例では基本的なDOM操作とイベントハンドラの呼び出し確認に留めます。
// 必要に応じて、より詳細なテストを追加してください。
