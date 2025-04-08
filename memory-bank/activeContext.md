# アクティブコンテキスト (Active Context)

_このドキュメントは、現在の作業焦点、最近の変更点、次のステップ、進行中の決定事項、重要なパターンや好み、そしてプロジェクトから得られた学びを記録します。`productContext.md`, `systemPatterns.md`, `techContext.md` に基づき、常に最新の状態を反映します。_

## 1. 現在の作業焦点 (Current Focus)

- **短手３判定ロジック修正完了:** データ区分とコードを用いた判定ロジック修正、テストコード修正、Memory Bank 更新。
- **パーサー堅牢性向上 Issue 作成:** GitHub Issue #2 を作成。

## 2. 最近の主な変更点 (Recent Changes)

- **2025-04-08 (最新):**
  - **短手３判定ロジック修正 (fix/tanshu3-over-exclusion ブランチ):**
    - `src/core/common/types.ts`: `ProcedureDetail` に `dataCategory` を追加。
    - `src/core/common/parsers.ts`: データ区分をパースして `ProcedureDetail` に格納するように修正。
    - `src/core/common/evaluator.ts`: 「他の手術」の判定基準を「データ区分 '50' かつコード '15' 始まり」に修正。
    - 関連テスト (`evaluator_test.ts`, `parsers_test.ts`, `data-flow_test.ts`, `module-integration_test.ts`) を修正し、全テストパスを確認。
    - コミット (`fix(evaluator): 正しいデータ区分とコードで他の手術を判定`)。
  - **パーサー堅牢性向上 Issue 作成:** GitHub Issue #2 を作成し、パーサーが仕様外の行を処理する問題を記録。
- **2025-04-06:**
  - **CI/CD 推進計画 (Issue #1) 完了:**
    - **CI ワークフロー実装:** `.github/workflows/ci.yml` を新規作成。`main` ブランチへの push/pull request 時に Lint/Format/Test/Build を実行。
    - **CD ワークフロー強化:**
      - `.github/release-drafter.yml` を新規作成し、Conventional Commits ベースのリリースノート生成ルールを定義。
      - `.github/workflows/release.yml` を修正し、`release-drafter` を統合。タグプッシュ時にリリースノート自動生成と成果物アップロードを実行。
    - **ドキュメント更新:** `README.md` に CI/CD プロセス、Conventional Commits について追記。
    - **Memory Bank 更新:** `systemPatterns.md`, `techContext.md`, `activeContext.md`, `progress.md` を更新。
    - **ブランチ:** `feature/issue-1-ci-cd` で作業し、コミット (`feat(ci): implement CI workflow and enhance CD with release drafter`)。
  - **リリース自動化実装 (旧):** (CI/CD 推進計画に統合・強化されたため、個別の項目としては完了扱い)
    - 単一HTML生成スクリプト `scripts/release.ts` を作成。
    - `deno.jsonc` に `release:build` タスクを追加。
    - `.gitignore` を更新し、ビルド成果物 (`public/js/main.js`, `.map`, `dist/`) を無視するように設定。Git追跡対象からも除外。
    - (旧) GitHub Actions ワークフロー (`.github/workflows/release.yml`) を作成し、タグプッシュ時に自動でビルドとリリースを行うように設定。
    - `docs/release_plan.md` を更新し、自動化手順を反映。
    - (旧) `README.md` を更新し、新しいスクリプト、タスク、ワークフローを反映。
    - `scripts/release.ts` の CSS 埋め込み正規表現を修正。
  - **Deno 移行 (フェーズ8 完了):**
    - **[完了]** Node.js関連ファイルの削除。
    - **[完了]** Memory Bank の更新 (`techContext.md`, `activeContext.md`, `progress.md`)。
    - **[完了]** `README.md` の更新 (セットアップ手順、実行方法など)。
- **2025-04-06 (以前):**
  - **Deno 移行 (フェーズ7 完了):**
    - **ビルドツールを Parcel から esbuild に変更:** `deno bundle` が廃止されたため、代替として `esbuild` (`deno.land/x/esbuild`) を採用。
    - **Parcel 関連削除:** `package.json` から Parcel の依存関係とスクリプトを削除。
    - **esbuild 導入:** `import_map.json` に `esbuild` を追加。ビルドスクリプト `scripts/build.ts` を作成。
    - **`deno.jsonc` tasks 定義:** `check`, `lint`, `fmt`, `test`, `bundle` タスクを定義。`bundle` タスクで `scripts/build.ts` を実行するように設定。
    - **動作確認:** `deno task bundle` で `public/js/main.js` が正常に生成され、`index.html` が `file://` 環境で動作することを確認。
- **2025-04-06 (フェーズ8 進行中):**
  - **Node.js 関連ファイル削除:** `package.json`, `package-lock.json`, `eslint.config.js`, `.prettierrc.json`, `jest.config.js`, `tsconfig.json`, `tsconfig.test.json`, `test/jest/`, `node_modules/` を削除。
  - **Memory Bank 更新:** `techContext.md` を Deno 環境に合わせて全面更新 (フェーズ8の一部として実施)。
- **2025-04-05:**
  - **Deno 移行 (フェーズ6 完了):**
    - **統合テストをDeno Test環境に移行:** すべての統合テストファイルをDeno用に書き換え、テストが正常に通ることを確認。
    - **`test/integration/`ディレクトリ作成:** 新しい統合テストディレクトリを作成し、そこにテストファイルを配置しました。
    - **テスト構文変換:** Jest構文からDenoのテスト構文に変換し、必要なインポート調整を行いました。
    - **ファイルAPI変換:** Node.jsのファイル操作(`fs`, `path`)をDenoの同等機能に置き換えました。
    - **テスト実行確認:** `deno test --allow-read test/integration/`を実行し、全14件のテストが正常に動作することを確認しました。
  - **Deno 移行 (フェーズ5 完了):**
    - **`file-manager_test.ts` 移行完了:** Deno Test構文への書き換えとdeno-dom環境での実行を成功させました。
    - **`notification_test.ts` 移行完了:** DOM操作とタイマー処理の問題に対応し、テストが正常に通るように修正しました。
    - **`result-viewer_test.ts` 移行完了:** クリップボード操作、URL生成などの外部APIに依存するテストをモック化し、テスト用サブクラスを使用してプライベートメソッドをテストできるようにしました。
    - **問題解決:**
      - タイマーリーク検出の問題を、モンキーパッチを使用してタイマー処理を回避する方法で解決。
      - DOM要素の`style.opacity`などのスタイル操作が`deno-dom`環境で動作しない問題に対応。
      - `deno test --allow-read src/ui/components/` を実行し、全テスト（20件）が正常に動作することを確認。
  - **フェーズ4 (UIレイヤー依存関係移行) 完了:**
    - `src/ui/components/` および `src/browser/` 内ファイルのインポートパスに `.ts` 拡張子を追加。
    - `deno check` で型エラーがないことを確認。
  - **フェーズ3 (コアロジックテスト移行) 完了:**
    - Jest テストを `src/core/` 配下に移動・リネーム (`_test.ts`)。
    - Deno Test 構文に書き換え。
    - `deno.jsonc` に `"deno.ns"` 追加。
    - `evaluator.ts` ロジック修正。
    - `deno test` 全件パス確認。
  - **フェーズ2 (コアロジック依存関係移行) 完了:**
    - `src/core/` 配下のインポート/エクスポートパス修正 (`.ts` 拡張子)。
    - `src/core/adapters/node.ts` 削除。
    - `deno check` 成功。
  - **フェーズ1 (環境設定と基本ツール導入) 完了:**
    - `feature/deno-migration` ブランチ作成。
    - Deno (v2.2.7) 確認、`deno.jsonc`, `import_map.json` 作成。
    - `deno lint --fix`, `deno fmt` 実行。
    - `.gitignore` 更新、`.vscode/settings.json` 更新 (Deno連携)。
- **2025-04-05:**
  - **ファイル選択 UI 変更:** ステータスタグ削除、個別削除ボタン追加。
- **2025-04-05:** 症例識別ロジック修正 (複合キー導入)。
- **2025-04-04:** `validator.ts` リファクタリング、Lint 警告一部修正。
- **2025-03-30:** ESLint v9 移行。
- **2025-03-30:** リファクタリング作業 (Jest 環境変更、UI テスト修正など)。
- **2025-03-29:** レガシーコード削除。
- **2025-03-29:** リファクタリング計画作成。
- **2025-03-29 (以前):** Memory Bank 初期化・更新。
- **2025-03-27:** 開発ツール設定最適化。
- **(日付不明):** クリップボード API 変更、統合テスト強化、Parcel 設定改善、バリデーション強化、UI/UX 改善。

## 3. 次のステップ (Next Steps)

1. **CI/CD ワークフローテスト:**
   - **CI:** `feature/issue-1-ci-cd` ブランチから `main` ブランチへの Pull Request を作成し、`ci.yml` ワークフローがトリガーされ、すべてのチェックが成功することを確認する。
   - **CD:** `v*.*.*` 形式のタグをプッシュし、`release.yml` ワークフローがトリガーされ、リリースノートが自動生成された GitHub Release が作成・公開され、`tanshu3.html` がアップロードされることを確認する。
2. **残存タスク対応:**
   - **[保留]** Lint 警告修正 (`@typescript-eslint/explicit-function-return-type` 残り3箇所)。
   - **[保留]** テストの充実 (UI レイヤーなど)。
   - **[保留]** エラーハンドリング強化。
   - **[保留]** コードコメント修正・強化。
   - **[完了] 短手３判定ロジック修正:** 上記「最近の主な変更点」参照。
   - **[新規] パーサー堅牢性向上 (Issue #2):** 仕様外の行（例: 'NOT_EF' 始まり）を早期に検出・除外する改善。
   - **[保留]** Lint 警告修正 (`@typescript-eslint/explicit-function-return-type` 残り3箇所)。
   - **[保留]** テストの充実 (UI レイヤー、パーサー堅牢性テストなど)。
   - **[保留]** エラーハンドリング強化。
   - **[保留]** コードコメント修正・強化。
   - **[保留]** UI/UX の継続的改善。
   - **[保留]** パフォーマンス最適化。
   - **[保留]** 結果ダウンロード機能の Deno 環境での動作確認。

## 4. 進行中の決定事項と考慮事項 (Active Decisions & Considerations)

- **CI/CD パイプライン:** GitHub Actions を利用。
  - **CI:** `main` ブランチへの push/pull request をトリガーに、Lint/Format/Test/Build を実行 (`ci.yml`)。
  - **CD:** タグプッシュをトリガーに、リリースノート自動生成 (`release-drafter`) とビルド成果物のリリース (`release.yml`)。
- **コミット規約:** Conventional Commits を採用。リリースノート自動生成に利用。
- **リリースプロセス:** タグプッシュによる自動化。`release-drafter` がリリースノートを作成し、`release.yml` がビルドと公開を行う。
- **Deno 移行:** 完了。
- **ビルド方法:** esbuild (`deno.land/x/esbuild`) を使用したバンドルプロセス (`deno task bundle`) と単一HTML生成 (`deno task release:build`) を維持。
  - **タスク定義:** `deno.jsonc` の `tasks` で主要な開発コマンド (`check`, `lint`, `fmt`, `test`, `bundle`) を定義済み。
  - **権限フラグの管理:** `deno.jsonc` の `tasks` で必要な権限 (`--allow-read`, `--allow-write`) を設定済み。
  - **テスト環境の互換性:** `deno-dom` は `jsdom` と完全には互換性がなく、UIテストで確認された制約（DOMイベント処理、スタイル操作）が統合テストにも影響する可能性があります。
- (他項目は変更なし)

## 5. 重要なパターンと好み (Key Patterns & Preferences)

- (変更なし)

## 6. 学びと洞察 (Learnings & Insights)

- **短手３判定ロジックのデバッグ:**
  - 当初の「他の手術」判定ロジック (`startsWith('15')` のみ) では、麻酔 (`150279010`) など第10部手術でないものも対象外手術と誤判定していた。
  - データ区分 (`50`) を利用することで、より正確に手術手技料を特定できることが判明。
  - 最終的に「データ区分 `50` かつコード `15` 始まり」を「他の手術手技料」と判定するロジックに修正した。
- **テスト駆動開発の重要性:**
  - テストコード (`evaluator_test.ts` など) の修正を通じて、`ProcedureDetail` 型への `dataCategory` 追加漏れを発見できた。
  - 統合テスト (`module-integration_test.ts`) の失敗から、パーサーの堅牢性に関する潜在的な問題を特定できた。
- **Deno 統合テストの課題と解決策:**
  - **ファイル操作の違い:** Node.jsの`fs`モジュール（同期API）とDenoのファイル操作（非同期API）には大きな違いがあります：
    - `fs.readFileSync(path, 'utf-8')`は`await Deno.readTextFile(path)`に置き換える必要があります
    - テスト関数を`async`にして非同期操作に対応する必要があります
  - **パス解決の違い:** Node.jsの`__dirname`や`fileURLToPath`といった方法はDenoでは異なります：
    - Denoでは`import.meta.url`と`fromFileUrl`を組み合わせてパスを解決します
    - 相対パスの扱いが異なるため、`join`関数を使った適切なパス構築が重要です
  - **セキュリティモデル:** Denoでは明示的な権限フラグが必要です：
    - ファイル読み取りには`--allow-read`フラグが必要
    - ネットワークアクセスやクリップボード操作など、他の操作にも適切な権限フラグが必要
  - **グローバル関数の違い:** Jestでは`describe`や`expect`などがグローバルで利用可能ですが、Denoでは明示的なインポートが必要です：
    - `import { assertEquals, assertNotEquals, assert } from "std/testing/asserts.ts"`
    - テスト構造も`describe`/`test`から`Deno.test`に変更する必要があります
- **Deno UI テストの課題と解決策:**
  - **DOMシミュレーション:** `deno-dom` は `jsdom` と完全互換ではありません。特に以下の点に注意が必要です：
    - `element.click()`メソッドが実装されていないため、代わりにイベントを直接ディスパッチする必要があります。
    - `style`プロパティの扱いに制限があり、`style.opacity`などのプロパティにアクセスできない場合があります。要素の属性を直接操作する代替手段（`setAttribute('style', '...')`など）が有効です。
    - `Document` 型の不整合が発生するため、`any`キャストを使用する場合があります。
  - **モック手法:** ESモジュールの読み取り専用特性により、Jest のようにインポートした関数を直接上書きするモック手法が使えません。有効な対策として：
    - 依存性注入 (DI) パターンを採用する
    - モンキーパッチングでメソッドを置き換える
    - テスト用サブクラスを作成し、内部メソッドにアクセスする
  - **タイマー処理:** 非同期処理（特に`setTimeout`）に依存するテストでは、タイマーリーク検出問題が発生します。これに対応するため：
    - タイマー処理をスキップし、直接コールバックを実行する
    - テスト終了前に適切なクリーンアップを行う
    - モンキーパッチでタイマーメソッドを置き換える
  - **`testing/mock`の制約:** Denoの`spy`関数は、Jestと異なり、`calls`プロパティが読み取り専用で、`.calls = []`でリセットできません。型エラーを回避するためには`any`キャストが必要な場合があります。
  - **テスト用サブクラス:** プライベートメソッドのテストが必要な場合は、テスト用のサブクラスを作成し、プライベートメソッドを公開するアプローチが効果的です。これにより、実装の詳細にアクセスしながらも、本番コードを変更せずにテストを行うことができます。
- (既存の学びは変更なし)
