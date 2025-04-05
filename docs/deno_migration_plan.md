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

### フェーズ 1: 環境設定と基本ツールの導入

- **目的:** Deno 開発の基本環境を構築し、Lint/Format ツールを導入する。
- **作業内容:**
  1. **Deno インストール確認:** 開発環境に Deno がインストールされていることを確認する (なければインストール)。
  2. **`deno.jsonc` 作成:** プロジェクトルートに `deno.jsonc` を作成し、基本的な設定を追加する。
     ```jsonc
     {
       "fmt": {
         "options": {
           "lineWidth": 100,
           "indentWidth": 2,
           "singleQuote": true, // Prettier設定に合わせる
           "proseWrap": "preserve" // Prettier設定に合わせる
         }
       },
       "lint": {
         "rules": {
           "tags": ["recommended"],
           "exclude": ["no-explicit-any", "no-unused-vars"] // 初期設定 (必要に応じて調整)
         }
       },
       "tasks": {
         // この時点では空か、基本的なタスクのみ
       },
       "compilerOptions": {
         // tsconfig.json から必要な設定を移行 (例: strict, lib)
         "strict": true,
         "lib": ["dom", "dom.iterable", "esnext"]
       },
       "importMap": "./import_map.json" // importMap を使用する宣言
     }
     ```
  3. **`import_map.json` 作成:** プロジェクトルートに空の `import_map.json` を作成する。
     ```json
     {
       "imports": {}
     }
     ```
  4. **初期 Lint/Format 実行:**
     - `deno lint`: 現状のコードに対する Lint 結果を確認。
     - `deno fmt`: 現状のコードに対する Format 結果を確認 (実行はまだしない)。
  5. **`.gitignore` 更新:** `deno.lock` (生成された場合) などを追加。
- **注意点:**
  - `deno.jsonc` の `compilerOptions` は既存の `tsconfig.json` を参考に設定する。
  - `fmt` のオプションは `.prettierrc.json` の設定に可能な限り近づける。

### フェーズ 2: コアロジック (`src/core`) の依存関係移行

- **目的:** プロジェクトの中核となるビジネスロジック部分を Deno の依存関係管理に移行する。
- **作業内容:**
  1. **`src/core/common/` 移行:**
     - `types.ts`, `constants.ts`, `utils.ts`, `parsers.ts`, `evaluator.ts` 内の `import`/`export` 文に `.ts` 拡張子を追加。
     - Node.js 固有の型 (`@types/node` 由来など) があれば Deno の型や標準ライブラリに置き換え。
     - 外部依存があれば Deno の標準ライブラリ (`https://deno.land/std/...`) やサードパーティモジュール (`https://deno.land/x/...` または `npm:...`) に置き換え、`import_map.json` に登録。
  2. **`src/core/adapters/` 移行:**
     - `browser.ts` のインポートに拡張子追加。
     - `node.ts` は Deno 環境では不要になる可能性が高いため、削除を検討。
  3. **`src/core/` 直下ファイル移行:**
     - `file-processor.ts`, `validator.ts`, `index.ts`, `common.ts` 内のインポートに拡張子追加。
     - Node.js 固有 API/型があれば置き換え。
     - 依存関係を `import_map.json` に登録。
  4. **型チェック:** `deno check src/core/**/*.ts` を実行し、型エラーが発生しないことを確認。
- **注意点:**
  - `npm:` specifier を使う場合は、互換性に注意が必要。
  - `import_map.json` でバージョンを固定することが推奨される。

### フェーズ 3: コアロジック (`src/core`) のテスト移行

- **目的:** コアロジックのテストを Jest から Deno Test に移行し、ロジックの正当性を担保する。
- **作業内容:**
  1. **テストファイルリネーム/移動:** `test/jest/unit/` 内のコアロジック関連テスト (`constants.test.ts` など) を `src/core/` 配下の対応するファイルの隣に `_test.ts` または `.test.ts` として移動またはコピー (例: `src/core/common/constants_test.ts`)。
  2. **テストコード書き換え:**
     - `describe`, `it`, `test` を `Deno.test` に置き換え。
     - Jest の `expect` アサーションを `deno.land/std/assert/` モジュールのアサーション関数 (`assertEquals`, `assertExists` など) に置き換え。
     - Jest のモック (`jest.fn`, `jest.mock`) を `deno.land/std/testing/mock.ts` (`spy`, `stub` など) に置き換え。
     - `@types/jest` への依存を削除。
  3. **テスト実行:** `deno test src/core/**/*.test.ts` (または `_test.ts`) を実行し、すべてのテストがパスすることを確認。
- **注意点:**
  - Deno Test の API は Jest と異なるため、書き換えには慣れが必要。
  - `deno.land/std/assert` と `deno.land/std/testing/mock` のドキュメントを参照。

### フェーズ 4: UI レイヤー (`src/ui`, `src/browser`) の依存関係移行

- **目的:** UI 関連コードの依存関係を Deno に移行する。
- **作業内容:**
  1. **`src/ui/components/` 移行:**
     - `file-manager.ts`, `notification.ts`, `result-viewer.ts` 内のインポートに `.ts` 拡張子を追加。
     - DOM API 関連の型は `deno.jsonc` の `compilerOptions.lib` に `"dom"` が含まれていれば Deno が標準で提供。
     - 外部依存があれば `import_map.json` に登録。
  2. **`src/browser/` 移行:**
     - `main.ts`, `common.browser.ts` 内のインポートに拡張子追加。
     - 依存関係を `import_map.json` に登録。
  3. **型チェック:** `deno check src/ui/**/*.ts src/browser/**/*.ts` を実行し、型エラーがないことを確認。
- **注意点:**
  - この時点ではブラウザ固有の API (DOM 操作など) の動作確認はまだ行わない。

### フェーズ 5: UI レイヤー (`src/ui`, `src/browser`) のテスト移行

- **目的:** UI コンポーネントのテストを Deno Test に移行する。DOM 環境の再現が課題。
- **作業内容:**
  1. **テストファイルリネーム/移動:** `test/jest/unit/` 内の UI 関連テストを対応するコンポーネントの隣に移動/コピー。
  2. **テストコード書き換え:** フェーズ 3 と同様に Deno Test API に書き換え。
  3. **DOM 環境の準備:**
     - `deno-dom` (`https://deno.land/x/deno_dom`) の利用を検討。`import_map.json` に追加。
     - テストファイル内で `deno-dom` を使って `document`, `window` などをセットアップするヘルパー関数を作成。
     - または、テスト戦略を見直し、DOM 依存を減らすリファクタリングを検討。
  4. **テスト実行:** `deno test src/ui/**/*.test.ts src/browser/**/*.test.ts` を実行し、テストがパスすることを確認。
- **注意点:**
  - `deno-dom` は `jsdom` と完全互換ではないため、テストコードの調整が必要になる可能性が高い。
  - UI テストの移行は最も困難な部分になる可能性がある。

### フェーズ 6: 統合テストの移行

- **目的:** アプリケーション全体の流れを確認する統合テストを Deno Test に移行する。
- **作業内容:**
  1. **テストファイルリネーム/移動:** `test/jest/integration/` 内のテストを `test/integration/` など適切な場所に移動/コピー。
  2. **テストコード書き換え:** Deno Test API に書き換え。
  3. **テスト実行:** `deno test test/integration/**/*.test.ts` を実行し、テストがパスすることを確認。
- **注意点:**
  - 統合テストは複数のモジュールにまたがるため、依存関係の解決やモックの設定が複雑になる場合がある。

### フェーズ 7: ビルドと実行方法の確立

- **目的:** Parcel を使わない Deno ネイティブなビルド・実行方法を確立する。
- **作業内容:**
  1. **Parcel 関連削除:**
     - `package.json` から Parcel 関連の `scripts` と `targets` を削除。
     - `parcel-cache` などのキャッシュディレクトリを `.gitignore` に追加 (または削除)。
  2. **`deno.jsonc` に `tasks` を定義:**
     ```jsonc
     "tasks": {
       "check": "deno check src/browser/main.ts", // 型チェック
       "lint": "deno lint",
       "fmt": "deno fmt",
       "test": "deno test --allow-read", // 必要な権限を追加
       "dev": "deno run --watch --allow-read --allow-write --allow-env src/browser/main.ts", // 開発用実行 (権限は要調整)
       "bundle": "deno bundle src/browser/main.ts public/js/main.js", // JSバンドル生成 (代替案)
       "compile": "deno compile --allow-read --allow-write --allow-env --output tanshu3 src/browser/main.ts" // 実行ファイル生成 (検討事項)
     }
     ```
  3. **動作確認:**
     - `deno task dev`: ブラウザで `public/index.html` を開き、開発モードでの動作を確認 (※ `deno run` が直接ブラウザで動くわけではない。`deno bundle` で生成したJSを読み込む想定)。
     - `deno task bundle`: `public/js/main.js` が生成されることを確認。`index.html` を開き、動作を確認。
     - `deno task compile`: `tanshu3.exe` (Windows の場合) が生成されることを確認。実行可能ファイルの動作を確認 (Web UI を含む場合の動作は要検証)。
- **注意点:**
  - `file://` 環境での実行を維持するには、`deno bundle` で JavaScript ファイルを生成し、既存の `public/index.html` から読み込む方法が最も現実的と思われる。`deno compile` は現時点では Web UI を含むアプリケーションの配布には課題がある可能性がある。
  - 各 Deno コマンドに必要な権限 (`--allow-read` など) を適切に設定する必要がある。

### フェーズ 8: クリーンアップとドキュメント更新

- **目的:** 不要になった Node.js 関連ファイルを削除し、ドキュメントを最新化する。
- **作業内容:**
  1. **ファイル削除:** `package.json`, `package-lock.json`, `node_modules/`, `eslint.config.js`, `.prettierrc.json`, `jest.config.js`, `tsconfig.json`, `tsconfig.test.json`, `test/jest/` ディレクトリなどを削除。
  2. **Git フック設定:** `lint-staged` の代替として、Git の pre-commit フックで `deno task lint` や `deno task fmt` を実行するように設定 (例: Husky を再導入するか、手動で `.git/hooks/pre-commit` を設定)。
  3. **Memory Bank 更新:** `techContext.md` を全面的に書き換え。`activeContext.md`, `progress.md` に Deno 移行の完了を反映。
  4. **`README.md` 更新:** 開発環境のセットアップ手順、実行方法などを Deno ベースの内容に更新。
- **注意点:**
  - ファイル削除は慎重に行う。Git で管理されていることを確認。

## 5. ロールバック計画

各フェーズで問題が発生し、解決が困難な場合は、Git を使用して問題発生前の状態にロールバックする。
