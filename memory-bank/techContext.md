# 技術コンテキスト (Tech Context)

_このドキュメントは、プロジェクトで使用されている技術、開発環境のセットアップ、技術的な制約、依存関係、およびツールの使用パターンを記述します。`projectbrief.md` に基づいています。_

## 1. 主要技術スタック

- **言語:** TypeScript (Deno 内蔵), JavaScript (ES Modules), HTML5, CSS3
- **ランタイム:** Deno (v2.2.7 以降推奨)
- **フレームワーク/ライブラリ:** なし (Vanilla TypeScript/JavaScript)
- **テスト:** Deno Test (Deno 内蔵), deno-dom (UI テスト用 DOM シミュレーション)
- **ビルド/バンドル:** esbuild (`deno.land/x/esbuild`) - `deno task bundle` 経由
- **リリース用単一HTML生成:** Deno スクリプト (`scripts/release.ts`) - `deno task release:build` 経由
- **リンティング:** Deno Lint (Deno 内蔵)
- **フォーマット:** Deno Format (Deno 内蔵)
- **パッケージ管理:** URL Imports, Import Map (`import_map.json`)
- **CI/CD:** GitHub Actions (`.github/workflows/ci.yml`, `.github/workflows/release.yml`)
- **実行環境:** Web ブラウザ (実行時)

## 2. 開発環境セットアップ

1. **前提条件:** Deno (v2.2.7 以上推奨) がインストールされていること。
2. **リポジトリクローン:** `git clone [リポジトリURL]`
3. **依存関係:** Deno は URL インポートを使用するため、`npm install` のようなステップは不要。初回実行時や `deno cache` コマンドで依存関係がダウンロード・キャッシュされ、`deno.lock` ファイルが生成・更新される。
4. **開発モードでのバンドル:** `deno task bundle` (内部で `deno run --allow-read --allow-write scripts/build.ts` を実行し、`public/js/main.js` を生成)。
5. **テスト実行:** `deno task test` (内部で `deno test --allow-read` を実行)。
6. **リンティング:** `deno task lint` (内部で `deno lint` を実行)。
7. **フォーマット:** `deno task fmt` (内部で `deno fmt` を実行)。
8. **アプリケーション実行:** `public/index.html` を Web ブラウザで開く (`file://` プロトコル)。
9. **リリース用ビルド:** `deno task release:build` (内部で `deno run --allow-read --allow-write scripts/release.ts` を実行し、`dist/tanshu3.html` を生成)。
10. **バージョン更新:** `deno task release:bump [patch|minor|major]` (内部で `deno run --allow-read --allow-write --allow-run=git scripts/bump-version.ts` を実行)。
11. **VS Code 設定:** Deno 拡張機能をインストールし、有効化することを推奨 (`.vscode/settings.json` で設定済み)。

## 3. 技術的な制約

- **実行環境:** Windows PC 上のモダンブラウザ (Chrome, Edge 推奨) で `file://` プロトコルで動作する必要がある。HTTP サーバー環境は想定しない。
- **状態管理:** アプリケーションはステートレスである必要がある。状態を永続化する仕組みは原則として使用しない。
- **外部通信:** サーバーサイド API や外部データベースへのアクセスは行わない。すべての処理はブラウザ内で完結する。
- **依存関係:** ランタイムの外部ライブラリ依存を極力避ける。コアロジックは Vanilla TypeScript/JavaScript で実装する。Deno 標準ライブラリ (`deno.land/std`) や信頼できるサードパーティモジュール (`deno.land/x`) を活用する。
- **ビルド:** 最終的な JavaScript コードは **esbuild** を使用して `public/js/` ディレクトリにバンドルされる必要がある (`deno task bundle` で実行)。リリース時には単一 HTML ファイル (`dist/tanshu3.html`) が生成される (`deno task release:build` で実行)。

## 4. 外部依存関係 (開発時)

`import_map.json` で管理。

- **Deno Standard Library (`deno.land/std`):**
  - `assert`: テスト用アサーション。
  - `testing/mock`: テスト用モック (`spy` など)。
  - `path`: ファイルパス操作。
  - `semver`: バージョン管理スクリプト用。
- **Deno Third Party Modules (`deno.land/x`):**
  - `deno-dom`: UI テスト用 DOM シミュレーション。
  - `esbuild`: JavaScript/TypeScript バンドル。
  - `cliffy`: バージョン管理スクリプトの CLI 引数解析用。

## 5. ツール利用パターン

- **リンティング (Deno Lint):**
  - 設定: `deno.jsonc` の `lint` セクション。
  - 実行: `deno task lint`。
  - 規約: Deno 推奨ルール + プロジェクト固有ルール。
- **フォーマット (Deno Format):**
  - 設定: `deno.jsonc` の `fmt` セクション。
  - 実行: `deno task fmt`。
  - 規約: プロジェクト固有設定 (行長100, インデント2スペースなど)。VS Code と連携済み。
- **テスト (Deno Test):**
  - 設定: `deno.jsonc` の `test` セクション (権限設定など)。
  - 実行: `deno task test`。
  - 対象: `*_test.ts` または `*.test.ts` ファイル。
  - 環境: Deno ネイティブ環境。UI テストは `deno-dom` を使用。
  - カバレッジ: `deno task test --coverage=coverage/cov_profile && deno coverage coverage/cov_profile` で生成。
- **ビルド/バンドル (esbuild):**
  - 設定: `scripts/build.ts` 内。
  - 実行: `deno task bundle`。
  - 出力: `public/js/main.js` および `.map` ファイル。
- **単一HTML生成 (リリース用):**
  - 設定: `scripts/release.ts` 内。
  - 実行: `deno task release:build`。
  - 出力: `dist/tanshu3.html`。
- **CI/CD (GitHub Actions):**
  - **CI (`.github/workflows/ci.yml`):** `main` への push/PR 時に Lint/Format/Test/Build を実行。
  - **CD (`.github/workflows/release.yml`, `.github/release-drafter.yml`):** `v*.*.*` タグプッシュ時にリリースノート自動生成と成果物 (`tanshu3.html`) の GitHub Release への公開。
- **バージョン管理スクリプト (`scripts/bump-version.ts`):**
  - 実行: `deno task release:bump [patch|minor|major]`。
  - 処理: `src/core/common/version.ts` 更新、Git コミット、Git タグ付け、Git プッシュ。
