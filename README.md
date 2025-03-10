# 短期滞在手術等基本料３判定プログラム

## 概要

このプログラムは、DPC対象病院において、入院EF統合ファイルから短期滞在手術等基本料３（以下「短手３」）に該当する症例を自動で判別するためのツールです。

## 主な機能

- 入院EF統合ファイルの読み込み
- 連続した複数月のファイルを一括処理
- 短手３の判定条件に基づいた該当症例の抽出
- 結果のタブ区切りテキストファイル出力

## 動作環境

- **OS**: Windows 10以上
- **ブラウザ**: Google Chrome、Microsoft Edge、Firefox（最新版推奨）
- **その他**: ローカル環境で動作（インターネット接続不要）

## 使用方法

1. `index.html` をブラウザで開く
2. 「ファイルを選択」ボタンから入院EF統合ファイルを選択（複数選択可能）
3. 「実行」ボタンをクリックして処理を開始
4. 処理完了後、短手３該当症例の一覧が表示される
5. 「結果をダウンロード」ボタンで結果をファイルとして保存

## 開発者向け情報

### セットアップ

```powershell
# リポジトリのクローン
git clone https://github.com/31103/tanshu3.git
cd tanshu3

# 依存パッケージのインストール
npm install

# TypeScriptのコンパイル
npm run build
```

### ファイル構成

```
tanshu3/
├── public/                  # 公開ファイル
│   ├── index.html          # メインUI
│   ├── css/                # スタイルシート
│   └── js/                 # コンパイル後のJSファイル
├── src/                    # ソースコード
│   ├── browser/            # ブラウザ環境用コード
│   │   ├── common.browser.ts # ブラウザ用共通ロジック
│   │   └── main.ts         # UI処理
│   ├── core/               # コアロジック
│   │   ├── common/         # 共通関数
│   │   ├── adapters/       # アダプターモジュール
│   │   ├── common.ts       # 共通ビジネスロジック
│   │   └── index.ts        # エントリーポイント
│   ├── ui/                 # UIコンポーネント
│   │   └── components/     # 再利用可能なコンポーネント
│   └── types/              # 型定義
│       └── types.d.ts      # プロジェクト全体の型定義
├── dist/                   # ビルド出力ディレクトリ
├── test/                   # テストコード
│   ├── fixtures/           # テスト用データ
│   ├── unit/               # ユニットテスト
│   ├── integration/        # 統合テスト
│   └── jest/               # Jestの設定
├── docs/                   # プロジェクト仕様書
│   ├── project_overview.md
│   ├── 入院EF統合ファイルについて.md
│   └── 短期滞在手術等基本料３について.md
├── .github/                # GitHub関連の設定
├── .husky/                 # Git Hooks設定
├── coverage/               # テストカバレッジレポート
├── node_modules/           # 依存パッケージ
├── package.json            # プロジェクト設定
├── tsconfig.json           # TypeScript設定
├── jest.config.js          # Jest設定
├── .eslintrc.json          # ESLint設定
└── .prettierrc.json        # Prettier設定
```

### テスト実行

```powershell
npm run test
```

## 短手３判定ロジック

短期滞在手術等基本料３に該当する主な条件：

1. 入院中に対象手術等（特定の診療行為コード）を1つのみ実施
2. 入院期間が5日以内
3. 入院期間中に他の手術を実施していない
4. 特定の加算を算定していない（内視鏡的大腸ポリープ・粘膜切除術の場合）

詳細は `docs/短期滞在手術等基本料３について.md` を参照してください。

## トラブルシューティング

| 問題 | 対処方法 |
|------|----------|
| ファイルが読み込めない | ファイル形式（タブ区切りテキスト）を確認してください |
| 処理が遅い | 大量データの場合は処理に時間がかかります。ブラウザを閉じないでください |
| 判定結果が期待と異なる | `docs/短期滞在手術等基本料３について.md` の条件を確認してください |
| エラーが表示される | ブラウザのコンソールに表示されるエラーメッセージを確認してください |

## サポート・問い合わせ

問題が解決しない場合は、以下の情報を添えて開発者に連絡してください：
- 使用ブラウザとそのバージョン
- 発生した問題の詳細
- エラーメッセージ（ある場合）
- 処理対象ファイルの概要（サイズ、件数など）

## ライセンス

本プロジェクトは内部利用を目的としており、無断での複製・配布・改変は禁止されています。
