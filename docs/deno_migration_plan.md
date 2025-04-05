# Node.js から Deno への段階的移行計画

## 1. 背景

現在の Node.js ベースの開発環境 (npm, Parcel, ESLint, Prettier, Jest) を、Deno ネイティブな環境 (URL Import, Deno CLI tools: lint, fmt, test, compile) へ移行する。

## 2. 目的

- 開発環境のシンプル化 (node_modules 廃止、ツール統合)
- Deno のセキュリティ機能と TypeScript ネイティブサポートの活用
- モダンな標準ライブラリの利用

## 3. 移行方針

影響範囲を考慮し、以下のフェーズに分けて段階的に移行を進める。各フェーズ完了時に動作確認とテストを行い、問題を早期に発見・修正する。

## 4. 移行フェーズ詳細

### フェーズ 1: 環境設定と基本ツールの導入 (完了)

- **目的:** Deno 開発の基本環境を構築し、Lint/Format ツールを導入する。
- **作業内容:**
  1. Deno インストール確認 (v2.2.7)。
  2. `deno.jsonc` 作成 (fmt, lint, compilerOptions, importMap 設定)。
  3. `import_map.json` 作成 (空)。
  4. `deno lint --fix` で初期 Lint エラー修正 (`window`/`global` -> `globalThis`)。
  5. `deno fmt` でプロジェクト全体のフォーマット適用。
  6. `.gitignore` に `deno.lock` 追加。
  7. `.vscode/settings.json` を更新し、Deno 拡張機能を有効化、デフォルトフォーマッターを Deno に設定。
- **コミット:** `aa39270`

### フェーズ 2: コアロジック (`src/core`) の依存関係移行 (完了)

- **目的:** プロジェクトの中核となるビジネスロジック部分を Deno の依存関係管理に移行する。
- **作業内容:**
  1. `src/core/` 配下の `.ts` ファイルのインポート/エクスポートパスに `.ts` 拡張子を追加。
  2. 不要な `src/core/adapters/node.ts` を削除。
  3. `deno check src/core/**/*.ts` で型エラーがないことを確認。
- **コミット:** `98c9dcb`

### フェーズ 3: コアロジック (`src/core`) のテスト移行 (完了)

- **目的:** コアロジックのテストを Jest から Deno Test に移行し、ロジックの正当性を担保する。
- **作業内容:**
  1. `test/jest/unit/` 内のコアロジックテストファイルを `src/core/` 配下に `_test.ts` として移動/リネーム。
  2. Jest 構文を Deno Test 構文 (`Deno.test`, `assert` モジュール) に書き換え。
  3. `deno.jsonc` の `compilerOptions.lib` に `"deno.ns"` を追加し、`Cannot find name 'Deno'` エラーを解消。
  4. `evaluator.ts` のロジック順序を修正し、失敗していたテストを修正。
  5. `deno test --allow-read src/core/` でコアロジックテスト全件 (102件) パスを確認。
- **コミット:** `72992f1`

### フェーズ 4: UI レイヤー (`src/ui`, `src/browser`) の依存関係移行 (完了)

- **目的:** UI 関連コードの依存関係を Deno に移行する。
- **作業内容:**
  1. `src/ui/components/` (`file-manager.ts`, `result-viewer.ts`) および `src/browser/` (`main.ts`) 内のインポートパスに `.ts` 拡張子を追加。
  2. `deno check src/ui/**/*.ts src/browser/**/*.ts` で型エラーがないことを確認。
- **コミット:** `c823d2e`

### フェーズ 5: UI レイヤー (`src/ui`, `src/browser`) のテスト移行 (完了)

- **目的:** UI コンポーネントのテストを Deno Test に移行する。DOM 環境の再現が課題。
- **作業内容:**
  1. **テストファイルリネーム/移動:** `test/jest/unit/` 内の UI 関連テスト (`file-manager.test.ts`, `notification.test.ts`, `result-viewer.test.ts`) を対応するコンポーネントの隣 (`src/ui/components/`) に `_test.ts` として移動/リネーム。(**完了**)
  2. **テストコード書き換え (`file-manager_test.ts`):**
     - Jest 構文を Deno Test 構文に書き換え。(**完了**)
     - `deno-dom` を使用して DOM 環境をセットアップ。(**完了**)
     - `notificationSystem` のモック化で問題発生 (`document is not defined` エラー)。(**解決済**)
     - `NotificationSystem` を遅延初期化、`FileManager` を依存性注入 (DI) を使うようにリファクタリング。(**完了**)
     - テスト内でモジュール関数 (`getNotificationSystem`) を直接上書きしようとして `TypeError: Cannot assign to read only property` エラー発生。(**解決済**)
     - DI を利用してテスト時にモック (`mockNotificationSystem`) を `FileManager` コンストラクタに渡すように修正。(**完了**)
     - `spy` した関数の `calls` プロパティに関する型エラーが発生。`deno test`環境では`spy.calls = []`が使用できない問題が発生。(**解決済**)
     - `deno-dom` の `HTMLDocument` と標準 `Document` の型不整合エラーが発生。`setupDOM` とラッパー関数の型定義を `any` に変更して回避。(**完了**)
     - `deno test` で `file-manager_test.ts` がパスすることを確認。(**完了**)
  3. **テストコード書き換え (`notification_test.ts`):**
     - Jest 構文を Deno Test 構文に書き換え。(**完了**)
     - `deno-dom` を使用して DOM 環境をセットアップ。(**完了**)
     - タイマー処理（`setTimeout`）によるリークの問題が発生。(**解決済**)
     - DOM要素の`style.opacity`などのスタイル操作がdeno-dom環境で動作しない問題に対応。(**解決済**)
     - モンキーパッチを使用してタイマー処理を回避する方法に変更。(**完了**)
     - `deno test` で `notification_test.ts` がパスすることを確認。(**完了**)
  4. **テストコード書き換え (`result-viewer_test.ts`):**
     - Jest 構文を Deno Test 構文に書き換え。(**完了**)
     - `deno-dom` を使用して DOM 環境をセットアップ。(**完了**)
     - クリップボード操作、URL生成などの外部APIに依存するテストをモック化。(**完了**)
     - テスト用サブクラス（`TestResultViewer`）を作成し、内部メソッドにアクセス可能にするアプローチを実装。(**完了**)
     - `deno test` で `result-viewer_test.ts` がパスすることを確認。(**完了**)
  5. **テスト実行:** `deno test --allow-read src/ui/components/` を実行し、全テストがパスすることを確認。(**完了**)
- **教訓と知見:**
  - `deno-dom` は `jsdom` と完全互換ではない:
    - `element.click()`メソッドが実装されていないため、代わりにイベントを直接ディスパッチする必要がある
    - `style`プロパティの扱いに制限があり、要素を直接操作する代替手段（`setAttribute('style', '...')`など）が必要
    - `Document` 型の不整合が発生するため、`any`キャストを使用する場合がある
  - ESモジュールの特性上、インポートした関数の動的な上書きによるモック化は困難。依存性注入 (DI) を活用。
  - Denoの`testing/mock`モジュールの`spy`は、Jestと異なり、`calls`プロパティが読み取り専用で、`.calls = []`でリセットできない
  - 非同期処理（タイマーなど）に依存するテストは特に注意が必要で、タイマーリーク検出に対応するよう設計を変更すべき
  - テスト対象の実装によっては、テスト用のサブクラス（`TestableXXX`）を作成して内部メソッドにアクセスする方法が効果的

### フェーズ 6: 統合テストの移行 (未着手)

- **目的:** アプリケーション全体の流れを確認する統合テストを Deno Test に移行する。
- **作業内容:**
  1. テストファイルリネーム/移動: `test/jest/integration/` 内のテストを `test/integration/` など適切な場所に移動/コピー。
  2. テストコード書き換え: Deno Test API に書き換え。
  3. テスト実行: `deno test test/integration/**/*.test.ts` を実行し、テストがパスすることを確認。
- **注意点:**
  - 統合テストは複数のモジュールにまたがるため、依存関係の解決やモックの設定が複雑になる場合がある。

### フェーズ 7: ビルドと実行方法の確立 (未着手)

- **目的:** Parcel を使わない Deno ネイティブなビルド・実行方法を確立する。
- **作業内容:**
  1. Parcel 関連削除: `package.json` から Parcel 関連の `scripts` と `targets` を削除。キャッシュディレクトリ削除。
  2. `deno.jsonc` に `tasks` を定義: `check`, `lint`, `fmt`, `test`, `dev`, `bundle`, `compile` など。
  3. 動作確認: `deno task bundle` で JS を生成し、`index.html` から読み込んで動作確認。`deno task compile` の動作も確認。
- **注意点:**
  - `file://` 環境での実行維持のため `deno bundle` が有力。`deno compile` は Web UI アプリでは課題の可能性あり。
  - 各 Deno コマンドに必要な権限 (`--allow-*`) を適切に設定。

### フェーズ 8: クリーンアップとドキュメント更新 (未着手)

- **目的:** 不要になった Node.js 関連ファイルを削除し、ドキュメントを最新化する。
- **作業内容:**
  1. ファイル削除: `package.json`, `package-lock.json`, `node_modules/`, `eslint.config.js`, `.prettierrc.json`, `jest.config.js`, `tsconfig.json`, `tsconfig.test.json`, `test/jest/` ディレクトリなどを削除。
  2. Git フック設定: `lint-staged` の代替 (Husky または手動)。
  3. Memory Bank 更新: `techContext.md` 全面書き換え、`activeContext.md`, `progress.md` 更新。
  4. `README.md` 更新: セットアップ手順、実行方法などを Deno ベースに更新。
- **注意点:**
  - ファイル削除は慎重に行う。

## 5. ロールバック計画

各フェーズで問題が発生し、解決が困難な場合は、Git を使用して問題発生前の状態にロールバックする。
