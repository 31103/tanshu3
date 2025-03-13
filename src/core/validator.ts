import { FileValidationResult } from '../types/types';

/**
 * ファイルのバリデーションを実行する関数
 * @param files バリデーション対象のファイル配列
 * @returns 検証結果の配列
 */
export async function validateFiles(files: File[]): Promise<FileValidationResult[]> {
    if (!files || files.length === 0) {
        throw new Error('ファイルが選択されていません');
    }

    // 検証結果の配列
    const validationResults: FileValidationResult[] = [];

    // 各ファイルを検証
    for (const file of files) {
        try {
            const content = await readFileAsText(file);
            const result = validateFileContent(file, content);
            validationResults.push(result);
        } catch (error) {
            // ファイル読み込みエラーの場合
            validationResults.push({
                file,
                isValid: false,
                warnings: [],
                errors: [(error as Error).message || '不明なエラーが発生しました']
            });
        }
    }

    return validationResults;
}

/**
 * ファイルをテキストとして読み込む
 * @param file 読み込むファイル
 * @returns ファイルの内容
 */
export function readFileAsText(file: File): Promise<string> {
    // テキストファイルでない場合はエラー
    if (!file.type.includes('text') && !file.name.endsWith('.txt')) {
        return Promise.reject(new Error('Read error: Invalid file format'));
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = event => {
            if (typeof event.target?.result === 'string') {
                resolve(event.target.result);
            } else {
                reject(new Error('Read error: Invalid file format'));
            }
        };

        reader.onerror = () => {
            reject(new Error('Read error: File read failed'));
        };

        try {
            reader.readAsText(file);
        } catch (error) {
            reject(new Error('Read error: Cannot start reading file'));
        }
    });
}

/**
 * ファイルの内容を検証する
 * @param file ファイルオブジェクト
 * @param content ファイルの内容
 * @returns 検証結果
 */
export function validateFileContent(file: File, content: string): FileValidationResult {
    // 検証結果オブジェクト
    const result: FileValidationResult = {
        file,
        isValid: true,
        warnings: [],
        errors: []
    };

    // 内容が空の場合
    if (!content.trim()) {
        result.isValid = false;
        result.errors.push('ファイルが空です');
        return result;
    }

    // 行に分割（CRLFとLFの両方に対応）
    const lines = content.split(/\r?\n/).filter(line => line.trim());

    // ファイルに最低2行（ヘッダー行 + データ行）あるかチェック
    if (lines.length < 2) {
        result.isValid = false;
        result.errors.push('ファイルが空か、データが不足しています');
        return result;
    }

    // ヘッダー行の検証（存在確認のみ）
    const headerLine = lines[0].trim();
    if (!headerLine) {
        result.warnings.push('ヘッダー行が空です');
    }

    // ヘッダー行の推奨フィールドチェック（警告のみ）
    const expectedHeaders = ['施設コード', 'データ識別番号', '退院年月日', '入院年月日', 'データ区分'];
    const headerFields = headerLine.split(/\t/);
    const missingFields = expectedHeaders.filter(field => !headerFields.includes(field));

    if (missingFields.length > 0) {
        result.warnings.push(`推奨ヘッダーフィールドが不足しています: ${missingFields.join(', ')}`);
    }

    // データ行のサンプリング（最大で10行をチェック）
    const sampleSize = Math.min(10, lines.length - 1);
    let validLineCount = 0;
    let invalidLineCount = 0;
    let columnsCountWarning = false;

    // データ行の検証
    for (let i = 1; i <= sampleSize; i++) {
        const line = lines[i].trim();
        if (!line) continue; // 空行はスキップ

        // タブ区切りでデータを分割
        const columns = line.split(/\t/);

        // 最低限必要な列数（10列）をチェック - 警告レベル
        if (columns.length < 10) {
            if (!columnsCountWarning) {
                result.warnings.push(`一部の行に必要な列数（10列以上）がありません。（最初の例：行 ${i + 1}, 列数: ${columns.length}）`);
                columnsCountWarning = true;
            }
            continue;
        }

        // データ識別番号のチェック（列2）- 非空かつ10桁以内
        const dataId = columns[1].trim();
        if (!dataId || dataId.length > 10) {
            if (!result.warnings.some(w => w.includes('データ識別番号'))) {
                result.warnings.push(`一部の行のデータ識別番号が不適切です（空または10桁超）。（最初の例：行 ${i + 1}, 値: ${dataId}）`);
            }
        }

        // 日付形式のチェック（列3, 4）- 8桁の数字または00000000
        const discharge = columns[2].trim();
        const admission = columns[3].trim();
        const dateRegex = /^(\d{8}|00000000)$/;

        // 入退院日のチェック
        if (!dateRegex.test(admission)) {
            result.isValid = false;
            result.errors.push(`入院年月日が不正です（行 ${i + 1}, 値: ${admission}）`);
        }

        if (!dateRegex.test(discharge)) {
            // 退院未定（00000000）の場合は警告を出さない
            if (discharge !== '00000000') {
                result.warnings.push(`退院年月日の形式が不適切です（行 ${i + 1}, 値: ${discharge}）`);
            }
        }

        // データ区分のチェック（オプション）
        const dataCategory = columns[4].trim();
        if (!/^\d{1,2}$/.test(dataCategory)) {
            if (!result.warnings.some(w => w.includes('データ区分'))) {
                result.warnings.push(`一部の行のデータ区分が適切なフォーマット（2桁以内の数字）ではありません`);
            }
        }

        validLineCount++;
    }

    // 有効なデータ行の割合をチェック
    if (validLineCount === 0 && sampleSize > 0) {
        result.isValid = false;
        result.errors.push('有効なデータ行が見つかりません');
    }

    return result;
}