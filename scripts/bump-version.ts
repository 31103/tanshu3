#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run=git
/**
 * バージョン更新、コミット、タグ付け、プッシュを自動化するスクリプト
 *
 * 使い方:
 * deno task release:bump [patch|minor|major]
 */
import { increment, parse } from 'https://deno.land/std@0.224.0/semver/mod.ts';
import { Command } from 'https://deno.land/x/cliffy@v1.0.0-rc.4/command/mod.ts';

const VERSION_FILE_PATH = 'src/core/common/version.ts';
const VERSION_REGEX = /export const APP_VERSION = '([^']+)'/;

/**
 * ファイルから現在のバージョンを読み込む
 */
async function getCurrentVersion(): Promise<string> {
  try {
    const content = await Deno.readTextFile(VERSION_FILE_PATH);
    const match = content.match(VERSION_REGEX);
    if (!match || !match[1]) {
      throw new Error(`バージョン情報が ${VERSION_FILE_PATH} に見つかりません。`);
    }
    // semver.parse で検証
    parse(match[1]);
    return match[1];
  } catch (error: unknown) { // error に型を追加
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${VERSION_FILE_PATH} の読み込み中にエラーが発生しました:`, message);
    Deno.exit(1);
  }
}

/**
 * ファイルに新しいバージョンを書き込む
 * @param newVersion 新しいバージョン文字列
 */
async function writeNewVersion(newVersion: string): Promise<void> {
  try {
    const content = await Deno.readTextFile(VERSION_FILE_PATH);
    const newContent = content.replace(VERSION_REGEX, `export const APP_VERSION = '${newVersion}'`);
    if (content === newContent) {
      throw new Error('バージョン文字列の置換に失敗しました。');
    }
    await Deno.writeTextFile(VERSION_FILE_PATH, newContent);
    console.log(`${VERSION_FILE_PATH} を ${newVersion} に更新しました。`);
  } catch (error: unknown) { // error に型を追加
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${VERSION_FILE_PATH} の書き込み中にエラーが発生しました:`, message);
    Deno.exit(1);
  }
}

/**
 * Git コマンドを実行する
 * @param args git コマンドの引数配列
 * @param errorMessage エラー時のメッセージ
 */
async function runGitCommand(args: string[], errorMessage: string): Promise<void> {
  console.log(`実行中: git ${args.join(' ')}`);
  const command = new Deno.Command('git', { args });
  const { code, stdout, stderr } = await command.output();

  if (code !== 0) {
    console.error(`${errorMessage}:`);
    console.error(new TextDecoder().decode(stderr));
    Deno.exit(code);
  }
  // stdout があれば表示 (任意)
  // const output = new TextDecoder().decode(stdout);
  // if (output.trim()) {
  //   console.log(output.trim());
  // }
}

/**
 * メイン処理
 */
await new Command()
  .name('bump-version')
  .version('0.1.0')
  .description('バージョンを更新し、Git コミットとタグ付けを行います。')
  .arguments('<type:string>') // patch, minor, major
  .action(async (_: unknown, type: string) => { // 引数に型を追加
    if (!['patch', 'minor', 'major'].includes(type)) {
      console.error('エラー: 引数には "patch", "minor", または "major" を指定してください。');
      Deno.exit(1);
    }

    const releaseType = type as 'patch' | 'minor' | 'major';

    // 1. 現在のバージョンを取得
    const currentVersionStr = await getCurrentVersion();
    const currentVersion = parse(currentVersionStr); // parse は検証も兼ねる

    // 2. 新しいバージョンを計算
    const newVersion = increment(currentVersion, releaseType);
    if (!newVersion) {
      console.error('新しいバージョンの計算に失敗しました。');
      Deno.exit(1);
    }
    const newVersionStr = `${newVersion.major}.${newVersion.minor}.${newVersion.patch}`;
    const tagName = `v${newVersionStr}`;

    console.log(`バージョンを ${currentVersionStr} から ${newVersionStr} に更新します...`);

    // 3. バージョンファイルを更新
    await writeNewVersion(newVersionStr);

    // 4. Git コミット
    await runGitCommand(['add', VERSION_FILE_PATH], 'Git add に失敗しました');
    await runGitCommand(
      ['commit', '-m', `chore(release): bump version to ${tagName}`],
      'Git commit に失敗しました',
    );

    // 5. Git タグ付け
    await runGitCommand(['tag', tagName], 'Git tag の作成に失敗しました');

    // 6. Git プッシュ (コミットとタグ)
    await runGitCommand(['push'], 'Git push (commit) に失敗しました');
    await runGitCommand(['push', 'origin', tagName], 'Git push (tag) に失敗しました');

    console.log(`✅ バージョン ${newVersionStr} のリリース準備が完了しました。`);
    console.log(`タグ ${tagName} が作成され、プッシュされました。`);
    console.log('GitHub Actions がリリースプロセスを開始します。');
  })
  .parse(Deno.args);
