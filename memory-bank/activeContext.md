# アクティブコンテキスト (Active Context)

_このドキュメントは、現在の作業焦点、最近の変更点、次のステップ、進行中の決定事項、重要なパターンや好み、そしてプロジェクトから得られた学びを記録します。`productContext.md`, `systemPatterns.md`, `techContext.md` に基づき、常に最新の状態を反映します。_

## 1. 現在の作業焦点 (Current Focus)

- **Deno 移行:** フェーズ8「クリーンアップとドキュメント更新」実行中。

## 2. 最近の主な変更点 (Recent Changes)

- **2025-04-06 (最新):**
  - **Deno 移行 (フェーズ7 完了):**
    - **ビルドツールを Parcel から esbuild に変更:** `deno bundle` が廃止されたため、代替として `esbuild` (`deno.land/x/esbuild`) を採用。
    - **Parcel 関連削除:** `package.json` から Parcel の依存関係とスクリプトを削除。
    - **esbuild 導入:** `import_map.json` に `esbuild` を追加。ビルドスクリプト `scripts/build.ts` を作成。
    - **`deno.jsonc` tasks 定義:** `check`, `lint`, `fmt`, `test`, `bundle` タスクを定義。`bundle` タスクで `scripts/build.ts` を実行するように設定。
    - **動作確認:** `deno task bundle` で `public/js/main.js` が正常に生成され、`index.html` が `file://` 環境で動作することを確認。
- **2025-04-06 (フェーズ8 進行中):**
  - **Node.js 関連ファイル削除:** `package.json`, `package-lock.json`, `eslint.config.js`, `.prettierrc.json`, `jest.config.js`, `tsconfig.json`, `tsconfig.test.json`, `test/jest/`, `node_modules/` を削除。
  - **Memory Bank 更新:** `techContext.md` を Deno 環境に合わせて全面更新。
- **2025-04-05:**
  - **Deno 移行 (フェーズ6 完了):**
    - **統合テストをDeno Test環境に移行:** すべての統合テストファイルをDeno用に書き換え、テストが正常に通ることを確認しました。
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

1. **Deno 移行 (フェーズ8):** クリーンアップとドキュメント更新を継続。
   - **[完了]** Node.js関連ファイルの削除。
   - **[進行中]** Memory Bank の更新 (`activeContext.md`, `progress.md`)。
   - **[未着手]** `README.md` の更新 (セットアップ手順、実行方法など)。
   - **[スキップ]** Git フック設定。

## 4. 進行中の決定事項と考慮事項 (Active Decisions & Considerations)

- **Deno 移行:**
  - **ビルド方法:** **esbuild (`deno.land/x/esbuild`) を使用したバンドルプロセスを確立済み。** `deno task bundle` で実行可能。
  - **タスク定義:** `deno.jsonc` の `tasks` で主要な開発コマンド (`check`, `lint`, `fmt`, `test`, `bundle`) を定義済み。
  - **権限フラグの管理:** `deno.jsonc` の `tasks` で必要な権限 (`--allow-read`, `--allow-write`) を設定済み。
  - **テスト環境の互換性:** `deno-dom` は `jsdom` と完全には互換性がなく、UIテストで確認された制約（DOMイベント処理、スタイル操作）が統合テストにも影響する可能性があります。
- (他項目は変更なし)

## 5. 重要なパターンと好み (Key Patterns & Preferences)

- (変更なし)

## 6. 学びと洞察 (Learnings & Insights)

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
