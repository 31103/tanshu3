/**
 * 短期滞在手術等基本料３判定プログラム - テスト
 *
 * このファイルには、Node.js環境でのテスト実行に関する処理を定義しています。
 * 共通の処理ロジックはcommon.tsに定義されています。
 *
 * @version 1.1.0
 * @license MIT
 */

import * as fs from 'fs';
import * as path from 'path';
import { strict as assert } from 'assert';
import { fileURLToPath } from 'url';

// ESモジュールでの __dirname 相当の値を取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// common.tsから共通関数をインポート
import {
    targetProcedures,
    colonoscopySpecialAdditions,
    parseEFFile,
    mergeCases,
    evaluateCases,
    formatResults,
    CaseData
} from './common.js';

// テスト設定
interface TestConfig {
    sampleFiles: string[];
    expectedFile: string;
    verboseLevel: number;
}

const TEST_CONFIG: TestConfig = {
    // テストデータのパス
    sampleFiles: [
        path.join(__dirname, '..', 'test_data', 'sampleEF', 'sample_EFn_XXXXXXXXX_2407.txt'),
        path.join(__dirname, '..', 'test_data', 'sampleEF', 'sample_EFn_XXXXXXXXX_2408.txt')
    ],
    expectedFile: path.join(__dirname, '..', 'test_data', 'expect.txt'),

    // テスト結果の詳細度（1: 基本情報のみ、2: 詳細情報を含む、3: 全ての情報とデバッグ出力）
    verboseLevel: 2
};

// ログメッセージの種類
type LogType = 'info' | 'success' | 'error' | 'warning';

/**
 * テキストを正規化する関数
 * テスト比較のために、改行コードや空白を統一します
 * @param text - 正規化するテキスト
 * @returns 正規化されたテキスト
 */
function normalizeText(text: string): string {
    if (!text) return '';

    // 改行コードを統一
    let normalized = text.replace(/\r\n/g, '\n');
    // 末尾の空白行を削除
    normalized = normalized.trim();
    // 連続する空白を1つの空白に置換
    normalized = normalized.replace(/\s+/g, ' ');
    return normalized;
}

/**
 * テスト結果をコンソールに出力する関数
 * @param message - 出力するメッセージ
 * @param level - 詳細度レベル（1-3）
 * @param type - メッセージの種類
 */
function logTestResult(message: string, level: number = 1, type: LogType = 'info'): void {
    if (level > TEST_CONFIG.verboseLevel) return;

    const date = new Date();
    const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;

    let prefix = '';
    switch (type) {
        case 'success':
            prefix = '\x1b[32m✅ '; // 緑色
            break;
        case 'error':
            prefix = '\x1b[31m❌ '; // 赤色
            break;
        case 'warning':
            prefix = '\x1b[33m⚠️ '; // 黄色
            break;
        default:
            prefix = '\x1b[36mℹ️ '; // シアン
    }

    console.log(`${prefix}[${timeStr}] ${message}\x1b[0m`);
}

/**
 * ファイルからデータを読み込む関数
 * @param filePath - 読み込むファイルのパス
 * @returns ファイルの内容
 */
async function readTestFile(filePath: string): Promise<string> {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        throw new Error(`ファイル "${filePath}" の読み込みに失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * ファイル内の症例データをパースするテスト
 * @param filePath - テスト対象ファイルのパス
 * @returns パースされた症例データ
 */
async function testParseFile(filePath: string): Promise<CaseData[]> {
    const fileName = path.basename(filePath);
    logTestResult(`ファイル "${fileName}" の解析を開始します`, 1);

    const content = await readTestFile(filePath);
    const parsedCases = parseEFFile(content);

    logTestResult(`ファイル "${fileName}" から ${parsedCases.length} 件の症例データを抽出しました`, 1);

    if (TEST_CONFIG.verboseLevel >= 3) {
        // データ構造の一部を出力（最初の3件まで）
        const displaySample = parsedCases.slice(0, 3);
        logTestResult(`抽出データサンプル: ${JSON.stringify(displaySample, null, 2)}`, 3);
    }

    return parsedCases;
}

/**
 * 症例データの統合をテストする関数
 * @param cases1 - 1つ目の症例データ配列
 * @param cases2 - 2つ目の症例データ配列
 * @returns 統合された症例データ
 */
function testMergeCases(cases1: CaseData[], cases2: CaseData[]): CaseData[] {
    logTestResult(`症例データの統合を開始します（${cases1.length} 件 + ${cases2.length} 件）`, 1);

    const startTime = Date.now();
    const mergedCases = mergeCases(cases1, cases2);
    const endTime = Date.now();

    logTestResult(`症例データの統合が完了しました（${mergedCases.length} 件、処理時間: ${endTime - startTime}ms）`, 1);

    // 統合結果の検証
    const case1Count = new Set(cases1.map(c => c.id)).size;
    const case2Count = new Set(cases2.map(c => c.id)).size;
    const mergedCount = new Set(mergedCases.map(c => c.id)).size;

    // 重複を考慮した理論的な合計数と比較
    const expectedTotal = new Set([...cases1.map(c => c.id), ...cases2.map(c => c.id)]).size;

    if (mergedCount === expectedTotal) {
        logTestResult(`統合結果は正しいです（ユニークID数: ${mergedCount}）`, 2, 'success');
    } else {
        logTestResult(`統合結果に不一致があります（期待値: ${expectedTotal}, 実際値: ${mergedCount}）`, 2, 'warning');
    }

    // 統合時の退院日更新を検証
    let updatedDischargeDates = 0;
    for (const c1 of cases1) {
        const c2 = cases2.find(c => c.id === c1.id);
        if (c2 && c1.discharge === '00000000' && c2.discharge !== '00000000') {
            const merged = mergedCases.find(c => c.id === c1.id);
            if (merged && merged.discharge === c2.discharge) {
                updatedDischargeDates++;
            }
        }
    }

    if (updatedDischargeDates > 0) {
        logTestResult(`退院日が更新された症例数: ${updatedDischargeDates}`, 2);
    }

    return mergedCases;
}

/**
 * 短手３該当症例の判定をテストする関数
 * @param mergedCases - 統合された症例データ
 * @returns 短手３に該当する症例データ
 */
function testEvaluateCases(mergedCases: CaseData[]): CaseData[] {
    logTestResult(`短手３該当症例の判定を開始します（対象: ${mergedCases.length} 件）`, 1);

    const startTime = Date.now();
    const resultCases = evaluateCases(mergedCases);
    const endTime = Date.now();

    logTestResult(`短手３該当症例の判定が完了しました（${resultCases.length} 件、処理時間: ${endTime - startTime}ms）`, 1);

    // 判定結果の内訳
    if (TEST_CONFIG.verboseLevel >= 2) {
        // 対象手術等を実施している症例数
        const casesWithTargetProcedures = mergedCases.filter(c =>
            c.procedures.some(p => targetProcedures.includes(p))
        ).length;

        // 退院が確定している症例数
        const casesWithConfirmedDischarge = mergedCases.filter(c =>
            c.discharge && c.discharge !== '00000000'
        ).length;

        logTestResult(`対象手術等を実施している症例数: ${casesWithTargetProcedures}`, 2);
        logTestResult(`退院が確定している症例数: ${casesWithConfirmedDischarge}`, 2);
        logTestResult(`短手３該当率: ${(resultCases.length / mergedCases.length * 100).toFixed(1)}%`, 2);
    }

    return resultCases;
}

/**
 * 結果のフォーマットをテストする関数
 * @param resultCases - 短手３に該当する症例データ
 * @param headerLine - ヘッダー行
 * @returns フォーマットされた結果テキスト
 */
function testFormatResults(resultCases: CaseData[], headerLine: string): string {
    logTestResult(`結果のフォーマットを開始します（対象: ${resultCases.length} 件）`, 1);

    const outputText = formatResults(resultCases, headerLine);
    const lineCount = outputText.split(/\r?\n/).length;

    logTestResult(`結果のフォーマットが完了しました（${lineCount} 行）`, 1);

    if (TEST_CONFIG.verboseLevel >= 3) {
        logTestResult('\n--- 出力結果（先頭5行まで） ---', 3);
        const previewLines = outputText.split(/\r?\n/).slice(0, 5);
        logTestResult(previewLines.join('\n'), 3);
    }

    return outputText;
}

/**
 * 期待される結果と実際の出力を比較する関数
 * @param outputText - 実際の出力テキスト
 * @param expectedContent - 期待される結果テキスト
 * @returns 比較結果（一致する場合はtrue）
 */
function testCompareResults(outputText: string, expectedContent: string): boolean {
    logTestResult(`出力結果と期待される結果の比較を開始します`, 1);

    // 結果を比較（正規化して比較）
    const normalizedOutput = normalizeText(outputText);
    const normalizedExpected = normalizeText(expectedContent);

    // 出力と期待される結果の行数をチェック
    const outputLines = outputText.split(/\r?\n/).filter(line => line.trim());
    const expectedLines = expectedContent.split(/\r?\n/).filter(line => line.trim());

    logTestResult(`出力結果の行数: ${outputLines.length}`, 2);
    logTestResult(`期待される結果の行数: ${expectedLines.length}`, 2);

    // 詳細なデバッグ出力
    if (TEST_CONFIG.verboseLevel >= 3) {
        logTestResult(`正規化された出力結果: ${JSON.stringify(normalizedOutput)}`, 3);
        logTestResult(`正規化された期待される結果: ${JSON.stringify(normalizedExpected)}`, 3);
    }

    // 結果の一致を確認
    const isMatch = normalizedOutput === normalizedExpected;

    if (isMatch) {
        logTestResult(`出力結果と期待される結果が一致しました`, 1, 'success');
    } else {
        logTestResult(`出力結果と期待される結果が一致しませんでした`, 1, 'error');

        // 不一致がある場合は差分を表示
        if (TEST_CONFIG.verboseLevel >= 2) {
            // 行ごとに比較して違いを特定
            const outputLinesNorm = normalizedOutput.split(' ');
            const expectedLinesNorm = normalizedExpected.split(' ');

            const minLength = Math.min(outputLinesNorm.length, expectedLinesNorm.length);
            for (let i = 0; i < minLength; i++) {
                if (outputLinesNorm[i] !== expectedLinesNorm[i]) {
                    logTestResult(`差分が見つかりました (位置 ${i}):`, 2, 'error');
                    logTestResult(`  期待値: "${expectedLinesNorm[i]}"`, 2, 'error');
                    logTestResult(`  実際値: "${outputLinesNorm[i]}"`, 2, 'error');
                    break;
                }
            }

            if (outputLinesNorm.length !== expectedLinesNorm.length) {
                logTestResult(`行数が一致しません (期待値: ${expectedLinesNorm.length}, 実際値: ${outputLinesNorm.length})`, 2, 'error');
            }
        }
    }

    return isMatch;
}

/**
 * 全テストを実行する関数
 */
async function runAllTests(): Promise<void> {
    try {
        logTestResult('短期滞在手術等基本料３判定プログラムのテストを開始します', 1);
        console.log('-'.repeat(80));

        // 1. サンプルファイルを読み込む
        logTestResult(`テストファイル: ${TEST_CONFIG.sampleFiles.map(f => path.basename(f)).join(', ')}`, 1);

        // 2. 期待される結果を読み込む
        const expectedContent = await readTestFile(TEST_CONFIG.expectedFile);
        const headerLine = expectedContent.split(/\r?\n/)[0];
        logTestResult(`期待される結果ファイル: ${path.basename(TEST_CONFIG.expectedFile)}`, 1);

        // 3. 各ファイルをパース
        const parsedCases: CaseData[][] = [];
        for (const filePath of TEST_CONFIG.sampleFiles) {
            const cases = await testParseFile(filePath);
            parsedCases.push(cases);
        }

        // 4. パースしたデータを統合
        let mergedCases: CaseData[];
        if (parsedCases.length > 1) {
            mergedCases = testMergeCases(parsedCases[0], parsedCases[1]);
            // 3つ以上のファイルがある場合は順次統合
            for (let i = 2; i < parsedCases.length; i++) {
                mergedCases = testMergeCases(mergedCases, parsedCases[i]);
            }
        } else {
            mergedCases = parsedCases[0];
            logTestResult(`統合処理をスキップしました（ファイルは1つのみ）`, 2);
        }

        // 5. 短手３該当症例を判定
        const resultCases = testEvaluateCases(mergedCases);

        // 6. 結果をフォーマット
        const outputText = testFormatResults(resultCases, headerLine);

        // 7. 期待される結果と比較
        const isSuccess = testCompareResults(outputText, expectedContent);

        // 8. テスト結果のサマリーを出力
        console.log('-'.repeat(80));
        if (isSuccess) {
            logTestResult('全テストが成功しました！', 1, 'success');
        } else {
            logTestResult('テストに失敗しました。上記のエラーを確認してください。', 1, 'error');
            process.exit(1);
        }
    } catch (error) {
        logTestResult(`テスト実行中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`, 1, 'error');
        if (error instanceof Error && error.stack) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

// テストを実行
runAllTests();