# アクティブコンテキスト (Active Context)

_このドキュメントは、現在の作業焦点、最近の変更点、次のステップ、進行中の決定事項、重要なパターンや好み、そしてプロジェクトから得られた学びを記録します。`productContext.md`, `systemPatterns.md`, `techContext.md` に基づき、常に最新の状態を反映します。_

## 1. 現在の作業焦点 (Current Focus)

- **Deno 移行:** 計画フェーズ4「UI レイヤー (`src/ui`, `src/browser`) の依存関係移行」の開始。

## 2. 最近の主な変更点 (Recent Changes)

- **2025-04-05 (最新):**
  - **Deno 移行 (フェーズ1-3 完了):**
    - **フェーズ1 (環境設定と基本ツール導入):**
      - `feature/deno-migration` ブランチ作成。
      - Deno (v2.2.7) インストール確認。
      - `deno.jsonc` (fmt, lint, compilerOptions, importMap 設定) および `import_map.json` 作成。
      - `deno lint --fix` で初期 Lint エラー修正 (`window`/`global` -> `globalThis`)。
      - `deno fmt` でプロジェクト全体のフォーマット適用。
      - `.gitignore` に `deno.lock` 追加。
      - `.vscode/settings.json` を更新し、Deno 拡張機能を有効化、デフォルトフォーマッターを Deno に設定。VS Code のリロードにより TS エラー解消を確認。
    - **フェーズ2 (コアロジック依存関係移行):**
      - `src/core/` 配下の `.ts` ファイルのインポート/エクスポートパスに `.ts` 拡張子を追加。
      - 不要な `src/core/adapters/node.ts` を削除。
      - `deno check src/core/**/*.ts` で型エラーがないことを確認。
    - **フェーズ3 (コアロジックテスト移行):**
      - `test/jest/unit/` 内のコアロジックテストファイルを `src/core/` 配下に `_test.ts` として移動・リネーム。
      - Jest 構文 (`describe`, `it`, `expect`) を Deno Test 構文 (`Deno.test`, `assert` モジュール) に書き換え。
      - `deno.jsonc` の `compilerOptions.lib` に `"deno.ns"` を追加し、`Cannot find name 'Deno'` エラーを解消。
      - `evaluator.ts` のロジック順序を修正し、失敗していたテストを修正。
      - 不要なコメント (`// 追加` など) をテストファイルから削除。
      - `deno test --allow-read src/core/` でコアロジックテスト全件 (102件) パスを確認。
    - 移行計画ドキュメント `docs/deno_migration_plan.md` を作成。
- **2025-04-05:**
  - **ファイル選択 UI 変更:**
    - 選択されたファイルリストから、各ファイルの「有効」「警告」「エラー」といった状態を示すタグ表示を削除 (`src/ui/components/file-manager.ts`, `public/css/styles.css`)。詳細な検証メッセージは維持。
    - 各ファイル名の横に削除ボタン（'×'）を追加し、ユーザーが個別にファイルを選択解除できる機能を追加 (`src/ui/components/file-manager.ts`, `public/css/styles.css`)。
    - 関連する TypeScript コード (`file-manager.ts`) と CSS (`styles.css`) を修正し、ビルド (`npm run build`) を実行。
- **2025-04-05:**
  - **症例識別ロジック修正:** 同一患者の複数入院（同一月内、複数月）が正しく処理されない問題を修正。
    - `src/core/common/parsers.ts` の `parseEFFile` および `mergeCases` 関数を修正し、症例の識別キーを `データ識別番号` のみから `データ識別番号` + `入院年月日` の複合キーに変更。
    - これにより、各入院が一意の症例として扱われるようになり、退院日や手術情報が他の入院情報によって上書きされる問題が解消された。
    - 関連するユニットテスト (`test/jest/unit/parsers.test.ts`) および統合テスト (`test/jest/integration/data-flow.test.ts`) を修正・追加し、新しいロジックで全てのテストがパスすることを確認。
    - 修正計画を `docs/fix_case_identification_plan.md` に記録 (現在は Deno 移行計画が優先)。
- **2025-04-04:**
  - `src/core/validator.ts` の `prefer-const` ESLint エラーを解消 (リファクタリング)。
  - 関連テスト (`test/jest/unit/validator.test.ts`) を修正。
  - `src/ui/components/file-manager.ts` の `@typescript-eslint/explicit-function-return-type` 警告を修正。
  - 残りの Lint 警告 (`@typescript-eslint/explicit-function-return-type`) の修正作業は一時中断中。
- **2025-03-30:**
  - ESLint v9.23.0 へのアップデートと設定移行 (`eslint.config.js`)。
- **2025-03-30:**
  - リファクタリング作業 (Jest 環境変更、UI テスト修正など)。
- **2025-03-29:** リファクタリング計画 3.1 完了 (レガシーテスト・型定義削除)。
- **2025-03-29:** リファクタリング計画 (`docs/refactoring_plan.md`) 作成。
- **2025-03-29 (以前):** Memory Bank 初期化・更新。
- **2025-03-27:** 開発ツール設定最適化 (ESLint, Prettier, lint-staged, npm scripts)。
- **(日付不明):** クリップボード API 変更、統合テスト強化、Parcel 設定改善、バリデーション強化、UI/UX 改善。

## 3. 次のステップ (Next Steps)

1. **Deno 移行 (フェーズ4):** UI レイヤー (`src/ui`, `src/browser`) の依存関係移行を開始する (`docs/deno_migration_plan.md` 参照)。
   - インポートパスへの `.ts` 拡張子追加。
   - 依存関係の `import_map.json` への登録。
   - `deno check` での型エラー確認。
2. **Deno 移行 (フェーズ5以降):** 計画に基づき、UI テスト移行、統合テスト移行、ビルド/実行方法確立、クリーンアップ、ドキュメント更新を進める。

## 4. 進行中の決定事項と考慮事項 (Active Decisions & Considerations)

- **Deno 移行:**
  - 計画 (`docs/deno_migration_plan.md`) に基づき、段階的に移行を進める。
  - **ツール統一:** ESLint/Prettier/Jest から `deno lint`/`deno fmt`/`deno test` へ移行。
  - **依存管理:** npm/`package.json` から URL インポート/`import_map.json` へ移行。
  - **ビルド:** Parcel から `deno bundle` (または `deno compile`) へ移行検討。`file://` 実行維持のため `deno bundle` が有力。
  - **テスト環境:** Jest (`jsdom`) から Deno Test へ移行。UI テストでの DOM 環境再現には `deno-dom` 利用を検討。
  - **VS Code連携:** Deno 拡張機能を有効化し、エディタでの Lint/Format/型チェックを Deno に合わせる (`.vscode/settings.json` 更新済み)。
- **Lint 警告対応方針:** `@typescript-eslint/explicit-function-return-type` 警告は Deno 移行完了後に `deno lint` のルールとして再評価・対応する。
- **コード品質の標準化:** Deno 移行後は `deno fmt` と `deno lint` を標準とする (`deno.jsonc` で設定)。
- **テストカバレッジ向上:** Deno 移行後、`deno coverage` を利用してカバレッジを測定し、不足箇所 (特に UI レイヤー) のテストを追加する。
- **パフォーマンス:** Deno 移行完了後、必要に応じてパフォーマンス測定と最適化を検討。
- **エラーハンドリング:** Deno 移行完了後、全体的なエラーハンドリングを見直し、強化する。

## 5. 重要なパターンと好み (Key Patterns & Preferences)

- **コードフォーマット:** **`deno fmt`** による一貫したコードスタイル (`deno.jsonc` 設定準拠)。VSCodeでの自動フォーマット連携済み。
- **関心の分離:** UI (`src/ui`, `src/browser`) とコアロジック (`src/core`) の分離は維持。
- **型安全性:** TypeScript の静的型付け活用。`any` 型回避。**Deno 移行後も継続。**
- **イミュータビリティ:** 可能な限りイミュータブルなデータ操作を心がける。
- **コード品質ツール活用:** **`deno lint`, `deno fmt`, `deno test`** を規約通りに利用する。
- **日本語コメント:** 継続して適切な日本語コメントを付与する。
- **環境抽象化:** Adapter パターン (`src/core/adapters`) は維持 (ただし `node.ts` は削除済み)。
- **モダン API の利用:** 継続。
- **設定ファイル駆動:** **`deno.jsonc`, `import_map.json`** で Deno 関連設定を管理。
- **テスト戦略の柔軟性:** UI テスト移行時に `deno-dom` の制約などがあれば、テスト範囲や方法を調整する。

## 6. 学びと洞察 (Learnings & Insights)

- **Deno 移行の準備:**
  - `deno.jsonc` で Lint, Format, Compiler Options, Tasks, Import Map を一元管理できる。
  - `deno lint --fix` は基本的な問題を自動修正できる。
  - `deno fmt` は Prettier と同様のフォーマット機能を提供する。
  - VS Code Deno 拡張機能 (`denoland.vscode-deno`) と `.vscode/settings.json` の設定により、エディタと Deno ツールを連携させることが重要。特に `deno.enable`, `deno.lint`, `editor.defaultFormatter` の設定。
  - Deno Test を使用するには `compilerOptions.lib` に `"deno.ns"` を追加する必要がある。
- **Deno Test への移行:**
  - Jest (`describe`, `it`, `expect`) から Deno Test (`Deno.test`, `assert` モジュール) への書き換えは比較的直感的。
  - Deno 標準の `assert` モジュールは Jest の `expect` に相当する多様なアサーション関数を提供している。
  - テストファイル名は `_test.ts` または `.test.ts` とする。
  - テスト実行時に `--allow-*` フラグで必要な権限を付与する必要がある (例: ファイル読み込みには `--allow-read`)。
  - `deno test <ディレクトリ>` でディレクトリ内のテストを一括実行できる。
- **その他:**
  - (既存) ESLint ルールの誤検知と対処。
  - (既存) リファクタリングとテストの連動の重要性。
  - (既存) `file://` 環境の制約。
  - (既存) コアロジック分離の利点。
  - (既存) 複数ファイル処理・症例識別の複雑さと重要性。
  - (既存) ドキュメントと Memory Bank の価値。
