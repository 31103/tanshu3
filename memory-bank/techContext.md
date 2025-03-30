# 技術コンテキスト (Tech Context)

_このドキュメントは、プロジェクトで使用されている技術、開発環境のセットアップ、技術的な制約、依存関係、およびツールの使用パターンを記述します。`projectbrief.md` に基づいています。_

## 1. 主要技術スタック

- **言語:** TypeScript (v5.8.2), JavaScript (ES Modules), HTML5, CSS3
- **フレームワーク/ライブラリ:** なし (Vanilla TypeScript/JavaScript)
- **テスト:** Jest (v29.7.0), ts-jest (v29.2.6)
- **ビルド/バンドル:** Parcel (v2.13.3)
- **リンティング:** ESLint (v8.0.1), @typescript-eslint/eslint-plugin (v6.4.0)
- **フォーマット:** Prettier (v3.0.0)
- **ステージング時チェック:** lint-staged (v15.0.0)
- **実行環境:** Node.js (開発・テスト時、バージョンは `package.json` の `engines` フィールド未指定だが、`@types/node` v22 を使用), Web ブラウザ (実行時)

## 2. 開発環境セットアップ

1.  **前提条件:** Node.js (推奨 v18 以上), npm (Node.js に同梱)
2.  **リポジトリクローン:** `git clone [リポジトリURL]`
3.  **依存関係インストール:** `cd tanshu3` して `npm install` を実行
4.  **開発モード (監視 & 自動ビルド):** `npm run watch` を実行。変更が `public/js/` に反映される。
5.  **手動ビルド:** `npm run build` を実行。`public/js/` にバンドルされたファイルが出力される。
6.  **テスト実行:** `npm test` を実行。
7.  **リンティング/フォーマット:**
    - `npm run lint`: コード検証
    - `npm run lint:fix`: 自動修正
    - `npm run format`: コード整形
    - `npm run check-format`: 整形チェック
    - `npm run check-all`: リント、フォーマット、テストを一括実行
8.  **アプリケーション実行:** `public/index.html` を Web ブラウザで開く (`file://` プロトコル)。
9.  **コマンド実行環境に関する注意:** システム情報 (`environment_details`) ではデフォルトシェルが `cmd.exe` と表示される場合がありますが、実際のコマンド実行環境は **PowerShell (`pwsh.exe`)** である可能性が高いです。`execute_command` ツールを使用する際は、PowerShell 構文でコマンドを記述してください (例: `rmdir /s /q` ではなく `Remove-Item -Recurse -Force`)。

## 3. 技術的な制約

- **実行環境:** Windows PC 上のモダンブラウザ (Chrome, Edge 推奨) で `file://` プロトコルで動作する必要がある。HTTP サーバー環境は想定しない。
- **状態管理:** アプリケーションはステートレスである必要がある。状態を永続化する仕組み（LocalStorage なども含む）は原則として使用しない。
- **外部通信:** サーバーサイド API や外部データベースへのアクセスは行わない。すべての処理はブラウザ内で完結する。
- **依存関係:** ランタイムの外部ライブラリ依存を極力避ける (開発ツールを除く)。コアロジックは Vanilla TypeScript/JavaScript で実装する。
- **ビルド:** Parcel を使用し、最終的な JavaScript コードは `public/js/` ディレクトリにバンドルされる必要がある。

## 4. 外部依存関係 (開発時)

本プロジェクトは実行時には外部ライブラリに依存しませんが、開発プロセスでは以下の主要な `devDependencies` を利用します。

- **TypeScript (`typescript`):** 型チェックと JavaScript へのコンパイル。
- **Parcel (`parcel`):** TypeScript/JavaScript コードのバンドル、開発サーバー機能。
- **Jest (`jest`, `ts-jest`, `@types/jest`):** ユニットテストおよび統合テストの実行フレームワーク。
- **ESLint (`eslint`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`, `eslint-config-prettier`, `eslint-plugin-prettier`):** コードの静的解析と品質チェック。
- **Prettier (`prettier`):** コードフォーマットの自動整形。
- **lint-staged (`lint-staged`):** Git ステージング時の自動品質チェック（リント、フォーマット）。
- **@types/node (`@types/node`):** Node.js API の型定義（テストコードなどで使用）。
- **jest-environment-jsdom (`jest-environment-jsdom`):** Jest で JSDOM テスト環境を提供。

## 5. ツール利用パターン

- **リンティング (ESLint):**
  - 設定ファイル: `.eslintrc.json`
  - 実行: `npm run lint` (チェック), `npm run lint:fix` (自動修正)
  - 規約: TypeScript 推奨ルール (`@typescript-eslint/recommended`), Prettier 連携 (`plugin:prettier/recommended`) をベースに、プロジェクト固有ルールを追加（戻り値型明示化警告、未使用変数エラー、any 型警告、行長警告、console 制限、コメントスタイル、シングルクォート、複雑度警告、厳密等価演算子強制など）。詳細は `docs/project_overview.md` 参照。
- **フォーマット (Prettier):**
  - 設定ファイル: `.prettierrc.json`
  - 実行: `npm run format` (整形), `npm run check-format` (チェック)
  - 規約: セミコロン必須、末尾カンマ、シングルクォート、行長 100、インデント 2 スペース、日本語コメントの改行維持 (`proseWrap: preserve`) など。詳細は `docs/project_overview.md` 参照。
- **テスト (Jest):**
  - 設定ファイル: `jest.config.js`, `tsconfig.test.json`
  - 実行: `npm test` (全テスト), `npm run test:watch` (監視モード), `npm run test:coverage` (カバレッジレポート生成)
  - 対象: `test/jest/` ディレクトリ以下の `*.test.ts` ファイル。ユニットテストと統合テストを含む。
  - 環境: `jsdom` 環境 (`jest.config.js` で設定)。UI コンポーネントのテストのために DOM 環境をシミュレート。Node.js 固有の機能は一部制限される可能性あり。
  - カバレッジ: レポートは `coverage/` ディレクトリに出力される。
- **ビルド (Parcel):**
  - 設定: `package.json` の `targets` セクションで設定。
  - 実行: `npm run build` (プロダクションビルド), `npm run watch` (開発モード)
  - 出力: `public/js/` ディレクトリにバンドルされた JavaScript ファイルとソースマップが出力される。`--public-url ./` により、`file://` 環境でのリソースパスを解決。
- **ステージング時チェック (lint-staged):**
  - 設定: `package.json` の `lint-staged` セクション
  - 動作: `git commit` 前にステージングされたファイルに対して ESLint (fix) と Prettier (write) を自動適用。 (注: husky が削除されたため、手動で `npx lint-staged` を実行するか、別の方法でフックを設定する必要があります)
