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
├── .clinerules             # Cline用設定ファイル
├── .eslintrc.json          # ESLint設定
├── .gitignore              # Git無視リスト
├── .prettierrc.json        # Prettier設定
├── jest.config.js          # Jest設定
├── package-lock.json       # 依存関係ロックファイル
├── package.json            # プロジェクト設定
├── README.md               # このファイル
├── tanshu3.code-workspace  # VSCodeワークスペース設定
├── tsconfig.json           # TypeScript設定
├── tsconfig.test.json      # TypeScriptテスト用設定
├── coverage/               # テストカバレッジレポート
├── dist/                   # ビルド出力ディレクトリ
├── docs/                   # ドキュメント
│   ├── project_overview.md # プロジェクト概要
│   ├── 短期滞在手術等基本料３について.md # 短手３判定ロジック詳細
│   └── 入院EF統合ファイルについて.md   # EFファイル仕様
├── public/                 # 公開ファイル (ブラウザで直接アクセス)
│   ├── index.html          # メインUI
│   ├── css/                # スタイルシート
│   │   └── styles.css
│   └── js/                 # コンパイル後のJavaScript (Parcelが出力)
├── src/                    # ソースコード (TypeScript)
│   ├── browser/            # ブラウザ環境依存コード
│   │   ├── common.browser.ts # ブラウザ用共通関数
│   │   └── main.ts         # UIイベント処理、エントリーポイント
│   ├── core/               # コアロジック (ブラウザ/Node.js共通)
│   │   ├── common.ts       # 共通関数 (コアロジック内)
│   │   ├── file-processor.ts # ファイル処理ロジック
│   │   ├── index.ts        # コアモジュールエントリーポイント
│   │   ├── validator.ts    # データ検証ロジック
│   │   ├── adapters/       # 環境依存処理の抽象化
│   │   │   ├── browser.ts  # ブラウザ用アダプター
│   │   │   └── node.ts     # Node.js用アダプター (テスト等で使用)
│   │   └── common/         # 共通定数、型、パーサー、評価ロジック等
│   │       ├── constants.ts
│   │       ├── evaluator.ts
│   │       ├── parsers.ts
│   │       ├── types.ts
│   │       └── utils.ts
│   ├── types/              # グローバルな型定義
│   │   └── types.d.ts
│   └── ui/                 # UI関連コード
│       └── components/     # UIコンポーネント
│           ├── file-manager.ts # ファイル選択・管理UI
│           ├── notification.ts # 通知表示UI
│           └── result-viewer.ts # 結果表示UI
├── test/                   # テストコード
│   ├── run-tests.js        # テストランナー (Jest以外)
│   ├── accessibility/      # アクセシビリティテスト
│   │   └── accessibility-test.js
│   ├── browser-compatibility/ # ブラウザ互換性テスト
│   │   └── automated-browser-test.js
│   ├── fixtures/           # テスト用データ
│   │   ├── expect.txt      # 期待される出力結果
│   │   └── sampleEF/       # サンプルEFファイル
│   └── jest/               # Jestテスト
│       ├── integration/    # 統合テスト
│       │   ├── data-flow.test.ts
│       │   └── module-integration.test.ts
│       └── unit/           # ユニットテスト
│           ├── constants.test.ts
│           ├── evaluator.test.ts
│           ├── parsers.test.ts
│           ├── sample.test.ts
│           ├── utils.test.ts
│           └── validator.test.ts
├── .github/                # GitHub Actionsなどの設定
└── .husky/                 # Gitフック設定
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

| 問題                   | 対処方法                                                               |
| ---------------------- | ---------------------------------------------------------------------- |
| ファイルが読み込めない | ファイル形式（タブ区切りテキスト）を確認してください                   |
| 処理が遅い             | 大量データの場合は処理に時間がかかります。ブラウザを閉じないでください |
| 判定結果が期待と異なる | `docs/短期滞在手術等基本料３について.md` の条件を確認してください      |
| エラーが表示される     | ブラウザのコンソールに表示されるエラーメッセージを確認してください     |

## サポート・問い合わせ

問題が解決しない場合は、以下の情報を添えて開発者に連絡してください：

- 使用ブラウザとそのバージョン
- 発生した問題の詳細
- エラーメッセージ（ある場合）
- 処理対象ファイルの概要（サイズ、件数など）

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は `LICENSE` ファイルをご覧ください。
