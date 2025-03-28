/**
 * すべてのテストを実行するためのスクリプト
 *
 * このファイルには、アプリケーションのすべてのテストを実行するための
 * コードが含まれています。
 */

const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const { promisify } = require('util');
const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);

// テスト対象のURL
const TEST_URL = 'http://localhost:3000';

// テスト結果の保存先ディレクトリ
const RESULTS_DIR = path.join(__dirname, '../test-results');

/**
 * 結果保存用のディレクトリを作成する関数
 *
 * @param {string} dirPath - ディレクトリのパス
 */
async function createResultsDirectory(dirPath) {
  try {
    await mkdir(dirPath, { recursive: true });
    console.log(`ディレクトリを作成しました: ${dirPath}`);
  } catch (error) {
    console.error(`ディレクトリの作成に失敗しました: ${error.message}`);
  }
}

/**
 * コマンドを実行する関数
 *
 * @param {string} command - 実行するコマンド
 * @param {Array<string>} args - コマンドの引数
 * @param {Object} options - 実行オプション
 * @returns {Promise<string>} - コマンドの出力
 */
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, options);

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log(data.toString());
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error(data.toString());
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`コマンドの実行に失敗しました: ${stderr}`));
      }
    });
  });
}

/**
 * 開発サーバーを起動する関数
 *
 * @returns {Object} - サーバープロセス
 */
function startDevServer() {
  console.log('開発サーバーを起動しています...');

  const serverProcess = spawn('npm', ['run', 'start'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
  });

  serverProcess.stdout.on('data', (data) => {
    console.log(`サーバー出力: ${data.toString()}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`サーバーエラー: ${data.toString()}`);
  });

  // サーバーが起動するまで待機
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('開発サーバーが起動しました');
      resolve(serverProcess);
    }, 5000);
  });
}

/**
 * ユニットテストを実行する関数
 */
async function runUnitTests() {
  console.log('ユニットテストを実行しています...');

  try {
    await runCommand('npm', ['test', '--', '--testPathPattern=unit']);
    console.log('ユニットテストが完了しました');
  } catch (error) {
    console.error(`ユニットテストの実行中にエラーが発生しました: ${error.message}`);
  }
}

/**
 * 統合テストを実行する関数
 */
async function runIntegrationTests() {
  console.log('統合テストを実行しています...');

  try {
    await runCommand('npm', ['test', '--', '--testPathPattern=integration']);
    console.log('統合テストが完了しました');
  } catch (error) {
    console.error(`統合テストの実行中にエラーが発生しました: ${error.message}`);
  }
}

/**
 * ブラウザテストを実行する関数
 */
async function runBrowserTests() {
  console.log('ブラウザテストを実行しています...');

  try {
    await runCommand('node', ['test/browser-compatibility/automated-browser-test.js']);
    console.log('ブラウザテストが完了しました');
  } catch (error) {
    console.error(`ブラウザテストの実行中にエラーが発生しました: ${error.message}`);
  }
}

/**
 * アクセシビリティテストを実行する関数
 */
async function runAccessibilityTests() {
  console.log('アクセシビリティテストを実行しています...');

  try {
    await runCommand('node', ['test/accessibility/accessibility-test.js']);
    console.log('アクセシビリティテストが完了しました');
  } catch (error) {
    console.error(`アクセシビリティテストの実行中にエラーが発生しました: ${error.message}`);
  }
}

/**
 * パフォーマンステストを実行する関数
 */
async function runPerformanceTests() {
  console.log('パフォーマンステストを実行しています...');

  try {
    // Lighthouseを使用したパフォーマンステスト
    await runCommand('npx', [
      'lighthouse',
      TEST_URL,
      '--output=json',
      `--output-path=${path.join(RESULTS_DIR, 'performance/lighthouse-report.json')}`,
    ]);
    console.log('パフォーマンステストが完了しました');
  } catch (error) {
    console.error(`パフォーマンステストの実行中にエラーが発生しました: ${error.message}`);
  }
}

/**
 * テスト結果をまとめる関数
 */
async function summarizeTestResults() {
  console.log('テスト結果をまとめています...');

  try {
    // テスト結果のサマリーを作成
    const summary = {
      timestamp: new Date().toISOString(),
      tests: {
        unit: {
          status: 'completed',
          resultsPath: 'test-results/unit',
        },
        integration: {
          status: 'completed',
          resultsPath: 'test-results/integration',
        },
        browser: {
          status: 'completed',
          resultsPath: 'test-results/browser',
        },
        accessibility: {
          status: 'completed',
          resultsPath: 'test-results/accessibility',
        },
        performance: {
          status: 'completed',
          resultsPath: 'test-results/performance',
        },
      },
    };

    // サマリーをファイルに保存
    await writeFile(path.join(RESULTS_DIR, 'summary.json'), JSON.stringify(summary, null, 2));

    console.log('テスト結果のまとめが完了しました');
  } catch (error) {
    console.error(`テスト結果のまとめ中にエラーが発生しました: ${error.message}`);
  }
}

/**
 * すべてのテストを実行する関数
 */
async function runAllTests() {
  console.log('すべてのテストを実行します...');

  // 結果保存用のディレクトリを作成
  await createResultsDirectory(RESULTS_DIR);
  await createResultsDirectory(path.join(RESULTS_DIR, 'unit'));
  await createResultsDirectory(path.join(RESULTS_DIR, 'integration'));
  await createResultsDirectory(path.join(RESULTS_DIR, 'browser'));
  await createResultsDirectory(path.join(RESULTS_DIR, 'accessibility'));
  await createResultsDirectory(path.join(RESULTS_DIR, 'performance'));

  // 開発サーバーを起動
  const serverProcess = await startDevServer();

  try {
    // 各テストを実行
    await runUnitTests();
    await runIntegrationTests();
    await runBrowserTests();
    await runAccessibilityTests();
    await runPerformanceTests();

    // テスト結果をまとめる
    await summarizeTestResults();
  } catch (error) {
    console.error(`テスト実行中にエラーが発生しました: ${error.message}`);
  } finally {
    // 開発サーバーを終了
    serverProcess.kill();
    console.log('開発サーバーを終了しました');
  }

  console.log('すべてのテストが完了しました');
}

// コマンドライン引数に基づいて特定のテストのみを実行
const args = process.argv.slice(2);

if (args.length === 0) {
  // 引数がない場合はすべてのテストを実行
  runAllTests();
} else {
  // 特定のテストのみを実行
  (async () => {
    await createResultsDirectory(RESULTS_DIR);

    const serverProcess = await startDevServer();

    try {
      for (const arg of args) {
        switch (arg) {
          case 'unit':
            await createResultsDirectory(path.join(RESULTS_DIR, 'unit'));
            await runUnitTests();
            break;
          case 'integration':
            await createResultsDirectory(path.join(RESULTS_DIR, 'integration'));
            await runIntegrationTests();
            break;
          case 'browser':
            await createResultsDirectory(path.join(RESULTS_DIR, 'browser'));
            await runBrowserTests();
            break;
          case 'accessibility':
            await createResultsDirectory(path.join(RESULTS_DIR, 'accessibility'));
            await runAccessibilityTests();
            break;
          case 'performance':
            await createResultsDirectory(path.join(RESULTS_DIR, 'performance'));
            await runPerformanceTests();
            break;
          default:
            console.error(`不明なテストタイプ: ${arg}`);
        }
      }
    } finally {
      serverProcess.kill();
      console.log('開発サーバーを終了しました');
    }
  })();
}

// モジュールとしてエクスポート
module.exports = {
  runUnitTests,
  runIntegrationTests,
  runBrowserTests,
  runAccessibilityTests,
  runPerformanceTests,
  runAllTests,
};
