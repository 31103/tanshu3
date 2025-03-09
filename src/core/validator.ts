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
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = event => {
            if (typeof event.target?.result === 'string') {
                resolve(event.target.result);
            } else {
                reject(new Error(`ファイル「${file.name}」のフォーマットが不正です`));
            }
        };

        reader.onerror = error => {
            reject(new Error(`ファイル「${file.name}」の読み込み中にエラーが発生しました: ${error}`));
        };

        try {
            reader.readAsText(file);
        } catch (error) {
            reject(new Error(`ファイル「${file.name}」の読み込みを開始できませんでした: ${error}`));
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

    // 行に分割
    const lines = content.split('\n');

    // ヘッダー行の検証
    if (lines.length < 2) {
        result.isValid = false;
        result.errors.push('ファイルが空か、データが不足しています');
    } else {
        const headerLine = lines[0];

        // ヘッダーに必要なフィールドが含まれているか確認
        if (!headerLine.includes('患者ID') || !headerLine.includes('入院日')) {
            result.isValid = false;
            result.errors.push('必須フィールド（患者ID、入院日など）がヘッダーにありません');
        }

        // データ行の検証（サンプルとして最初の10行をチェック）
        const dataLines = lines.slice(1, Math.min(11, lines.length));
        let emptyLineCount = 0;
        let invalidFormatCount = 0;

        dataLines.forEach(line => {
            if (!line.trim()) {
                emptyLineCount++;
            } else if (line.split(',').length < 5) { // 最低限必要なフィールド数
                invalidFormatCount++;
            }
        });

        // 警告の追加
        if (emptyLineCount > 0) {
            result.warnings.push(`空の行が${emptyLineCount}行あります`);
        }

        if (invalidFormatCount > 0) {
            result.warnings.push(`フォーマットが不正な行が${invalidFormatCount}行あります`);
            if (invalidFormatCount > dataLines.length / 2) {
                result.isValid = false;
                result.errors.push('データ形式が正しくない可能性があります');
            }
        }
    }

    return result;
}