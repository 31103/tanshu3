# アクティブコンテキスト (Active Context)

_このドキュメントは、現在の作業焦点、最近の変更点、次のステップ、進行中の決定事項、重要なパターンや好み、そしてプロジェクトから得られた学びを記録します。`productContext.md`, `systemPatterns.md`, `techContext.md` に基づき、常に最新の状態を反映します。_

## 1. 現在の作業焦点 (Current Focus)

- **メモリバンクの更新:** プロジェクトの現状を反映させるため、すべてのコアメモリバンクファイル (`projectbrief.md`, `productContext.md`, `systemPatterns.md`, `techContext.md`, `activeContext.md`, `progress.md`) の内容を確認し、`docs/project_overview.md` や `package.json` などの情報に基づいて更新する。

## 2. 最近の主な変更点 (Recent Changes)

- **2025-03-29:** メモリバンクの初期化および更新作業を開始。`projectbrief.md`, `productContext.md`, `systemPatterns.md`, `techContext.md` をプロジェクトの現状に合わせて更新。
- **2025-03-27 (docs/project_overview.md より):** 開発ツール設定の最適化を実施。
  - ESLint 設定強化 (型チェック連携、複雑度チェック、日本語コメント対応など)。
  - Prettier 設定拡張 (日本語コメント対応、HTML フォーマット最適化など)。
  - Husky/lint-staged の完全実装 (コミット前/プッシュ前の自動チェック)。
  - npm scripts 拡張 (`lint:fix`, `check-format`, `check-all` 追加)。
- **(日付不明、docs/project_overview.md より):**
  - クリップボードコピー機能を `navigator.clipboard.writeText()` API に変更。
  - データフロー統合テスト (`data-flow.test.ts`) を強化（模擬データ使用、シナリオテスト追加）。
  - Parcel による `file://` プロトコル対応改善。
  - バリデーション機能強化（エラー/警告区分、ヘッダー検証柔軟化など）。
  - UI/UX 改善（ドラッグ＆ドロップ、クリアボタン、結果テキストエリアなど）。

## 3. 次のステップ (Next Steps)

1.  **メモリバンク更新完了:** `progress.md` を更新して、メモリバンク更新タスクを完了する。
2.  **ユーザー指示待機:** 次に取り組むべき具体的な開発タスクや改善項目について、ユーザーからの指示を待つ。
3.  **(指示がない場合) 課題への取り組み:** `docs/project_overview.md` の「今後の課題」セクションにある項目（UI/UX 改善、カバレッジ向上、リファクタリングなど）から優先度の高いものに着手することを検討する。

## 4. 進行中の決定事項と考慮事項 (Active Decisions & Considerations)

- **UI/UX のさらなる改善:** 現在の UI は機能的だが、より洗練されたデザインやインタラクションの導入を検討。具体的な改善点は未定。
- **テストカバレッジ向上:** 特に `src/core/common/utils.ts` (72.61%) や `src/core/common/parsers.ts` (85.62%) のカバレッジ向上が課題。UI レイヤー (`src/ui`, `src/browser`) のテスト戦略も検討が必要。
- **パフォーマンス:** 大量データ（多数のファイル、長期間のデータ）を処理した場合のパフォーマンス測定と、必要に応じた最適化方法の検討。Web Workers の利用などが考えられるが、`file://` 環境での制約も考慮が必要。
- **エラーハンドリング:** 現在のエラー/警告通知に加え、より詳細なエラー情報や、予期せぬエラー発生時のフォールバック処理の強化を検討。
- **レガシーコード:** `test/run-tests.js` や `test/accessibility/`, `test/browser-compatibility/` など、Jest 導入前のテストコードや未整備のテストが存在する可能性があり、整理または Jest への移行を検討。

## 5. 重要なパターンと好み (Key Patterns & Preferences)

- **関心の分離:** UI (`src/ui`, `src/browser`) とコアロジック (`src/core`) を明確に分離する。コアロジックは環境非依存とする。
- **型安全性:** TypeScript の静的型付けを最大限に活用し、`any` 型の使用は極力避ける。関数のインターフェース（引数、戻り値）には型を明記する (`@typescript-eslint/explicit-function-return-type`: warn)。
- **イミュータビリティ:** 可能な限り、データ構造を直接変更せず、新しいオブジェクトや配列を生成して返すように心がける（特にコアロジック内）。
- **コード品質ツール活用:** ESLint, Prettier, Jest を規約通りに利用し、Husky による自動チェックを維持する。
- **日本語コメント:** コードの意図を明確にするため、適切な日本語コメントを付与する (`.clinerules` 準拠)。
- **環境抽象化:** 環境依存処理 (ファイル読み込み等) は Adapter パターン (`src/core/adapters`) を介して行う。
- **モダン API の利用:** `document.execCommand` のような古い API ではなく、`navigator.clipboard` のようなモダンな API を優先的に使用する。
- **設定ファイル駆動:** リンター、フォーマッター、テスト、ビルドの設定は、それぞれの設定ファイル (`.eslintrc.json`, `.prettierrc.json`, `jest.config.js`, `package.json`) で管理する。

## 6. 学びと洞察 (Learnings & Insights)

- **`file://` 環境の制約:** Parcel の `--public-url ./` 設定が `file://` でのリソース解決に重要。Web Workers など一部のブラウザ機能に制約がある可能性も考慮が必要。
- **開発ツールの重要性:** ESLint, Prettier, Husky, Jest の組み合わせは、コードの一貫性と品質を保ち、リファクタリングや機能追加を安全に進める上で不可欠。特に日本語コメントを含むコードベースでは Prettier の `proseWrap: preserve` が有効。
- **コアロジック分離の利点:** ビジネスロジックを UI から分離することで、Jest によるテストが容易になり、ロジックの正確性を担保しやすくなった。
- **複数ファイル処理の複雑さ:** ステートレスな設計の中で、複数ファイルにまたがる患者データを正しくマージし、状態変化（退院日確定など）を追跡するロジック (`file-processor.ts`) は慎重な設計とテストが必要。
- **ドキュメントの価値:** `docs/project_overview.md` がプロジェクト理解の鍵となる。メモリバンクと連携し、常に最新の状態を保つことが重要。
