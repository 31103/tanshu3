/**
 * 短期滞在手術等基本料３判定プログラム - パーサー関数
 * このファイルには、ファイル解析に関連する関数を含みます。
 */

import { CaseData, RawCaseData } from './types';

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

    return {
        dataId,
        discharge,
        admission,
        procedure
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
                const { dataId, discharge, admission, procedure } = caseData;

                // 同一患者のデータを統合
                if (!caseMap[dataId]) {
                    caseMap[dataId] = {
                        id: dataId,
                        admission: admission,
                        discharge: discharge,
                        procedures: []
                    };
                }

                // 手術コードを追加（重複を避ける）
                if (procedure && !caseMap[dataId].procedures.includes(procedure)) {
                    caseMap[dataId].procedures.push(procedure);
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
        caseMap[c.id] = { ...c, procedures: [...c.procedures] };
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

            // 新しい手術コードを追加（重複を避ける）
            if (c.procedures && Array.isArray(c.procedures)) {
                for (const proc of c.procedures) {
                    if (!caseMap[c.id].procedures.includes(proc)) {
                        caseMap[c.id].procedures.push(proc);
                    }
                }
            }
        } else {
            // 新しい症例を追加
            caseMap[c.id] = { ...c, procedures: [...c.procedures] };
        }
    }

    return Object.values(caseMap);
} 