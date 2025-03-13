# 短手３判定ツール プロジェクト概要書

## 1. はじめに

### 1.1 プロジェクトの目的

このプログラムは、入院EF統合ファイルを解析し、短期滞在手術等基本料３（以下、「短手３」という。）に該当する症例を特定するためのツールです。
医療機関において短手３の対象症例を効率的に抽出し、適切な診療報酬請求を支援することを目的としています。

### 1.2 前提条件

* 入院EF統合ファイルの詳細仕様については、`docs/入院EF統合ファイルについて.md`を参照してください。
* 短期滞在手術等基本料３の定義と対象手術については、`docs/短期滞在手術等基本料３について.md`を参照してください。

### 1.3 動作環境

* ローカルのWindows PCでの実行を想定しています。
* Webブラウザ（Chrome、Edge等）でHTMLファイルを直接開いて使用します。
* サーバーへのデプロイやデータベース接続は不要です。
* データはローカルマシン内でのみ処理され、外部には保存されません。

## 2. 機能概要

### 2.1 基本機能

* 入院EF統合ファイルの読み込み（複数ファイル対応）
* ファイル形式の自動検証
* 短手３該当症例の判定処理
* 結果の表示とテキスト出力
* クリップボードへのコピー機能

### 2.2 対応ファイル形式

* 入院EF統合ファイル（テキスト形式）
* 複数月のファイルを一度に処理可能
* ファイル命名規則: `EFn_施設コード_YYMM.txt` 形式を推奨

### 2.3 出力形式

* タブ区切りテキスト形式
* 出力項目: データ識別番号、入院年月日、退院年月日、短手３対象症例、理由
* 日付形式は「YYYYMMDD」または「YYYY/MM/DD」から選択可能
* 全症例または対象症例のみの出力を選択可能

## 3. プロジェクト構造

### 3.1 ディレクトリ構造

```
.
├── jest.config.js           - Jestの設定ファイル
├── package.json            - プロジェクト設定とパッケージ依存関係
├── tsconfig.json          - TypeScript設定ファイル
├── src/
│   ├── browser/           - ブラウザ環境用のコード
│   │   ├── common.browser.ts
│   │   └── main.ts
│   ├── core/             - コアビジネスロジック
│   │   ├── common/       - 共通のビジネスロジック
│   │   │   ├── constants.ts
│   │   │   ├── evaluator.ts
│   │   │   ├── parsers.ts
│   │   │   ├── types.ts
│   │   │   └── utils.ts
│   │   ├── adapters/     - 環境依存のアダプター実装
│   │   │   ├── browser.ts
│   │   │   └── node.ts
│   │   ├── common.ts
│   │   ├── file-processor.ts
│   │   ├── index.ts
│   │   └── validator.ts
│   ├── types/            - 型定義ファイル
│   │   └── types.d.ts
│   └── ui/              - ユーザーインターフェース
│       ├── components/   - UI処理コンポーネント
│       │   ├── file-manager.ts
│       │   ├── notification.ts
│       │   ├── result-viewer.ts
│       │   └── step-manager.ts
│       ├── styles/
│       │   └── optimization.css
│       ├── asset-optimizer.js
│       ├── optimization.js
│       └── performance-monitor.js
├── public/              - 静的ファイル
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── bundle.js     - バンドルされたアプリケーションコード
│   │   └── main.js       - レガシーコード（非推奨）
│   └── index.html
├── test/               - テストファイル
│   ├── accessibility/  - アクセシビリティテスト
│   │   └── accessibility-test.js
│   ├── browser-compatibility/
│   │   ├── automated-browser-test.js
│   │   └── browser-test.js
│   ├── fixtures/      - テストデータ
│   │   ├── sampleEF/
│   │   │   ├── sample_EFn_XXXXXXXXX_2407.txt
│   │   │   └── sample_EFn_XXXXXXXXX_2408.txt
│   │   └── expect.txt
│   ├── jest/         - Jestテストスイート
│   │   ├── e2e/
│   │   ├── integration/
│   │   │   ├── data-flow.test.ts
│   │   │   └── module-integration.test.ts
│   │   └── unit/
│   │       ├── constants.test.ts
│   │       ├── evaluator.test.ts
│   │       ├── parsers.test.ts
│   │       ├── sample.test.ts
│   │       └── utils.test.ts
│   ├── unit/
│   │   └── test.ts
│   └── run-tests.js
└── docs/              - ドキュメント
    ├── project_overview.md
    ├── 入院EF統合ファイルについて.md
    └── 短期滞在手術等基本料３について.md
```

### 3.2 主要ファイルの役割

#### 3.2.1 コアモジュール

* `src/core/common/types.ts` - プログラム全体で使用される型定義
* `src/core/common/constants.ts` - 定数定義（診療行為コード、手術名など）
* `src/core/common/utils.ts` - ユーティリティ関数集
* `src/core/common/parsers.ts` - ファイル解析機能
* `src/core/common/evaluator.ts` - 短手３対象判定ロジック
* `src/core/adapters/browser.ts` - ブラウザ環境用アダプター
* `src/core/adapters/node.ts` - Node.js環境用アダプター
* `src/core/index.ts` - コアモジュールのエントリーポイント
* `src/core/file-processor.ts` - ファイル処理ロジック
* `src/core/validator.ts` - 入力データ検証機能

#### 3.2.2 UIコンポーネント

* `src/ui/components/file-manager.ts` - ファイル選択・管理機能
* `src/ui/components/notification.ts` - ユーザー通知機能
* `src/ui/components/result-viewer.ts` - 結果表示機能
* `src/ui/components/step-manager.ts` - 処理ステップ管理

#### 3.2.3 静的ファイル

* `public/index.html` - メインユーザーインターフェース
* `public/css/styles.css` - スタイル定義
* `public/js/main.js` - バンドルされたアプリケーションコード（Parcelによる生成）

## 4. 実装詳細

### 4.1 データフロー

1. ユーザーが入院EF統合ファイルを選択（複数可）
2. ファイルの検証と解析
3. 短手３対象症例の判定処理
4. 結果の表示と出力

### 4.2 内視鏡的大腸ポリープ・粘膜切除術の診療行為コード

* 長径2センチメートル未満: `COLONOSCOPY_PROCEDURE_CODE_SMALL = "150285010"`
* 長径2センチメートル以上: `COLONOSCOPY_PROCEDURE_CODE_LARGE = "150183410"`
* 両方のコードをまとめた配列: `COLONOSCOPY_PROCEDURE_CODES`

### 4.3 入出力仕様

#### 4.3.1 入力データ

* 入院EF統合ファイル（複数可）
* ファイル選択またはドラッグ＆ドロップで入力
* 複数月のデータを一度に処理可能

#### 4.3.2 出力データ

* フォーマット: タブ区切りテキスト
* ヘッダ行: `データ識別番号	入院年月日	退院年月日	短手３対象症例	理由`
* 日付フォーマット: 「YYYYMMDD」または「YYYY/MM/DD」（選択可能）
* 出力内容: 対象症例のみまたは全症例（選択可能）
* 「短手３対象症例」列: "Yes" または "No"
* 「理由」列: 対象症例は実施手術名、非対象症例は非該当理由

### 4.4 技術的実装

#### 4.4.1 モジュールシステム

* Node.js環境: ESモジュール採用（`"type": "module"`）
* ブラウザ環境: Parcelによるモジュールバンドル
  * file://プロトコルでの直接実行に対応
  * すべてのコードを単一のバンドルファイルに統合
  * ESモジュールとTypeScriptの機能を活用

#### 4.4.2 型システム

* TypeScript型定義の集中管理（`types.ts`）
* 厳格な型チェックによるバグ防止
* any型の使用を最小限に抑制

#### 4.4.3 入力検証

* ファイル選択時に自動検証
* 形式チェック: 施設コード、データ識別番号、日付形式など
* エラーと警告の明確な区別
* 同種の警告はまとめて表示（UI過負荷防止）

#### 4.4.4 複数ファイル処理

* 複数月データの連続処理
* 月をまたぐ入退院の適切な処理
* 退院日未確定症例（`00000000`）の追跡

## 5. テスト体制

### 5.1 単体テスト

* Jest フレームワークを使用
* コアモジュールの単体テストカバレッジ:
  * core/common全体: 86.62%
  * constants.ts: 100%
  * evaluator.ts: 94.73%
  * parsers.ts: 85.62%
  * utils.ts: 72.61%

### 5.2 統合テスト

* モジュール間連携のテスト
* 複数月データフローのテスト
* 合計テストケース数: 73ケース

### 5.3 テスト実行方法

* 単体・統合テスト実行: `npm test`
* 監視モードでのテスト: `npm run test:watch`
* カバレッジレポート生成: `npm run test:coverage`
* 旧式テスト実行: `npm run test:legacy`

## 6. 開発とメンテナンス

### 6.1 開発フロー

1. TypeScriptファイル（`.ts`）を編集
2. `npm run build` コマンドでParcelによるバンドル生成
3. ブラウザで `index.html` を開いて動作確認

### 6.2 コード品質管理

* ESLint による静的コード解析
* Prettier によるコードフォーマット統一
* Husky による自動コード品質チェック（コミット前）
* テストカバレッジの定期的確認

### 6.3 変更時の注意点

* ビジネスロジック変更: `src/core/common/` 内の該当ファイルを修正
* UI変更: `public/index.html` と `src/ui/components/` を修正
* テスト変更: `test/jest/` 内の対応するテストを修正
* 型定義変更: `src/core/common/types.ts` を修正
* 変更後は必ずテストを実行し、機能検証を行うこと

## 7. 特記事項

### 7.1 退院日未確定症例の取り扱い

* 入院EF統合ファイルで退院年月日が`00000000`の症例は、その月に退院しなかったことを意味する
* 短手３該当性は未確定となる
* 後続の月のファイルで退院日が確定した場合は、ファイルを跨いで正しく判定する必要がある

### 7.2 最近の機能強化

* ブラウザ互換性の改善
  * file://プロトコルでの直接実行対応
  * Parcelによるモジュールバンドル
  * スクリプトのバンドル化による依存関係の単純化
  * ESモジュールの完全サポート
* 入院統合EFファイルのバリデーション機能追加
* UI/UX機能強化
  * ファイル選択機能の改善
  * ドラッグ＆ドロップによるファイル入力
  * 「クリア」ボタンの追加
  * 結果表示テキストエリアの実装
  * クリップボードへのコピー機能
* 出力フォーマットの拡張
  * 短手３対象/非対象の区分表示
  * 理由の詳細表示
  * 日付フォーマット選択機能
* 診療行為コード定義の更新
  * 内視鏡的大腸ポリープ・粘膜切除術コードの修正
  * 評価ロジックの対応更新
* テスト環境の整備
  * Jest設定の最適化
  * テストカバレッジレポート自動生成
  * GitHub Actionsによる自動テスト実行

### 7.3 今後の課題

* バリデーション機能のテストケース拡充
* UI/UX機能の継続的改善
* コードカバレッジの向上（目標: 95%以上）
* レガシーコードのリファクタリング完了
* エラーハンドリングの強化
* ブラウザ互換性テストの自動化
* パフォーマンス最適化（大量データ処理時）

---
最終更新日: 2025年3月13日
