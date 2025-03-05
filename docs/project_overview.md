# Project Overview

## 前提条件

* 入院EF統合ファイルについては、`入院EF統合ファイルについて.md`を参照すること。
* 短期滞在手術等基本料３（以下、「短手３」という。）については、`短期滞在手術等基本料３について.md`を参照すること。

## プログラムの狙い

* このプログラムは、入院EF統合ファイルを読み込み、それぞれの症例が短手３に該当するかどうかを判別する。

## プログラム構成

* プログラムは以下のファイルで構成される：
  * `public/index.html` - ユーザーインターフェース
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
  * `test/unit/*.ts` - 単体テスト
  * `test/integration/*.ts` - 統合テスト

### ドキュメント
* `docs/project_overview.md` - プロジェクト概要と仕様書（本ドキュメント）
* `docs/入院EF統合ファイルについて.md` - 入院EF統合ファイルの仕様説明
* `docs/短期滞在手術等基本料３について.md` - 短期滞在手術等基本料３の説明
* `docs/refactoring_plan.md` - リファクタリング計画書

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
  browser/            - ブラウザ環境用のレガシーコード
    common.browser.ts - ブラウザ環境用の共通ロジック
    main.ts           - ブラウザ環境でのUI処理
  ui/                 - ユーザーインターフェース
    components/       - UI処理を小さなコンポーネントに分割
  types/              - レガシーの型定義ファイル
test/
  fixtures/           - テストデータと期待値
  unit/               - ユニットテスト
  integration/        - 統合テスト
public/               - 静的ファイル
  index.html          - メインHTMLファイル
docs/                 - ドキュメント
  project_overview.md - プロジェクト概要と仕様書
  入院EF統合ファイルについて.md - 入院EF統合ファイルの仕様説明
  短期滞在手術等基本料３について.md - 短期滞在手術等基本料３の説明
  refactoring_plan.md - リファクタリング計画書
```

### その他
* `package.json` - プロジェクト設定とスクリプト
* `tsconfig.json` - TypeScriptコンパイラ設定
* `tanshu3.code-workspace` - VSCode ワークスペース設定

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

* レガシーコード（リファクタリング中）：
  * `src/browser/common.browser.ts` - ブラウザ環境用の共通ロジック
  * `src/browser/main.ts` - ブラウザ環境でのUI処理
  * `src/types/types.d.ts` - レガシーの型定義

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
* "実行"ボタンを押すと、EF対象症例を判定する処理を行う。
* 結果は、`出力データ`に従い対象症例を出力する。

## 入力データ

* 1つ以上の入院統合EFファイル。
* 複数入力可（連続した複数月のファイルが入力される可能性がある）。
* プログラム上のファイルピッカーで選択できる。

## 出力データ

* 次のフォーマットで短手３該当症例を出力する。
* フォーマットはタブ区切りテキストファイルである。
* 1行目はタイトル行で、2行目以降にデータを出力する。
* 出力順は`データ識別番号`の昇順とする。

~~~
データ識別番号	入院年月日	退院年月日
~~~

## テストデータと実行方法

* テストデータは`test/fixtures`ディレクトリに格納されている入院EF統合ファイルです。
* 仕様通り処理を行った場合の期待される結果は`test/fixtures/expect.txt`です。
* テストの実行方法：
  * コマンドラインで``npm run test``を実行（`npm run build`でコンパイル後）
  * 正常に動作する場合は「テスト成功: 出力結果が期待される結果と一致しました。」と表示される

## 開発とメンテナンス

* ビジネスロジックの変更が必要な場合は`src/core/common/`ディレクトリ内の対応するファイルを修正する
* UI関連の変更が必要な場合は`public/index.html`と`src/ui/components/`を修正する
* テスト関連の変更が必要な場合は`test/unit/`または`test/integration/`を修正する
* 型定義の変更が必要な場合は`src/core/common/types.ts`を修正する
* 新しい機能を追加する場合は、適切なファイルに実装し、必要に応じてテストを追加する
* コード変更後は`npm run build`でTypeScriptをコンパイルする

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
* **ビルド設定**:
    * TypeScriptコンパイラ（tsc）を使用
    * 出力先は`dist`ディレクトリ
    * ソースマップを生成して、デバッグを容易に
* **テスト**:
    * Node.js環境でESモジュールとして実行
    * `npm run test`コマンドで自動テストを実行
* **ブラウザ互換性**:
    * ローカルファイル（file://プロトコル）でのCORSポリシーに対応するためのアダプター実装
    * アダプターパターンを使用して環境依存のコードを分離
