# 単一HTMLファイル生成とGitHub Release計画

## 1. 目的

ビルドされた成果物（HTML, CSS, JavaScript）を単一のHTMLファイルにまとめ、GitHub Releaseを通じて配布可能にする。ビルド成果物はGitリポジトリの追跡対象外とする。

## 2. 計画ステップ

### ステップ1: 単一HTMLファイル生成スクリプトの作成

1. **スクリプト作成:**
   - `scripts/release.ts` という名前で新しいTypeScriptファイルを作成する。
2. **スクリプト内容:**
   - **依存関係:** Deno標準ライブラリ (`std/fs`, `std/path`) をインポートする。
   - **ビルド実行:** `deno task bundle` をサブプロセスとして実行し、`public/js/main.js` を生成する。
   - **ファイル読み込み:**
     - `public/index.html` の内容を読み込む。
     - `public/css/styles.css` の内容を読み込む。
     - `public/js/main.js` の内容を読み込む。
   - **HTML加工:**
     - 読み込んだHTML文字列から `<link rel="stylesheet" href="css/styles.css">` を検索し、`<style>` タグで囲んだCSSの内容に置換する。
     - HTML文字列から `<script src="js/main.js"></script>` を検索し、`<script>` タグで囲んだJavaScriptの内容に置換する。
   - **出力ディレクトリ作成:** `dist` ディレクトリが存在しない場合は作成する (`Deno.mkdir("dist", { recursive: true })`)。
   - **ファイル書き込み:** 加工後のHTML文字列を `dist/tanshu3.html` として書き込む (`Deno.writeTextFile`)。
   - **ログ出力:** 処理の開始、ビルド完了、ファイル書き込み完了などのログをコンソールに出力する。
3. **Denoタスク追加:**
   - `deno.jsonc` ファイルを開き、`tasks` オブジェクト内に新しいタスクを追加する。
   ```jsonc
   {
     // ... existing tasks ...
     "release:build": "deno run --allow-read --allow-write --allow-run=deno scripts/release.ts"
   }
   ```
   - `--allow-run=deno` は `deno task bundle` をサブプロセスとして実行するために必要。
   - `--allow-read` はHTML/CSS/JSファイルの読み込みに必要。
   - `--allow-write` は `dist/tanshu3.html` の書き込みに必要。

### ステップ2: Git管理対象外の設定

1. **`.gitignore` ファイル編集:**
   - `.gitignore` ファイルを開く。
   - 以下の行が存在しない場合は追記する。
   ```gitignore
   # Build artifacts
   public/js/main.js
   public/js/main.js.map
   dist/
   ```

### ステップ3: GitHub Actions によるリリース自動化

手動でのリリース作業を自動化するため、GitHub Actions ワークフローを導入します。

1. **ワークフローファイル作成:**
   - リポジトリのルートに `.github/workflows/` ディレクトリを作成します (存在しない場合)。
   - `.github/workflows/release.yml` という名前で以下の内容のファイルを作成します。

   ```yaml
   name: Create GitHub Release

   on:
     push:
       tags:
         - 'v*.*.*' # vで始まるタグがプッシュされたときに実行

   jobs:
     build-and-release:
       runs-on: ubuntu-latest # 実行環境
       permissions:
         contents: write # リリース作成のために必要

       steps:
         - name: Checkout repository
           uses: actions/checkout@v4

         - name: Setup Deno
           uses: deno-dev/setup-deno@v1
           with:
             deno-version: v1.x # プロジェクトのDenoバージョンに合わせて調整

         # オプション: Denoの依存関係キャッシュ (ビルド高速化のため)
         - name: Cache Deno dependencies
           uses: actions/cache@v4
           with:
             path: ~/.cache/deno
             key: ${{ runner.os }}-deno-${{ hashFiles('deno.lock') }}
             restore-keys: |
               ${{ runner.os }}-deno-

         - name: Build single HTML file
           run: deno task release:build

         - name: Create GitHub Release and Upload Artifact
           env:
             GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }} # 自動的に提供されるトークン
           run: |
             gh release create ${{ github.ref_name }} ./dist/tanshu3.html --generate-notes --title "Release ${{ github.ref_name }}"
             echo "Release ${{ github.ref_name }} created with tanshu3.html artifact."
   ```

2. **リリース手順:**
   - ローカルで変更をコミットし、`v` から始まる新しいタグを作成します (例: `git tag v1.0.1`)。
   - 作成したタグを GitHub リポジトリにプッシュします (例: `git push origin v1.0.1`)。
   - GitHub Actions ワークフローが自動的にトリガーされ、以下の処理を実行します:
     - リポジトリをチェックアウトします。
     - Deno 環境をセットアップします。
     - `deno task release:build` を実行し、`dist/tanshu3.html` を生成します。
     - プッシュされたタグ名で新しい GitHub Release を作成します。
     - 生成された `dist/tanshu3.html` をリリースのアセットとしてアップロードします。
     - リリースノートを自動生成します。
3. **確認:**
   - GitHub リポジトリの Actions タブでワークフローの実行状況を確認します。
   - ワークフロー完了後、Releases ページで新しいリリースとアップロードされた `tanshu3.html` を確認します。

## 3. 成果物

- `scripts/release.ts` (単一HTML生成スクリプト)
- 更新された `deno.jsonc` (`release:build` タスク追加)
- 更新された `.gitignore` (ビルド成果物除外)
- `docs/release_plan.md` (この計画書)
- `.github/workflows/release.yml` (GitHub Actions ワークフローファイル)
- (実行後) `dist/tanshu3.html` (単一HTMLファイル)

## 4. 前提条件

- Deno (v2.2.7以上推奨) がインストールされていること。
- プロジェクトがGitリポジトリとして管理されており、GitHubにリモートリポジトリが存在すること。
