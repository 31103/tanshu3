# アクティブコンテキスト (Active Context)

_このドキュメントは、現在の作業焦点、最近の変更点、次のステップ、進行中の決定事項、重要なパターンや好み、そしてプロジェクトから得られた学びを記録します。`productContext.md`, `systemPatterns.md`, `techContext.md` に基づき、常に最新の状態を反映します。_

## 1. 現在の作業焦点 (Current Focus)

- **Deno 移行:** フェーズ5「UI レイヤーテスト移行」における `file-manager_test.ts` の問題解決。

## 2. 最近の主な変更点 (Recent Changes)

- **2025-04-05 (最新):**
  - **Deno 移行 (フェーズ5 問題発生中):**
    - **フェーズ4 (UIレイヤー依存関係移行) 完了:**
      - `src/ui/components/` および `src/browser/` 内ファイルのインポートパスに `.ts` 拡張子を追加。
      - `deno check` で型エラーがないことを確認。
    - **フェーズ5 (UIレイヤーテスト移行) 開始:**
      - UI関連テストファイル (`file-manager_test.ts`, `notification_test.ts`, `result-viewer_test.ts`) を `src/ui/components/` 配下に `_test.ts` として移動・リネーム。
      - `file-manager_test.ts` を Deno Test 構文に書き換え、`deno-dom` を導入。
      - **問題発生と対処:**
        - `notificationSystem` モック化で `document is not defined` エラー発生。
        - 対策として `NotificationSystem` を遅延初期化、`FileManager` に DI を導入。(`notification.ts`, `file-manager.ts`, `main.ts` を修正)
        - テスト内で `getNotificationSystem` を直接上書きしようとして `TypeError: Cannot assign to read only property` エラー発生。
        - DI を利用してモックを注入するようにテスト (`file-manager_test.ts`) を修正。
        - `spy` の型エラー (`Property 'calls' does not exist`) を `any` キャストで回避。
        - `deno-dom` の型エラー (`Type 'HTMLDocument' is missing...`) を `any` キャストで回避。
      - **現状:** `file-manager_test.ts` の `deno test` が `AssertionError` および `MockError: property is not an instance method` で失敗中。`spy` の使い方やリセット方法に問題がある可能性。
  - **Deno 移行 (フェーズ1-3 完了):**
    - **フェーズ1 (環境設定と基本ツール導入):**
      - `feature/deno-migration` ブランチ作成 (コミット `aa39270`)。
      - Deno (v2.2.7) 確認、`deno.jsonc`, `import_map.json` 作成。
      - `deno lint --fix`, `deno fmt` 実行。
      - `deno fmt` でプロジェクト全体のフォーマット適用。
      - `.gitignore` 更新、`.vscode/settings.json` 更新 (Deno連携)。
    - **フェーズ2 (コアロジック依存関係移行) (コミット `98c9dcb`):**
      - `src/core/` 配下のインポート/エクスポートパス修正 (`.ts` 拡張子)。
      - `src/core/adapters/node.ts` 削除。
      - `deno check` 成功。
    - **フェーズ3 (コアロジックテスト移行) (コミット `72992f1`):**
      - Jest テストを `src/core/` 配下に移動・リネーム (`_test.ts`)。
      - Deno Test 構文に書き換え。
      - `deno.jsonc` に `"deno.ns"` 追加。
      - `evaluator.ts` ロジック修正。
      - `deno test` 全件パス確認。
- **2025-04-05:**
  - **ファイル選択 UI 変更:** (Deno移行前に実施)
    - ステータスタグ削除、個別削除ボタン追加。
- **2025-04-05:** 症例識別ロジック修正 (複合キー導入)。(Deno移行前に実施)
- **2025-04-04:** `validator.ts` リファクタリング、Lint 警告一部修正。
- **2025-03-30:** ESLint v9 移行。
- **2025-03-30:** リファクタリング作業 (Jest 環境変更、UI テスト修正など)。
- **2025-03-29:** レガシーコード削除。
- **2025-03-29:** リファクタリング計画作成。
- **2025-03-29 (以前):** Memory Bank 初期化・更新。
- **2025-03-27:** 開発ツール設定最適化。
- **(日付不明):** クリップボード API 変更、統合テスト強化、Parcel 設定改善、バリデーション強化、UI/UX 改善。

## 3. 次のステップ (Next Steps)

1. **Deno 移行 (フェーズ5):** `file-manager_test.ts` のテスト失敗 (`AssertionError`, `MockError`) の原因調査と修正。
   - `spy` の使い方、特にリセット方法 (`spy.calls = []`) が適切か確認。
   - `deno-dom` 環境下でのアサーション (`assertEquals`) が期待通り動作しているか確認。
2. **Deno 移行 (フェーズ5):** `file-manager_test.ts` がパスしたら、残りのUIテスト (`notification_test.ts`, `result-viewer_test.ts`) の Deno Test への移行作業。
3. **Deno 移行 (フェーズ6以降):** 計画に基づき、統合テスト移行、ビルド/実行方法確立、クリーンアップ、ドキュメント更新を進める。

## 4. 進行中の決定事項と考慮事項 (Active Decisions & Considerations)

- **Deno 移行:**
  - **UIテスト戦略:** `deno-dom` と Deno Test の `testing/mock` を使用した UI テスト移行を継続。ただし、モック化やアサーションで予期せぬ問題が発生しており、解決策を模索中。ESモジュールの制約によるモックの難しさ、`deno-dom` の互換性問題、`spy` の型定義や挙動に関する問題などが考えられる。
  - (他項目は変更なし)
- (他項目は変更なし)

## 5. 重要なパターンと好み (Key Patterns & Preferences)

- (変更なし)

## 6. 学びと洞察 (Learnings & Insights)

- **Deno UI テストの課題:**
  - **DOMシミュレーション:** `deno-dom` は `jsdom` と完全互換ではなく、`Document` 型の不整合などが発生する場合がある。`globalThis.document` への設定とテスト後のクリーンアップが必要。
  - **モック:** ESモジュールの読み取り専用特性により、Jest のようにインポートした関数をテスト内で直接上書きするモック手法が使えない。依存性注入 (DI) パターンへのリファクタリングが有効な場合がある。
  - **`testing/mock`:** `spy` 関数の型定義が完全でない場合があり、`calls` プロパティへのアクセスに `any` キャストが必要になることがある。また、`spy` した関数のリセット方法 (`spy.calls = []`) が期待通りに動作しない可能性も考慮する必要がある (ドキュメント確認要)。
- (既存の学びは変更なし)
