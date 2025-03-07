/**
 * 短期滞在手術等基本料３判定プログラム - パーサー関数
 * このファイルには、ファイル解析に関連する関数を含みます。
 */

import { CaseData, RawCaseData, ValidationResult } from './types';

/**
 * EFファイルの行からデータを抽出する共通関数
 * @param columns - データ列の配列
 * @returns 患者データまたはnull（データが不十分な場合）
 */
function extractCaseData(columns: string[]): RawCaseData | null {
    // 少なくとも9列（レセプト電算コードまで）必要
    if (columns.length < 9) return null;

    const dataId = columns[1].trim(); // データ識別番号
    if (!dataId) return null; // 識別番号がない場合は無効

    const discharge = columns[2].trim(); // 退院年月日
    const admission = columns[3].trim(); // 入院年月日
    const procedure = columns[8].trim(); // レセプト電算コード

    // 診療明細名称（10列目、存在する場合のみ）
    const procedureName = columns.length > 9 ? columns[9].trim() : undefined;

    return {
        dataId,
        discharge,
        admission,
        procedure,
        procedureName
    };
}

/**
 * 入院EF統合ファイルの内容をパースする関数
 * ファイルの内容を解析し、患者ごとのデータを抽出します
 * @param content - ファイルの内容
 * @returns 患者データの配列
 */
export function parseEFFile(content: string): CaseData[] {
    const lines = content.split(/\r?\n/);
    const caseMap: Record<string, CaseData> = {}; // 同一患者の情報を一時的に保持するためのマップ

    // ヘッダー行を除いたデータ行を処理
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // 空行をスキップ

        try {
            let caseData: RawCaseData | null = null;

            // パイプ区切りの場合
            if (line.includes('|')) {
                const parts = line.split('|');
                if (parts.length >= 2) {
                    // パイプの右側のデータを取得してタブ区切りで分割
                    const dataStr = parts[1].trim();
                    const columns = dataStr.split('\t');
                    caseData = extractCaseData(columns);
                }
            } else {
                // タブ区切りの場合（元のファイル形式）
                const columns = line.split('\t');
                caseData = extractCaseData(columns);
            }

            if (caseData) {
                const { dataId, discharge, admission, procedure, procedureName } = caseData;

                // 同一患者のデータを統合
                if (!caseMap[dataId]) {
                    caseMap[dataId] = {
                        id: dataId,
                        admission: admission,
                        discharge: discharge,
                        procedures: [],
                        procedureNames: []
                    };
                }

                // 手術コードを追加（重複を避ける）
                if (procedure && !caseMap[dataId].procedures.includes(procedure)) {
                    caseMap[dataId].procedures.push(procedure);
                    // 診療明細名称も同じインデックスで追加
                    if (procedureName) {
                        // procedureNamesが未定義の場合は初期化
                        if (!caseMap[dataId].procedureNames) {
                            caseMap[dataId].procedureNames = [];
                        }
                        caseMap[dataId].procedureNames.push(procedureName);
                    }
                }
            }
        } catch (error) {
            // 解析エラーの場合はその行をスキップして続行
            console.error(`Line ${i + 1}の解析中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
            continue;
        }
    }

    // マップから配列に変換
    return Object.values(caseMap);
}

/**
 * 複数ファイルからの症例データを統合する関数
 * 同一IDの症例については、退院日が更新されている場合に差し替え、手術コードは統合します
 * @param existingCases - 既存の症例データ
 * @param newCases - 新しい症例データ
 * @returns 統合された症例データ
 */
export function mergeCases(existingCases: CaseData[], newCases: CaseData[]): CaseData[] {
    const caseMap: Record<string, CaseData> = {};

    // 既存のケースをマップに追加
    for (const c of existingCases) {
        caseMap[c.id] = {
            ...c,
            procedures: [...c.procedures],
            procedureNames: c.procedureNames ? [...c.procedureNames] : []
        };
    }

    // 新しいケースをマージ
    for (const c of newCases) {
        if (caseMap[c.id]) {
            // 退院日が確定した場合（00000000 から具体的な日付に変わった場合）
            if (c.discharge !== '00000000') {
                caseMap[c.id].discharge = c.discharge;
            }

            // 手術コードを統合（存在しない場合は初期化）
            if (!caseMap[c.id].procedures) {
                caseMap[c.id].procedures = [];
            }

            // 診療明細名称を統合（存在しない場合は初期化）
            if (!caseMap[c.id].procedureNames) {
                caseMap[c.id].procedureNames = [];
            }

            // 新しい手術コードと診療明細名称を追加（重複を避ける）
            if (c.procedures && Array.isArray(c.procedures)) {
                for (let i = 0; i < c.procedures.length; i++) {
                    const proc = c.procedures[i];
                    if (!caseMap[c.id].procedures.includes(proc)) {
                        caseMap[c.id].procedures.push(proc);

                        // 対応する診療明細名称も追加（存在する場合）
                        const procedureNames = caseMap[c.id].procedureNames || [];
                        if (c.procedureNames && Array.isArray(c.procedureNames) && i < c.procedureNames.length) {
                            procedureNames.push(c.procedureNames[i]);
                        }
                        caseMap[c.id].procedureNames = procedureNames;
                    }
                }
            }
        } else {
            // 新しい症例を追加
            caseMap[c.id] = {
                ...c,
                procedures: [...c.procedures],
                procedureNames: c.procedureNames ? [...c.procedureNames] : []
            };
        }
    }

    return Object.values(caseMap);
}

/**
 * 入院統合EFファイルのフォーマットを検証する関数
 * @param content - ファイルの内容
 * @returns 検証結果オブジェクト
 */
export function validateEFFile(content: string): ValidationResult {
    // 初期の検証結果
    const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: []
    };

    // 1. ファイルが空でないかチェック
    if (!content || content.trim() === '') {
        result.isValid = false;
        result.errors.push('ファイルが空です。');
        return result;
    }

    const lines = content.split(/\r?\n/);

    // 2. 少なくとも2行あるかチェック（ヘッダー行 + データ行）
    if (lines.length < 2) {
        result.isValid = false;
        result.errors.push('ファイルに少なくともヘッダー行とデータ行が含まれていません。');
        return result;
    }

    // 3. ヘッダー行の存在チェック
    const headerLine = lines[0].trim();
    if (!headerLine) {
        result.warnings.push('ヘッダー行が空です。');
    }

    // データ行のサンプリング（最大で10行をチェック）
    const sampleSize = Math.min(10, lines.length - 1);
    let validLineCount = 0;
    let invalidLineCount = 0;
    let columnsCountWarning = false;

    for (let i = 1; i <= sampleSize; i++) {
        const line = lines[i].trim();
        if (!line) continue; // 空行はスキップ

        // タブ区切りでデータを分割
        let columns: string[] = [];
        if (line.includes('|')) {
            const parts = line.split('|');
            if (parts.length >= 2) {
                columns = parts[1].trim().split('\t');
            } else {
                columns = [];
            }
        } else {
            columns = line.split('\t');
        }

        // 4. 必要な列数があるかチェック（最低30列必要）
        if (columns.length < 30) {
            invalidLineCount++;
            if (!columnsCountWarning) {
                result.warnings.push(`一部の行に必要な列数（30列以上）がありません。（最初の例：行 ${i + 1}, 列数: ${columns.length}）`);
                columnsCountWarning = true;
            }
            continue;
        }

        // 5. 施設コードのフォーマットチェック（列1）- 9桁の数字
        const facilityCode = columns[0].trim();
        if (!/^\d{9}$/.test(facilityCode)) {
            invalidLineCount++;
            if (!result.warnings.some(w => w.includes('施設コード'))) {
                result.warnings.push(`一部の行の施設コードが適切なフォーマット（9桁の数字）ではありません。（最初の例：行 ${i + 1}, 値: ${facilityCode}）`);
            }
        }

        // 6. データ識別番号のフォーマットチェック（列2）- 非空かつ10桁以内
        const dataId = columns[1].trim();
        if (!dataId || dataId.length > 10) {
            invalidLineCount++;
            if (!result.warnings.some(w => w.includes('データ識別番号'))) {
                result.warnings.push(`一部の行のデータ識別番号が不適切です（空または10桁超）。（最初の例：行 ${i + 1}, 値: ${dataId}）`);
            }
        }

        // 7. 退院年月日と入院年月日のフォーマットチェック（列3, 4）- 8桁の数字または00000000
        const discharge = columns[2].trim();
        const admission = columns[3].trim();
        const dateRegex = /^(\d{8}|00000000)$/;

        if (!dateRegex.test(discharge)) {
            invalidLineCount++;
            if (!result.warnings.some(w => w.includes('退院年月日'))) {
                result.warnings.push(`一部の行の退院年月日が適切なフォーマット（8桁の数字または00000000）ではありません。（最初の例：行 ${i + 1}, 値: ${discharge}）`);
            }
        }

        if (!dateRegex.test(admission)) {
            invalidLineCount++;
            if (!result.warnings.some(w => w.includes('入院年月日'))) {
                result.warnings.push(`一部の行の入院年月日が適切なフォーマット（8桁の数字または00000000）ではありません。（最初の例：行 ${i + 1}, 値: ${admission}）`);
            }
        }

        // 8. データ区分のフォーマットチェック（列5）- 2桁以内の数字
        const dataCategory = columns[4].trim();
        if (!/^\d{1,2}$/.test(dataCategory)) {
            invalidLineCount++;
            if (!result.warnings.some(w => w.includes('データ区分'))) {
                result.warnings.push(`一部の行のデータ区分が適切なフォーマット（2桁以内の数字）ではありません。（最初の例：行 ${i + 1}, 値: ${dataCategory}）`);
            }
        }

        // 有効な行としてカウント
        validLineCount++;
    }

    // 9. 有効なデータ行の割合をチェック
    if (validLineCount === 0 && sampleSize > 0) {
        result.isValid = false;
        result.errors.push('サンプリングした行の中に有効なデータ行がありませんでした。ファイルフォーマットが入院統合EFファイルの仕様に合っていない可能性があります。');
    } else if (invalidLineCount > validLineCount) {
        result.warnings.push('無効なデータ行が有効な行より多く見つかりました。ファイルの内容を確認してください。');
    }

    return result;
} 