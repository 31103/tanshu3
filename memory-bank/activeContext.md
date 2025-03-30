# アクティブコンテキスト (Active Context)

_このドキュメントは、現在の作業焦点、最近の変更点、次のステップ、進行中の決定事項、重要なパターンや好み、そしてプロジェクトから得られた学びを記録します。`productContext.md`, `systemPatterns.md`, `techContext.md` に基づき、常に最新の状態を反映します。_

## 1. 現在の作業焦点 (Current Focus)

- **Memory Bank 更新:** リファクタリング作業を一時中断し、現在の状況を Memory Bank に反映させる。

## 2. 最近の主な変更点 (Recent Changes)

- **2025-03-30:**
  - リファクタリング作業再開。現状調査と計画更新 (`docs/refactoring_plan.md`)。
  - Jest テスト環境を `node` から `jsdom` に変更 (`jest.config.js`, `jest-environment-jsdom` 導入)。
  - UI コンポーネントのテストファイル (`notification.test.ts`, `file-manager.test.ts`, `result-viewer.test.ts`) で Jest グローバル関数を明示的にインポート。
  - `file-manager.test.ts` のモック型エラーを修正。
  - `result-viewer.ts` のグローバルインスタンス作成を削除し、`main.ts` でインスタンス化するように変更。
  - `result-viewer.test.ts` の `URL.createObjectURL` / `revokeObjectURL` をモック化し、関連するアサーションを修正。
- **2025-03-29 (コミット c586776):**
  - リファクタリング計画 3.1 に基づき、レガシーテスト (`test/run-tests.js` など) とグローバル型定義 (`src/types/types.d.ts`) を削除・整理。
- **2025-03-29 (コミット 764e193):**
  - リファクタリング計画 (`docs/refactoring_plan.md`) を作成。
- **2025-03-29 (以前):** メモリバンクの初期化および更新作業。`projectbrief.md`, `productContext.md`, `systemPatterns.md`, `techContext.md` を更新。
- **2025-03-27 (docs/project_overview.md より):** 開発ツール設定の最適化を実施。
  - ESLint 設定強化 (型チェック連携、複雑度チェック、日本語コメント対応など)。
  - Prettier 設定拡張 (日本語コメント対応、HTML フォーマット最適化など)。
  - lint-staged の実装 (コミット前の自動チェック)。
  - npm scripts 拡張 (`lint:fix`, `check-format`, `check-all` 追加)。
- **(日付不明、docs/project_overview.md より):**
  - クリップボードコピー機能を `navigator.clipboard.writeText()` API に変更。
  - データフロー統合テスト (`data-flow.test.ts`) を強化（模擬データ使用、シナリオテスト追加）。
  - Parcel による `file://` プロトコル対応改善。
  - バリデーション機能強化（エラー/警告区分、ヘッダー検証柔軟化など）。
  - UI/UX 改善（ドラッグ＆ドロップ、クリアボタン、結果テキストエリアなど）。

## 3. 次のステップ (Next Steps) - 作業再開時

1.  **テスト修正:** `npm test` で失敗している残りのテスト (`result-viewer.test.ts` 4件, `notification.test.ts` 2件, `file-manager.test.ts` 8件) を修正する。
2.  **リファクタリング継続:** テストが全てパスするようになったら、`docs/refactoring_plan.md` の残りの項目 (3.2 のテスト拡充、3.3 エラーハンドリング、3.4 コメント強化) を進める。
3.  **変更のコミット:** テスト修正とリファクタリングの進捗を適切な粒度でコミットする。
4.  **Memory Bank 更新:** リファクタリング完了後、最終的な変更を反映させる (項目 3.5)。

## 4. 進行中の決定事項と考慮事項 (Active Decisions & Considerations)

- **UI/UX のさらなる改善:** 現在の UI は機能的だが、より洗練されたデザインやインタラクションの導入を検討。具体的な改善点は未定。
- **テストカバレッジ向上:** `docs/refactoring_plan.md` 3.2 の目標達成。特に `src/core/common/utils.ts` や UI レイヤーのテスト拡充。
- **テスト失敗の解決 (2025-03-30 時点):**
    - `result-viewer.test.ts` (4件失敗): テキストエリアクリア不具合、コピーメッセージ表示不具合 (`visible` クラス)、表示モード切り替え時のスタイル不一致。
    - `notification.test.ts` (2件失敗): アサーションエラー (通知集約、履歴モーダル表示)。
    - `file-manager.test.ts` (8件失敗): モックエラー (`TypeError: mockedValidateFiles.mockResolvedValue is not a function`)、UI 更新不一致、`DragEvent`/`DataTransfer` 未定義エラー。
- **UI/UX のさらなる改善:** 現在の UI は機能的だが、より洗練されたデザインやインタラクションの導入を検討。具体的な改善点は未定。
- **パフォーマンス:** 大量データ処理時のパフォーマンス測定と最適化検討 (Web Workers など、`file://` 制約考慮)。
- **エラーハンドリング:** コアロジック側での詳細なエラー情報生成と通知連携の強化。
- **レガシーコード:** 3.1 で主要なファイルは削除済みだが、プロジェクト内に未使用コードや古いコメントが残存している可能性の確認。

## 5. 重要なパターンと好み (Key Patterns & Preferences)

- **関心の分離:** UI (`src/ui`, `src/browser`) とコアロジック (`src/core`) を明確に分離する。コアロジックは環境非依存とする。
- **型安全性:** TypeScript の静的型付けを最大限に活用し、`any` 型の使用は極力避ける。関数のインターフェース（引数、戻り値）には型を明記する (`@typescript-eslint/explicit-function-return-type`: warn)。
- **イミュータビリティ:** 可能な限り、データ構造を直接変更せず、新しいオブジェクトや配列を生成して返すように心がける（特にコアロジック内）。
- **コード品質ツール活用:** ESLint, Prettier, Jest, lint-staged を規約通りに利用する。
- **日本語コメント:** コードの意図を明確にするため、適切な日本語コメントを付与する (`.clinerules` 準拠)。
- **環境抽象化:** 環境依存処理 (ファイル読み込み等) は Adapter パターン (`src/core/adapters`) を介して行う。
- **モダン API の利用:** `document.execCommand` のような古い API ではなく、`navigator.clipboard` のようなモダンな API を優先的に使用する。
- **設定ファイル駆動:** リンター、フォーマッター、テスト、ビルドの設定は、それぞれの設定ファイル (`.eslintrc.json`, `.prettierrc.json`, `jest.config.js`, `package.json`) で管理する。

## 6. 学びと洞察 (Learnings & Insights)

- **`file://` 環境の制約:** Parcel の `--public-url ./` 設定が `file://` でのリソース解決に重要。Web Workers など一部のブラウザ機能に制約がある可能性も考慮が必要。
- **開発ツールの重要性:** ESLint, Prettier, Jest, lint-staged の組み合わせは、コードの一貫性と品質を保ち、リファクタリングや機能追加を安全に進める上で不可欠。特に日本語コメントを含むコードベースでは Prettier の `proseWrap: preserve` が有効。
- **コアロジック分離の利点:** ビジネスロジックを UI から分離することで、Jest によるテストが容易になり、ロジックの正確性を担保しやすくなった。
- **複数ファイル処理の複雑さ:** ステートレスな設計の中で、複数ファイルにまたがる患者データを正しくマージし、状態変化（退院日確定など）を追跡するロジック (`file-processor.ts`) は慎重な設計とテストが必要。
- **ドキュメントの価値:** `docs/project_overview.md` がプロジェクト理解の鍵となる。メモリバンクと連携し、常に最新の状態を保つことが重要。
