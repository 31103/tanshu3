# アクティブコンテキスト (Active Context)

_このドキュメントは、現在の作業焦点、最近の変更点、次のステップ、進行中の決定事項、重要なパターンや好み、そしてプロジェクトから得られた学びを記録します。`productContext.md`, `systemPatterns.md`, `techContext.md` に基づき、常に最新の状態を反映します。_

## 1. 現在の作業焦点 (Current Focus)

- **Memory Bank の整理:** 冗長な記述や重複を排除し、各ファイルの役割を明確化する。

## 2. 最近の主な変更点 (Recent Changes)

- **2025-04-12:** Memory Bank 整理開始 (`progress.md` を統合)。
- **2025-04-11:** プロジェクト整理完了 (不要ファイル削除、コメント整理、Issue #8 作成)。
- **2025-04-10:** 短手３判定ロジック修正（加算除外）。「他の手術」判定時に診療明細名称に「加算」を含むものを除外。
- **2025-04-10:** バージョン表示機能と自動更新・タグ付けスクリプト (`scripts/bump-version.ts`) を実装。
- **2025-04-08:** 短手３判定ロジック修正（旧）。データ区分とコードで「他の手術」を判定。パーサー堅牢性 Issue #2 作成。
- **2025-04-06:** CI/CD 推進計画 (Issue #1) 完了。CI/CD ワークフロー実装・強化。
- **2025-04-06:** Deno 移行完了 (全フェーズ)。ビルドツールを esbuild に変更。Node.js 関連ファイル削除。

_(詳細な変更履歴は Git のコミットログを参照)_

## 3. 次のステップ (Next Steps)

1. **Memory Bank 整理:**
   - `activeContext.md`, `systemPatterns.md`, `techContext.md` を整理・簡潔化。
   - 全体的な重複記述を排除。
2. **CI/CD ワークフローテスト:** (Memory Bank 整理後)
   - CI (`ci.yml`) と CD (`release.yml`) が期待通り動作するか確認。
3. **残存タスク対応:**
   - **[保留]** パーサー: スキップ行のユーザー通知機能実装 (Issue #8)。
   - **[保留]** Lint 警告修正 (`@typescript-eslint/explicit-function-return-type` 残り3箇所)。
   - **[保留]** テストの充実 (UI レイヤーなど)。
   - **[保留]** エラーハンドリング強化。
   - **[保留]** コードコメント修正・強化。
   - **[保留]** UI/UX の継続的改善。
   - **[保留]** パフォーマンス最適化。
   - **[保留]** 結果ダウンロード機能の Deno 環境での動作確認。

## 4. 進行中の決定事項と考慮事項 (Active Decisions & Considerations)

- **CI/CD パイプライン:** GitHub Actions を利用 (CI: `ci.yml`, CD: `release.yml` + `release-drafter`)。
- **コミット規約:** Conventional Commits を採用。
- **リリースプロセス:** タグプッシュによる自動化。
- **技術スタック:** Deno, TypeScript, esbuild を中心とする。
- **ビルド方法:** `deno task bundle` (開発用), `deno task release:build` (リリース用単一HTML)。
- **バージョン管理:** `src/core/common/version.ts` で一元管理。`deno task release:bump` で自動更新。

## 5. 重要なパターンと好み (Key Patterns & Preferences)

- (変更なし)

## 6. 学びと洞察 (Learnings & Insights)

- **Memory Bank の肥大化:** 詳細な変更履歴や意思決定の変遷を記録しすぎると、情報が重複し、最新状況の把握が困難になる。
- **短手３判定ロジックの複雑さ:** 当初の単純なコードベースの判定から、データ区分、診療明細名称（加算除外）など、複数の要素を考慮する必要があることが判明。テスト駆動開発がロジックの正確性担保に不可欠。
- **Deno 移行の課題:** Node.js との API 差異（ファイル操作、パス解決、テスト構文、DOM シミュレーション、モック手法、タイマー処理）への対応が必要。特に UI テストでの `deno-dom` の制約と対策（イベントディスパッチ、属性操作、DI、サブクラス化、モンキーパッチ）は重要な知見。

## 7. 完了した主要機能 (Completed Features)

- ファイル入力 (複数可、D&D対応、個別削除)
- データ検証 (必須項目、形式、列数)
- データ解析 (タブ区切り、ヘッダー、症例識別、診療行為詳細保持)
- 短手３判定 (定義ロジック、入院日数、対象手術、他の手術判定[データ区分/コード/加算除外])
- 複数ファイル・月またぎ処理 (データ統合、退院日更新、重複排除)
- 結果表示・出力 (フィルタリング、日付フォーマット、コピー)
- 開発基盤 (Deno, TypeScript, esbuild, Deno Test, CI/CD)
- バージョン管理 (表示、自動更新スクリプト)

## 8. 既知の問題と制約 (Known Issues & Constraints)

- **[警告]** 残存するLint警告: `@typescript-eslint/explicit-function-return-type` 3箇所。
- **[制約]** UI テスト: `deno-dom` の互換性制約 (上記「学び」参照)。
- **[改善点]** 大量データ処理時のパフォーマンス: 未測定。
- **[要確認]** ダウンロード機能: Deno + esbuild 環境での動作確認が必要。
