# 進捗状況 (Progress)

_このドキュメントは、プロジェクトの現在の状態、完了した機能、残りの作業、既知の問題、およびプロジェクトの意思決定の変遷を記録します。`activeContext.md` と密接に関連し、定期的に更新されます。_

## 1. 現在のステータス (Current Status)

- **全体進捗:** **Deno 移行作業中 (フェーズ3完了)。** 主要機能は実装済み。
- **直近のマイルストーン:** Deno 移行フェーズ1-3完了 (環境設定、コアロジック依存関係・テスト移行)。
- **現在のタスク:** Deno 移行フェーズ4「UI レイヤー依存関係移行」を開始。

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
    - **ランタイム:** Node.js -> Deno (v2.2.7)
    - **パッケージ管理:** npm -> URL Import / `import_map.json`
    - **Lint/Format:** ESLint/Prettier -> `deno lint`/`deno fmt` (`deno.jsonc` で設定)
    - **テスト:** Jest -> Deno Test (`deno.jsonc` で設定)
    - **ビルド:** Parcel -> `deno bundle` (検討中)
    - **VS Code連携:** Deno 拡張機能有効化 (`.vscode/settings.json`)
  - (旧) Parcel によるビルドとバンドル (`file://` 対応)。
  - (旧) Jest によるユニットテスト・統合テスト (コアロジック中心)。
  - (旧) ESLint(v9.23.0)/Prettier によるコード品質・フォーマット維持。
  - (旧) eslint.config.js によるESLint v9設定の実装。
  - (旧) Husky/lint-staged による自動品質チェック。
- **Deno 移行 (フェーズ1-3 完了):**
  - 環境設定 (`deno.jsonc`, `import_map.json`, `.gitignore`, `.vscode/settings.json`)。
  - コアロジック (`src/core/`) の依存関係移行 (インポートパス修正、`node.ts` 削除)。
  - コアロジックのテスト移行 (Jest -> Deno Test、テストファイル移動、構文書き換え、`evaluator.ts` ロジック修正)。
- **リファクタリング (一部):**
  - (旧) ESLint v9 へのアップデート。
  - (旧) レガシーテスト・型定義削除。
  - (旧) Jest テスト環境変更 (`jsdom`)。
  - (旧) UI テスト修正 (一部)。
  - (旧) `validator.ts` リファクタリング。
- **Lint 警告修正 (一部):**
  - (旧) `src/ui/components/file-manager.ts` の `@typescript-eslint/explicit-function-return-type` 警告修正。
- **症例識別ロジック修正:**
  - `parsers.ts` の `parseEFFile`, `mergeCases` 修正 (複合キー導入)。
  - 関連テスト修正・追加。

## 3. 残りの作業 (What's Left to Build)

`docs/deno_migration_plan.md` に基づく。

- **[進行中] Deno 移行 (フェーズ4):** UI レイヤー (`src/ui`, `src/browser`) の依存関係移行。
- **[未着手] Deno 移行 (フェーズ5):** UI レイヤーのテスト移行 (`deno-dom` 検討)。
- **[未着手] Deno 移行 (フェーズ6):** 統合テストの移行。
- **[未着手] Deno 移行 (フェーズ7):** ビルド/実行方法の確立 (`deno bundle` 検討)。
- **[未着手] Deno 移行 (フェーズ8):** クリーンアップ (Node.js 関連ファイル削除)、ドキュメント更新 (`README.md`, Memory Bank)。
- **[保留] Lint 警告修正:** `@typescript-eslint/explicit-function-return-type` 残り3箇所 (Deno 移行後 `deno lint` で対応)。
- **[保留] テストの充実:** Deno 移行後、`deno coverage` でカバレッジを確認し、UI レイヤーなどを中心に追加。
- **[保留] エラーハンドリング強化:** Deno 移行後に全体を見直し。
- **[保留] コードコメント修正・強化:** Deno 移行後に全体を見直し。
- **[保留] UI/UX の継続的改善:** Deno 移行後に検討。
- **[保留] パフォーマンス最適化:** Deno 移行後に検討。
- **[保留] 結果ダウンロード機能:** 実装状況確認と Deno 環境での動作確認。

## 4. 既知の問題とバグ (Known Issues & Bugs)

- **[移行中] 開発環境:** 現在 Node.js と Deno のツール・設定が混在している状態。
- **[警告] 残存するLint警告:** `@typescript-eslint/explicit-function-return-type` 警告が3箇所残存 (Deno 移行後に `deno lint` で対応予定)。
- **[制約] UI テスト移行:** Deno Test での DOM 環境再現 (`deno-dom`) が課題となる可能性。
- **[改善点] 大量データ処理時のパフォーマンス:** 未測定。
- **[要確認] ダウンロード機能:** 実装状況と Deno 環境での動作確認が必要。

## 5. 意思決定の変遷 (Evolution of Decisions)

`activeContext.md` の「最近の主な変更点」および `docs/deno_migration_plan.md` を参照。

- **[2025-04-05]:** Node.js から Deno への移行を決定。段階的に進める方針を採用 (`docs/deno_migration_plan.md` 作成)。
- **[2025-04-05]:** Deno 移行フェーズ1-3 を実施。環境設定、コアロジック依存関係・テスト移行完了。VS Code Deno 拡張機能連携設定。
- (以下、過去の意思決定)
- **[2025-04-05]:** ファイル選択 UI 改善。
- **[2025-04-05]:** 症例識別ロジック修正 (複合キー導入)。
- **[2025-04-04]:** `validator.ts` リファクタリング。
- **[2025-03-30]:** ESLint v9 移行。
- **[2025-03-30]:** VS Code Prettier 設定標準化。
- **[2025-03-30]:** Jest 環境変更 (`jsdom`)、UI テスト修正。
- **[2025-03-29]:** リファクタリング開始 (レガシーコード削除)。
- **[2025-03-27]:** 開発ツール設定最適化。
- **[日付不明]:** クリップボード API 変更。
- **[日付不明]:** Parcel 採用。
