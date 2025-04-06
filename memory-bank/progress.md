# 進捗状況 (Progress)

_このドキュメントは、プロジェクトの現在の状態、完了した機能、残りの作業、既知の問題、およびプロジェクトの意思決定の変遷を記録します。`activeContext.md` と密接に関連し、定期的に更新されます。_

## 1. 現在のステータス (Current Status)

- **全体進捗:** **リリース自動化実装完了。Deno 移行完了。**
- **直近のマイルストーン:** GitHub Actions を利用したリリース自動化の実装、Deno 移行フェーズ8の完了 (`README.md` 更新など)。
- **現在のタスク:** リリース自動化のテスト、残存タスクの対応。

## 2. 完了した機能 (What Works)

- **ファイル入力:**
  - 単一または複数の入院EF統合ファイルの選択 (ファイルダイアログ、ドラッグ＆ドロップ)。
  - ファイルリスト表示とクリア機能。
  - **ファイルリストからステータスタグ（有効/警告/エラー）を削除。**
  - **ファイルリストに個別のファイル削除ボタンを追加。**
- **データ検証 (`validator.ts`):**
  - 必須項目（入院年月日、データ識別番号）のチェック。
  - 推奨項目（ヘッダー、退院年月日、データ区分）のチェック。
  - 形式チェック（日付 YYYYMMDD、数値）。
  - 列数チェック（10列以上）。
  - エラーと警告の区分表示 (`notification.ts`)。
- **データ解析 (`parsers.ts`):**
  - タブ区切りテキストファイルの解析。
  - ヘッダー行の解析とデータ行の構造化。
  - **症例識別キーを `データ識別番号` + `入院年月日` に変更し、同一患者の複数入院を正しく区別。**
- **短手３判定 (`evaluator.ts`):**
  - 定義されたロジックに基づく該当/非該当判定。
  - 入院日数計算。
  - 対象手術コード（大腸ポリープ切除術など）の判定。
- **複数ファイル・月またぎ処理 (`parsers.ts` の `mergeCases`):**
  - **症例識別キー（`データ識別番号` + `入院年月日`）に基づき、複数ファイル間のデータを正しく統合。**
  - 退院日の更新ロジックを改善し、該当する症例のみ更新。
- **結果表示・出力 (`result-viewer.ts`, `evaluator.ts` の `formatResults`):**
  - 判定結果の画面表示（テキストエリア）。
  - 全症例/対象症例のみのフィルタリング表示。
  - 日付フォーマット選択 (YYYYMMDD / YYYY/MM/DD)。
  - 結果のクリップボードへのコピー (`navigator.clipboard.writeText()`)。
  - (ダウンロード機能は未確認)
- **開発基盤:**
  - TypeScript による開発。
  - **Deno 移行中:**
    - **ランタイム:** Deno (v2.2.7)
    - **パッケージ管理:** URL Import / `import_map.json`
    - **Lint/Format:** `deno lint`/`deno fmt` (`deno.jsonc` で設定)
    - **テスト:** Deno Test (`deno.jsonc` で設定)
    - **ビルド:** esbuild (`deno.land/x/esbuild`) (`deno task bundle` で実行)。
    - **単一HTML生成:** `scripts/release.ts` (`deno task release:build` で実行)。
    - **リリース自動化:** GitHub Actions (`.github/workflows/release.yml`) によるタグプッシュ時の自動ビルド＆リリース。
    - **VS Code連携:** Deno 拡張機能有効化 (`.vscode/settings.json`)。
- **Deno 移行 (フェーズ1-8 完了):**
  - **フェーズ1:** 環境設定 (`deno.jsonc`, `import_map.json`, `.gitignore`, `.vscode/settings.json`)。
  - **フェーズ2:** コアロジック依存関係移行 (インポートパス修正、`node.ts` 削除)。
  - **フェーズ3:** コアロジックテスト移行 (Jest -> Deno Test)。
  - **フェーズ4:** UIレイヤー依存関係移行 (インポートパス修正)。
  - **フェーズ5:** UIレイヤーテスト移行
    - 全てのUIコンポーネントテスト(`file-manager_test.ts`、`notification_test.ts`、`result-viewer_test.ts`)を移行
    - `deno-dom`を使用したDOM環境のセットアップ
    - 依存性注入(DI)とテスト用サブクラスによるモック化の実装
    - クリップボードAPIやURL生成などの外部APIの適切なモック化
    - タイマー処理のモック化とクリーンアップ
    - `deno test --allow-read src/ui/components/`で全テスト（20件）のパスを確認
  - **フェーズ6:** 統合テスト移行
    - `test/integration/`ディレクトリの作成
    - `module-integration_test.ts`と`data-flow_test.ts`の移行
    - JestからDeno Testへのテスト構文変換
    - Node.jsのファイル操作APIをDenoの同等機能に置き換え
    - テスト実行で発生したエラーの修正
    - `deno test --allow-read test/integration/`で全テスト（14件）のパスを確認
  - **フェーズ7:** ビルド/実行方法の確立
    - Parcel 関連の依存関係とスクリプトを `package.json` から削除
    - `esbuild` を `import_map.json` に追加
    - ビルドスクリプト `scripts/build.ts` を作成
    - `deno.jsonc` に `check`, `lint`, `fmt`, `test`, `bundle` タスクを定義
    - `deno task bundle` でビルド成功を確認
  - **フェーズ8:** クリーンアップとドキュメント更新
    - **[完了]** Node.js関連ファイル (`package.json`, `node_modules/` など) の削除。
    - **[完了]** Memory Bank (`techContext.md`, `activeContext.md`, `progress.md`) の更新。
    - **[完了]** `README.md` の更新。
- **リリース自動化:**
  - **[完了]** 単一HTML生成スクリプト (`scripts/release.ts`) 作成。
  - **[完了]** `deno.jsonc` に `release:build` タスク追加。
  - **[完了]** `.gitignore` 更新 (ビルド成果物除外)。
  - **[完了]** GitHub Actions ワークフロー (`.github/workflows/release.yml`) 作成。
  - **[完了]** `docs/release_plan.md` 更新。
  - **[完了]** `README.md` 更新。
  - **[完了]** `scripts/release.ts` の CSS 埋め込みバグ修正。
  - **[完了]** `.gitignore` 設定修正と Git 追跡からの除外。
- **リファクタリング:**
  - `NotificationSystem` 遅延初期化、`FileManager` への DI 導入。
- **症例識別ロジック修正:**
  - `parsers.ts` の `parseEFFile`, `mergeCases` 修正 (複合キー導入)。
  - 関連テスト修正・追加。

## 3. 残りの作業 (What's Left to Build)

- **[未着手] リリース自動化テスト:**
  - `v*.*.*` 形式のタグをプッシュし、GitHub Actions ワークフローが正常に実行され、リリースが作成されるか確認。
  - 生成された `dist/tanshu3.html` をダウンロードし、動作確認。
- **[保留] Lint 警告修正:** `@typescript-eslint/explicit-function-return-type` 残り3箇所。
- **[保留] テストの充実:** UI レイヤーなど。
- **[保留] エラーハンドリング強化:** 全体見直し。
- **[保留] コードコメント修正・強化:** 全体見直し。
- **[保留] UI/UX の継続的改善:** 検討。
- **[保留] パフォーマンス最適化:** 検討。
- **[保留] 結果ダウンロード機能:** Deno 環境での動作確認。

## 4. 既知の問題とバグ (Known Issues & Bugs)

- **[警告] 残存するLint警告:** `@typescript-eslint/explicit-function-return-type` 3箇所。
- **[制約] UI テスト:** `deno-dom` の互換性に関する以下の制約を把握（対応済み）：
  - `element.click()`メソッド未実装
  - `style`プロパティの操作制限
  - `Document`型の不整合
- **[改善点] 大量データ処理時のパフォーマンス:** 未測定。
- **[要確認] ダウンロード機能:** Deno + esbuild 環境での動作確認が必要。

## 5. 意思決定の変遷 (Evolution of Decisions)

`activeContext.md` の「最近の主な変更点」を参照。

- **[2025-04-06]:** リリース自動化実装。単一HTML生成スクリプト、GitHub Actions ワークフロー導入。関連ドキュメント更新、バグ修正。
- **[2025-04-06]:** Deno 移行フェーズ8完了。Node.js 関連ファイル削除、Memory Bank 更新、README 更新。
- **[2025-04-06]:** Deno 移行フェーズ7完了。ビルドツールを Parcel から esbuild に変更。`deno.jsonc` にタスクを定義。
- **[2025-04-05]:** Deno 移行フェーズ6完了。統合テストを Deno Test 環境に移行。
- **[2025-04-05]:** Deno 移行フェーズ5完了。UI テストを Deno Test 環境に移行。
- **[2025-04-05]:** Deno 移行フェーズ4完了 (UIレイヤー依存関係移行)。
- **[2025-04-05]:** Deno 移行フェーズ3完了 (コアロジックテスト移行)。
- **[2025-04-05]:** Deno 移行フェーズ2完了 (コアロジック依存関係移行)。
- **[2025-04-05]:** Deno 移行フェーズ1完了 (環境設定と基本ツール導入)。
- **[2025-04-05]:** Node.js から Deno への移行を決定、段階的方針採用。
- (以下、過去の意思決定)
- **[2025-04-05]:** ファイル選択 UI 改善。
- **[2025-04-05]:** 症例識別ロジック修正。
- **[2025-04-04]:** `validator.ts` リファクタリング。
- **[2025-03-30]:** (旧) ESLint v9 移行。
- **[2025-03-30]:** (旧) VS Code Prettier 設定標準化。
- **[2025-03-30]:** (旧) Jest 環境変更 (`jsdom`)、UI テスト修正。
- **[2025-03-29]:** (旧) レガシーコード削除。
- **[2025-03-27]:** (旧) 開発ツール設定最適化。
- **[日付不明]:** クリップボード API 変更。
- **[日付不明]:** (旧) Parcel 採用。
