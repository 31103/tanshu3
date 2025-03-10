# Project Overview

## 前提条件

* 入院EF統合ファイルについては、`入院EF統合ファイルについて.md`を参照すること。
* 短期滞在手術等基本料３（以下、「短手３」という。）については、`短期滞在手術等基本料３について.md`を参照すること。

## プログラムの狙い

* このプログラムは、入院EF統合ファイルを読み込み、それぞれの症例が短手３に該当するかどうかを判別する。

## プログラム構成

* プログラムは以下のファイルで構成される：
  * `public/index.html` - ユーザーインターフェース
  * `public/css/styles.css` - スタイルシート
  * `public/js/main.js` - クライアントサイドのUIロジック
  * `src/core/common/*.ts` - 共通のビジネスロジック（データ解析、判定処理など）
    * `types.ts` - 型定義
    * `constants.ts` - 定数
    * `utils.ts` - ユーティリティ関数
    * `parsers.ts` - ファイル解析関連の機能
    * `evaluator.ts` - 評価ロジック関連の機能
  * `src/core/adapters/*.ts` - 環境依存のアダプター実装
    * `browser.ts` - ブラウザ環境用アダプター
    * `node.ts` - Node.js環境用アダプター
  * `src/core/index.ts` - コアモジュールのエントリーポイント
  * `src/ui/components/` - UI処理を小さなコンポーネントに分割
  * `src/browser/main.ts` - ブラウザ環境での実行に関する処理（レガシーコード）
  * `src/browser/common.browser.ts` - ブラウザ環境用の共通ロジック（レガシーコード）
  * `test/unit/*.ts` - 旧式の単体テスト
  * `test/integration/*.ts` - 旧式の統合テスト
  * `test/jest/unit/*.ts` - Jestを使用した単体テスト
    * `parsers.test.ts` - ファイル解析関連の機能テスト
    * `utils.test.ts` - ユーティリティ関数のテスト
    * `evaluator.test.ts` - 評価ロジック関連の機能テスト
    * `constants.test.ts` - 定数の検証テスト
    * `sample.test.ts` - サンプルテスト
  * `test/jest/integration/*.ts` - Jestを使用した統合テスト
    * `data-flow.test.ts` - 複数月データのフローテスト
    * `module-integration.test.ts` - モジュール間の連携テスト
  * `test/jest/e2e/*.ts` - Jestを使用したE2Eテスト

### ドキュメント
* `docs/project_overview.md` - プロジェクト概要と仕様書（本ドキュメント）
* `docs/入院EF統合ファイルについて.md` - 入院EF統合ファイルの仕様説明
* `docs/短期滞在手術等基本料３について.md` - 短期滞在手術等基本料３の説明
* `docs/test_enhancement_plan.md` - テスト強化計画書
* `docs/test_migration_guide.md` - テスト移行ガイド
* `docs/ui_ux_enhancement_plan.md` - UI/UX機能強化計画書
* `docs/output_format_enhancement_plan.md` - 出力フォーマット拡張機能計画書

### プロジェクトの構造
```
src/
  core/               - コアビジネスロジック
    common/           - 共通のビジネスロジック
      types.ts        - 型定義
      constants.ts    - 定数
      utils.ts        - ユーティリティ関数
      parsers.ts      - ファイル解析関連の機能
      evaluator.ts    - 評価ロジック関連の機能
    adapters/         - 環境依存のアダプター実装
      browser.ts      - ブラウザ環境用アダプター
      node.ts         - Node.js環境用アダプター
    index.ts          - コアモジュールのエントリーポイント
    common.ts         - レガシーコード
  browser/            - ブラウザ環境用のレガシーコード
    common.browser.ts - ブラウザ環境用の共通ロジック
    main.ts           - ブラウザ環境でのUI処理
  ui/                 - ユーザーインターフェース
    components/       - UI処理を小さなコンポーネントに分割
  types/              - レガシーの型定義ファイル
test/
  fixtures/           - テストデータと期待値
  unit/               - 旧式のユニットテスト
  integration/        - 旧式の統合テスト
  jest/               - Jestテストフレームワークを使用したテスト
    unit/             - Jestユニットテスト
      parsers.test.ts - ファイル解析テスト
      utils.test.ts   - ユーティリティ関数テスト
      evaluator.test.ts - 評価ロジックテスト
      constants.test.ts - 定数検証テスト
      sample.test.ts  - サンプルテスト
    integration/      - Jest統合テスト
      data-flow.test.ts - 複数月データのフローテスト
      module-integration.test.ts - モジュール間の連携テスト
    e2e/              - JestのE2Eテスト
public/               - 静的ファイル
  index.html          - メインHTMLファイル
  css/                - スタイルシート
    styles.css        - メインのスタイルシート
  js/                 - クライアントサイドJavaScript
    main.js           - クライアントサイドのUIロジック
docs/                 - ドキュメント
  project_overview.md - プロジェクト概要と仕様書
  入院EF統合ファイルについて.md - 入院EF統合ファイルの仕様説明
  短期滞在手術等基本料３について.md - 短期滞在手術等基本料３の説明
  test_enhancement_plan.md - テスト強化計画書
  test_migration_guide.md - テスト移行ガイド
  ui_ux_enhancement_plan.md - UI/UX機能強化計画書
  output_format_enhancement_plan.md - 出力フォーマット拡張機能計画書
```

### その他
* `package.json` - プロジェクト設定とスクリプト
* `tsconfig.json` - TypeScriptコンパイラ設定
* `jest.config.js` - Jestテストフレームワーク設定
* `tanshu3.code-workspace` - VSCode ワークスペース設定
* `.eslintrc.json` - ESLint設定
* `.prettierrc.json` - Prettier設定
* `.gitignore` - git除外ファイル設定
* `.husky/` - Git hooksの設定（コミット前のリントやフォーマットチェック）
* `.github/` - GitHub関連の設定（ワークフローなど）

### 各ファイルの役割：
* コアモジュール：
  * `src/core/common/types.ts` - 型定義
  * `src/core/common/constants.ts` - 定数（targetProcedures など）
  * `src/core/common/utils.ts` - ユーティリティ関数
  * `src/core/common/parsers.ts` - ファイル解析関連の機能
  * `src/core/common/evaluator.ts` - 評価ロジック関連の機能
  * `src/core/adapters/browser.ts` - ブラウザ環境固有の実装
  * `src/core/adapters/node.ts` - Node.js 環境固有の実装
  * `src/core/index.ts` - コアモジュールのエントリーポイント
  * `src/core/common.ts` - レガシーコード

* レガシーコード（リファクタリング中）：
  * `src/browser/common.browser.ts` - ブラウザ環境用の共通ロジック
  * `src/browser/main.ts` - ブラウザ環境でのUI処理
  * `src/types/types.d.ts` - レガシーの型定義

* テスト関連：
  * `test/jest/unit/*.test.ts` - 各モジュールのユニットテスト
    * `parsers.test.ts` - ファイル解析機能のテスト（カバレッジ: 91.37%）
    * `utils.test.ts` - ユーティリティ関数のテスト（カバレッジ: 87.5%）
    * `evaluator.test.ts` - 評価ロジックのテスト（カバレッジ: 93.1%）
    * `constants.test.ts` - 定数の検証テスト（カバレッジ: 100%）
    * `sample.test.ts` - サンプルテスト
  * `test/jest/integration/*.test.ts` - モジュール間の連携テスト
    * `data-flow.test.ts` - 複数月データのフローテスト
    * `module-integration.test.ts` - モジュール間の連携テスト
  * `test/jest/e2e/*.test.ts` - ブラウザ環境でのE2Eテスト
  * `jest.config.js` - Jestの設定（モジュール解決、カバレッジなど）

* ビルド後のファイル：
  * `dist/core/common.js` - コンパイル後の共通ロジック（Node.js環境用）
  * `dist/browser/common.browser.js` - コンパイル後の共通ロジック（ブラウザ環境用）
  * `dist/browser/main.js` - コンパイル後のUI処理
  * `dist/test.js` - コンパイル後のテストスクリプト

## 開発フロー

1. TypeScriptファイル（`.ts`）を編集
2. `npm run build` コマンドでJavaScriptにコンパイル
3. ブラウザで `index.html` を開いて動作確認

### 環境別の実装について

* **Node.js環境（テスト実行時）**: ESモジュールを使用し、`src/core/adapters/node.ts`から関数をインポート
* **ブラウザ環境（ユーザー実行時）**: ローカルファイル（file://プロトコル）でのCORSポリシーに対応するため、`src/core/adapters/browser.ts`を使用

## 仕様

* プログラムは`HTML`ファイルと`TypeScript`で構成される。
* TypeScriptファイルはコンパイルされて`JavaScript`ファイルとして実行される。
* Windows PCのローカルに保存され、`HTML`ファイルをブラウザで開いて実行される。
* EFファイルを入力できる。仕様は`入力データ`を参照のこと。
* ファイル選択時に入院統合EFファイルのフォーマット検証が行われ、問題がある場合はユーザーに通知する。
* "実行"ボタンを押すと、EF対象症例を判定する処理を行う。
* 結果は、`出力データ`に従い対象症例を出力する。

## 入力データ

* 1つ以上の入院統合EFファイル。
* 複数入力可（連続した複数月のファイルが入力される可能性がある）。
* プログラム上のファイルピッカーで選択できる。
* ファイルをドラッグ＆ドロップでも入力可能。

## 出力データ

* 次のフォーマットで短手３該当症例を出力する。
* フォーマットはタブ区切りテキストファイルである。
* 1行目はタイトル行で、2行目以降にデータを出力する。
* 出力順は`データ識別番号`の昇順とする。
* 出力結果はテキストエリアに表示され、クリップボードにコピー可能。
* 出力設定により、短手３対象症例のみを出力するか、全症例を出力するかを選択できる。
* 出力設定により、日付フォーマットを「YYYYMMDD」または「YYYY/MM/DD」から選択できる。

~~~
データ識別番号	入院年月日	退院年月日	短手３対象症例	理由
~~~

* `短手３対象症例` 列には、短手３対象症例であれば "Yes"、そうでなければ "No" を出力する。
* `理由` 列には、短手３対象症例であれば実施された対象手術の名称を、非対象症例であれば非該当理由を出力する。

## テストデータと実行方法

* テストデータは`test/fixtures`ディレクトリに格納されている入院EF統合ファイルです。
* 仕様通り処理を行った場合の期待される結果は`test/fixtures/expect.txt`です。
* テストの実行方法：
  * 新しいJestテストの実行: `npm test`
  * 監視モードでのテスト実行: `npm run test:watch`
  * カバレッジレポート付きのテスト実行: `npm run test:coverage`
  * 旧式のテスト実行: `npm run test:legacy`

## テスト状況

* コアモジュールに対する単体テストを実装済み（単体テストカバレッジ: 93.01%）
  * constants.ts: 100%
  * evaluator.ts: 93.1%
  * parsers.ts: 91.37%（validateEFFile関数を追加、カバレッジの更新が必要）
  * utils.ts: 87.5%
* 統合テストを実装済み（全73テストケース実装済み）
  * `data-flow.test.ts`: 複数月データのフローテスト（3テストケース）
  * `module-integration.test.ts`: モジュール間の連携テスト（4テストケース）
* E2Eテストの実装準備完了
* 今後の課題: 入院EF統合ファイルのバリデーション機能に対するテストケースの追加
* 詳細な実装状況と計画は`docs/test_enhancement_plan.md`を参照

## 開発とメンテナンス

* ビジネスロジックの変更が必要な場合は`src/core/common/`ディレクトリ内の対応するファイルを修正する
* UI関連の変更が必要な場合は`public/index.html`と`src/ui/components/`を修正する
* テスト関連の変更が必要な場合は`test/jest/unit/`または`test/jest/integration/`のJestテストを修正する
* 型定義の変更が必要な場合は`src/core/common/types.ts`を修正する
* 新しい機能を追加する場合は、適切なファイルに実装し、必要に応じてテストを追加する
* コード変更後は`npm run build`でTypeScriptをコンパイルする

### 最近の変更点

* 入院統合EFファイルのバリデーション機能を追加
  * ファイル選択時に自動的にフォーマット検証を実行
  * 施設コード、データ識別番号、入院/退院年月日、データ区分などのフォーマットを検証
  * エラーや警告がある場合はユーザーに適切なフィードバックを表示
  * `validateEFFile`関数をparsers.tsに実装し、ブラウザ環境での実行にも対応
* UI/UX機能強化
  * ファイル選択機能の改善
  * ドラッグ＆ドロップによるファイル入力サポート
  * 「クリア」ボタンの追加
  * 結果表示用テキストエリアの実装
  * クリップボードへのコピー機能の追加
* 内視鏡的大腸ポリープ・粘膜切除術の診療行為コードを修正
  * 長径2センチメートル未満: `COLONOSCOPY_PROCEDURE_CODE_SMALL = "150285010"`
  * 長径2センチメートル以上: `COLONOSCOPY_PROCEDURE_CODE_LARGE = "150183410"`
  * 両方のコードをまとめた配列: `COLONOSCOPY_PROCEDURE_CODES`
* 評価ロジック（evaluator.ts）を更新し、新しいコード定義を使用するように変更
* テストコード（evaluator.test.ts）も同様に更新
* Lint設定の強化（ESLint、Prettier）
* Git hooks（Husky）の導入による自動コード品質チェック
* すべてのテストが正常に実行されることを確認
* 出力フォーマットの拡張
  * 出力データに「短手３対象症例」と「理由」の列を追加
  * 出力設定機能の追加（短手３対象症例のみ/全症例）
  * 非対象症例の理由表示機能の追加
* 日付フォーマット選択機能の追加
  * 出力設定に日付フォーマット選択オプションを追加
  * 「YYYYMMDD」形式と「YYYY/MM/DD」形式の切り替えが可能
  * formatDate関数を実装し、日付文字列を指定されたフォーマットに変換
  * 日付フォーマット機能のテストを追加

## 注意点

* `入院EF統合ファイル`の`退院年月日`が`00000000`である場合
    * その症例の患者はその`入院EF統合ファイル`の対象となる月中に退院しなかったことを意味します。
    * つまり、その症例が`短手３該当症例`であるかどうかは未確定です。
    * ただし、それ以降の別ファイルで、退院日が確定することがあります。その場合はファイルを跨いでいても正しく判定してください。

## 技術的な詳細

* **モジュールシステム**:
    * Node.js環境: ESモジュールを採用（package.jsonに`"type": "module"`を設定）
    * ブラウザ環境: ブラウザ用のアダプターを使用してグローバル変数として関数を公開
* **型定義**:
    * `src/core/common/types.ts`で集中管理
    * 関数の引数と戻り値に型アノテーションを追加
    * `any`型の使用を最小限に抑え、具体的な型を使用
* **入力検証**:
    * ファイル選択時に自動的にバリデーションを実行
    * 施設コード、データ識別番号、入院/退院年月日、データ区分などの形式を検証
    * エラーと警告を区別して、重大な問題と軽微な問題を分離
    * 同一タイプの警告を集約し、多数のエラーメッセージによるUI過負荷を防止
* **ビルド設定**:
    * TypeScriptコンパイラ（tsc）を使用
    * 出力先は`dist`ディレクトリ
    * ソースマップを生成して、デバッグを容易に
* **テスト**:
    * Jest テストフレームワークを採用
    * TypeScript対応のts-jestプリプロセッサを使用
    * ユニットテスト、統合テスト、E2Eテストの3層構造
    * コードカバレッジの計測と可視化
    * Node.js環境でESモジュールとして実行
* **ブラウザ互換性**:
    * ローカルファイル（file://プロトコル）でのCORSポリシーに対応するためのアダプター実装
    * アダプターパターンを使用して環境依存のコードを分離
* **コード品質管理**:
    * ESLintによる静的コード解析
    * Prettierによるコードフォーマット統一
    * Huskyを使用したコミット前のコード品質チェック
    * GitHub Flowに基づいたブランチ戦略
