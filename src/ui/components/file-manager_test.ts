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
import { spy } from 'https://deno.land/std/testing/mock.ts'; // stub は使わない方針に変更
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

Deno.test('FileManager - 基本DOM操作テスト: コンストラクタ', () => { // async 不要に
  const document = setupDOM();
  // FileManagerインスタンスを作成し、モックを注入
  const fileManager = new FileManager(mockNotificationSystem as any);

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
  assertEquals((clearButton as HTMLButtonElement).disabled, true);
  assertEquals((executeButton as HTMLButtonElement).disabled, true);
  assert(fileInfoArea?.textContent?.includes('ファイルが選択されていません'));

  // クリーンアップ
  delete (globalThis as any).document;
  // モックのリセット
  mockNotificationSystem.showToast.calls = [];
  mockNotificationSystem.showRecoveryToast.calls = [];
});

Deno.test('FileManager - 基本DOM操作テスト: ファイル選択ボタンクリック', () => { // async 不要に
  const document = setupDOM();
  const fileManager = new FileManager(mockNotificationSystem as any); // モックを注入
  const fileInput = document.getElementById('fileInput') as HTMLInputElement;
  const fileSelectButton = document.getElementById('fileSelectButton') as HTMLButtonElement;

  // fileInput.click のスパイを作成
  const clickSpy = spy(fileInput, 'click');

  fileSelectButton.click();
  assertEquals(clickSpy.calls.length, 1);

  // スパイを解除
  clickSpy.restore();
  delete (globalThis as any).document;
  mockNotificationSystem.showToast.calls = [];
  mockNotificationSystem.showRecoveryToast.calls = [];
});

Deno.test('FileManager - 基本DOM操作テスト: handleDragOver', () => { // async 不要に
  const document = setupDOM();
  const fileManager = new FileManager(mockNotificationSystem as any); // モックを注入
  const dropArea = document.getElementById('dropArea') as HTMLElement;

  // DragEventのモック
  const mockPreventDefault = spy();
  const mockEvent = {
    preventDefault: mockPreventDefault,
    dataTransfer: null,
  } as unknown as DragEvent;

  fileManager.handleDragOver(mockEvent);

  assert(dropArea.classList.contains('drag-over'));
  assertEquals(mockPreventDefault.calls.length, 1);

  delete (globalThis as any).document;
  mockNotificationSystem.showToast.calls = [];
  mockNotificationSystem.showRecoveryToast.calls = [];
});

Deno.test('FileManager - 基本DOM操作テスト: handleDragLeave', () => { // async 不要に
  const document = setupDOM();
  const fileManager = new FileManager(mockNotificationSystem as any); // モックを注入
  const dropArea = document.getElementById('dropArea') as HTMLElement;
  dropArea.classList.add('drag-over'); // 事前にクラスを追加

  const mockPreventDefault = spy();
  const mockEvent = {
    preventDefault: mockPreventDefault,
    dataTransfer: null,
  } as unknown as DragEvent;

  fileManager.handleDragLeave(mockEvent);

  assertFalse(dropArea.classList.contains('drag-over'));
  assertEquals(mockPreventDefault.calls.length, 1);

  delete (globalThis as any).document;
  mockNotificationSystem.showToast.calls = [];
  mockNotificationSystem.showRecoveryToast.calls = [];
});

// 注意: handleDrop や processNewFiles のテストは、
// File オブジェクトや DataTransfer の完全なシミュレーション、
// validator のモック化が必要となり、
// Deno Test + deno-dom 環境では複雑になります。
// この例では基本的なDOM操作とイベントハンドラの呼び出し確認に留めます。
// 必要に応じて、より詳細なテストを追加してください。
