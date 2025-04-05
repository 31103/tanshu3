# 技術コンテキスト (Tech Context)

_このドキュメントは、プロジェクトで使用されている技術、開発環境のセットアップ、技術的な制約、依存関係、およびツールの使用パターンを記述します。`projectbrief.md` に基づいています。_

## 1. 主要技術スタック

- **言語:** TypeScript (v5.7.3 - Deno内蔵), JavaScript (ES Modules), HTML5, CSS3
- **ランタイム:** Deno (v2.2.7)
- **フレームワーク/ライブラリ:** なし (Vanilla TypeScript/JavaScript)
- **テスト:** Deno Test (Deno内蔵), deno-dom (UIテスト用)
- **ビルド/バンドル:** Deno Bundle (検討中)
- **リンティング:** Deno Lint (Deno内蔵)
- **フォーマット:** Deno Format (Deno内蔵)
- **パッケージ管理:** URL Imports, Import Map (`import_map.json`)
- **実行環境:** Web ブラウザ (実行時)

## 2. 開発環境セットアップ

1. **前提条件:** Deno (v2.2.7 以上推奨)
2. **リポジトリクローン:** `git clone [リポジトリURL]`
3. **依存関係:** Deno は URL インポートを使用するため、`npm install` は不要。初回実行時や `deno cache` コマンドで依存関係がダウンロード・キャッシュされる (`deno.lock` ファイル生成)。
4. **開発モード (監視 & バンドル):** `deno task dev` (※フェーズ7で定義予定)
5. **手動バンドル:** `deno task bundle` (※フェーズ7で定義予定)
6. **テスト実行:** `deno task test` (※フェーズ7で定義予定)。現在は個別に `deno test --allow-read [ファイル/ディレクトリ]` で実行。UIテスト (`file-manager_test.ts`) は現在失敗中。
7. **リンティング/フォーマット:**
   - `deno task lint` (※フェーズ7で定義予定)。現在は `deno lint` で実行可能。
   - `deno task fmt` (※フェーズ7で定義予定。現在は `deno fmt` で実行可能)
8. **アプリケーション実行:** `public/index.html` を Web ブラウザで開く (`file://` プロトコル)。(※フェーズ7完了までは、`deno bundle` で生成された JS を読み込む想定)
9. **コマンド実行環境に関する注意:** システム情報 (`environment_details`) ではデフォルトシェルが `cmd.exe` と表示される場合がありますが、実際のコマンド実行環境は **PowerShell (`pwsh.exe`)** である可能性が高いです。`execute_command` ツールを使用する際は、PowerShell 構文でコマンドを記述してください (例: `rmdir /s /q` ではなく `Remove-Item -Recurse -Force`)。

## 3. 技術的な制約

- **実行環境:** Windows PC 上のモダンブラウザ (Chrome, Edge 推奨) で `file://` プロトコルで動作する必要がある。HTTP サーバー環境は想定しない。
- **状態管理:** アプリケーションはステートレスである必要がある。状態を永続化する仕組み（LocalStorage なども含む）は原則として使用しない。
- **外部通信:** サーバーサイド API や外部データベースへのアクセスは行わない。すべての処理はブラウザ内で完結する。
- **依存関係:** ランタイムの外部ライブラリ依存を極力避ける。コアロジックは Vanilla TypeScript/JavaScript で実装する。Deno 標準ライブラリ (`deno.land/std`) を活用する。
- **ビルド:** 最終的な JavaScript コードは `public/js/` ディレクトリにバンドルされる必要がある (`deno bundle` を使用予定)。

## 4. 外部依存関係 (開発時)

Deno 環境では、`npm install` のような明示的なインストールステップは不要。コード内で直接 URL を指定してインポートする。バージョン管理と利便性のため `import_map.json` を使用。

- **Deno Standard Library (`deno.land/std`):**
  - `assert`: テスト用アサーション関数。
  - `testing/mock`: `spy` などのテスト用モック関数。
- **Deno Third Party Modules (`deno.land/x`):**
  - `deno-dom`: Deno Test での DOM 環境シミュレーション用。

## 5. ツール利用パターン

- **リンティング (Deno Lint):**
  - 設定ファイル: `deno.jsonc` の `lint` セクション
  - 実行: `deno lint` (または `deno task lint`)
  - 規約: Deno 推奨ルール (`tags: ["recommended"]`) をベースに、必要に応じて `rules.exclude` で調整。
- **フォーマット (Deno Format):**
  - 設定ファイル: `deno.jsonc` の `fmt` セクション
  - 実行: `deno fmt` (または `deno task fmt`)
  - 規約: `deno.jsonc` の `fmt.options` で設定 (行長100, インデント2スペース, シングルクォート, proseWrap: preserve など)。VS Code と連携済み。
- **テスト (Deno Test):**
  - 設定ファイル: `deno.jsonc` の `test` セクション (今後設定追加の可能性あり)
  - 実行: `deno test --allow-read [対象ファイル/ディレクトリ]` (または `deno task test`)。
  - 対象: `*_test.ts` または `*.test.ts` という命名規則のファイル。
  - 環境: Deno ネイティブ環境。DOM が必要なテストは `deno-dom` を使用。
  - カバレッジ: `deno coverage coverage/` でレポート生成可能 (要 `--coverage` フラグ付きテスト実行)。
- **ビルド/バンドル (Deno Bundle - 検討中):**
  - 設定: `deno.jsonc` の `tasks` セクションで定義予定。
  - 実行: `deno task bundle` (予定)
  - 出力: `public/js/main.js` (予定)。`file://` 環境での実行を維持。
- **ステージング時チェック:**
  - Git フック (例: Husky または手動設定) で `deno task lint` と `deno task fmt` を実行することを検討 (フェーズ8)。
