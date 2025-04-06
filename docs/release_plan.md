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

### ステップ3: GitHub Releaseでの公開手順 (手動)

1. **単一HTML生成:**
   - ターミナルで `deno task release:build` を実行し、`dist/tanshu3.html` が生成されることを確認する。
2. **GitHub CLIの確認:**
   - ターミナルで `gh --version` を実行し、GitHub CLIがインストールされているか確認する。
   - インストールされていない場合は、[公式ドキュメント](https://cli.github.com/)に従ってインストールするよう案内する。
3. **リリースタグ作成 (任意):**
   - 必要に応じて、Gitでリリースタグを作成する (例: `git tag v1.0.0`)。
   - タグをリモートリポジトリにプッシュする (例: `git push origin v1.0.0`)。
4. **リリース作成とファイルアップロード:**
   - ターミナルで以下のコマンドを実行する (タグ名、タイトル、ノートは適宜変更)。
   ```bash
   gh release create [タグ名] ./dist/tanshu3.html --title "[リリースタイトル]" --notes "[リリースノート]"
   ```
   - 例:
   ```bash
   gh release create v1.0.0 ./dist/tanshu3.html --title "バージョン 1.0.0" --notes "最初のリリース。単一HTMLファイル版です。"
   ```
5. **確認:**
   - GitHubリポジトリのReleasesページを開き、リリースが作成され、`tanshu3.html` がアセットとしてアップロードされていることを確認する。

## 3. 成果物

- `scripts/release.ts` (単一HTML生成スクリプト)
- 更新された `deno.jsonc` (`release:build` タスク追加)
- 更新された `.gitignore` (ビルド成果物除外)
- `docs/release_plan.md` (この計画書)
- (実行後) `dist/tanshu3.html` (単一HTMLファイル)

## 4. 前提条件

- Deno (v2.2.7以上推奨) がインストールされていること。
- プロジェクトがGitリポジトリとして管理されており、GitHubにリモートリポジトリが存在すること。
- GitHub Release操作のためにGitHub CLI (`gh`) が利用可能であること (推奨)。
