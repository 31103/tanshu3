# 短期滞在手術等基本料３判定プログラム

## 概要

このプログラムは、DPC対象病院において、入院EF統合ファイルから短期滞在手術等基本料３（以下「短手３」）に該当する症例を自動で判別するためのツールです。医療機関における対象症例の効率的な抽出と、適切な診療報酬請求を支援します。

## 主な機能

- 入院EF統合ファイルの読み込み（タブ区切りテキスト形式）
- 連続した複数月のファイルを一括処理（月をまたぐ患者データの追跡）
- 短手３の判定条件に基づいた該当症例の抽出
- ファイル形式の自動検証（エラー/警告の表示）
- 日付フォーマット選択（YYYYMMDD / YYYY/MM/DD）
- 結果のタブ区切りテキストファイル出力
- 結果のクリップボードコピー機能
- ドラッグ＆ドロップによるファイル選択

## 動作環境

- **OS**: Windows 10以上
- **ブラウザ**: Google Chrome、Microsoft Edge、Firefox（最新版推奨）
- **その他**: ローカル環境で動作（インターネット接続不要、`file://` プロトコル対応、**インストール不要**）

## 使用方法

### ダウンロード

1. **[GitHub Releases ページ](https://github.com/31103/tanshu3/releases) にアクセスします。**
2. 最新リリースの「Assets」セクションから `tanshu3.html` ファイルをダウンロードします。

### 簡単な使い方

1. `tanshu3.html` をブラウザで開く
2. 「ファイルを選択」ボタンから入院EF統合ファイルを選択（複数選択可能）、またはファイルをドラッグ＆ドロップ
3. 出力オプション（全症例/対象症例のみ、日付フォーマット）を選択
4. 「実行」ボタンをクリックして処理を開始
5. 処理完了後、短手３該当症例の一覧が表示される
6. 「結果をダウンロード」ボタンで結果をファイルとして保存、または「クリップボードにコピー」で結果をコピー
7. 「クリア」ボタンでファイル選択や結果表示をリセット

## 開発者向け情報

### セットアップ

```powershell
# リポジトリのクローン
git clone https://github.com/31103/tanshu3.git
cd tanshu3

# 依存関係のキャッシュ (初回実行時などに自動で行われます)
# 必要に応じて deno cache --reload scripts/build.ts scripts/release.ts
```

### 開発環境

- **ランタイム**: Deno (v2.2.7 以上推奨)
- **パッケージ管理**: URL Imports / Import Map (`import_map.json`)
- **ビルドツール**: esbuild (`deno.land/x/esbuild`) - `deno task bundle` 経由で使用
- **リリーススクリプト**: Deno (`scripts/release.ts`) - `deno task release:build` 経由で使用
- **言語**: TypeScript
- **テスト**: Deno Test + deno-dom
- **コード品質**: Deno Lint + Deno Format
- **CI/CD**: GitHub Actions
  - **CI (継続的インテグレーション):** `.github/workflows/ci.yml`
    - **目的:** コード品質の維持と早期の問題発見。
    - **トリガー:** `main` ブランチへの push および pull request 作成・更新時。
    - **実行内容:** Lint チェック (`deno task lint`), Format チェック (`deno task fmt --check`), テスト実行 (`deno task test`), ビルド確認 (`deno task bundle`)。
  - **CD (継続的デリバリー/デプロイメント):** `.github/workflows/release.yml`
    - **目的:** リリースの自動化。
    - **トリガー:** `v*.*.*` 形式のタグプッシュ時。
    - **実行内容:**
      1. **リリースノート自動生成:** [Conventional Commits](https://www.conventionalcommits.org/) 規約に基づき、`release-drafter` (`.github/release-drafter.yml` で設定) を使用してコミット履歴からリリースノートを含むドラフトを作成。
      2. **ビルド:** 単一HTMLファイル (`dist/tanshu3.html`) を生成 (`deno task release:build`)。
      3. **リリース公開:** 生成されたHTMLファイルを GitHub Release にアップロードし、ドラフトを公開。

### ファイル構成

```
tanshu3/
├── .github/                # GitHub Actions ワークフロー
│   └── workflows/
│       ├── ci.yml          # CI ワークフロー
│       └── release.yml     # リリース自動化ワークフロー
├── .github/release-drafter.yml # リリースノート自動生成設定
├── coverage/               # テストカバレッジレポート
├── docs/                   # ドキュメント
│   ├── release_plan.md     # リリース計画
│   ├── 短期滞在手術等基本料３について.md # 短手３判定ロジック詳細
│   └── 入院EF統合ファイルについて.md   # EFファイル仕様
├── memory-bank/            # プロジェクトメモリーバンク
├── public/                 # 公開ファイル (ブラウザで直接アクセス)
├── scripts/                # ビルド・リリーススクリプトなど
│   ├── build.ts            # esbuild を使用したバンドルスクリプト
│   ├── bump-version.ts     # バージョン更新・タグ付け自動化スクリプト
│   └── release.ts          # 単一HTML生成スクリプト
├── src/                    # ソースコード (TypeScript)
│   ├── browser/            # ブラウザ環境依存コード
│   ├── core/               # コアロジック (環境非依存)
│   │   └── common/
│   │       └── version.ts  # アプリケーションバージョン管理
│   └── ui/                 # UI関連コード
└── test/                   # テストコード
    ├── fixtures/           # テスト用データ
    └── integration/        # 統合テスト (Deno Test)
```

(コアロジックとUIコンポーネントのユニットテストは各ソースファイルの隣に `_test.ts` として配置)

### コマンド一覧 (`deno.jsonc` の `tasks` で定義)

| コマンド                                       | 説明                                                    |
| ---------------------------------------------- | ------------------------------------------------------- |
| `deno task dev`                                | 開発用タスク (現在は `bundle` と同じ)                   |
| `deno task bundle`                             | esbuild を使用してプロダクション用ビルド (`public/js/`) |
| `deno task release:build`                      | 単一HTMLファイル (`dist/tanshu3.html`) を生成           |
| `deno task test`                               | すべてのテスト実行                                      |
| `deno task lint`                               | Deno Lint によるコード検証                              |
| `deno task fmt`                                | Deno Format によるコードフォーマット                    |
| `deno task check`                              | 型チェック実行                                          |
| `deno task release:bump [patch\|minor\|major]` | バージョン更新、コミット、タグ付け、プッシュを自動実行  |

### リリース手順

1. リリース準備が整ったら、変更内容に応じて以下のコマンドを実行します。
   ```powershell
   # パッチバージョンの場合 (バグ修正など)
   deno task release:bump patch

   # マイナーバージョンの場合 (機能追加など)
   deno task release:bump minor

   # メジャーバージョンの場合 (互換性のない変更)
   deno task release:bump major
   ```
2. スクリプトが自動的に `src/core/common/version.ts` を更新し、コミット (`chore(release): ...`)、タグ付け (`vX.Y.Z`)、プッシュを行います。
3. タグのプッシュをトリガーとして、GitHub Actions の CD ワークフロー (`release.yml`) が実行され、リリースノートの生成と成果物 (`tanshu3.html`) のアップロードが行われます。

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

## 免責事項

- このプログラムは、短期滞在手術等基本料３症例の判定を補助する目的で開発されたものであり、判定結果の完全な正確性を保証するものではありません。
- 本プログラムの利用によって生じたいかなる損害や不利益についても、開発者は一切の責任を負いません。
- 最終的な請求内容の判断と責任は、利用する医療機関にあります。必ず公式な通知や基準に基づいて最終確認を行ってください。

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は `LICENSE` ファイルをご覧ください。
