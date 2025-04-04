/**
 * 短期滞在手術等基本料３判定プログラム - パーサー関数
 * このファイルには、ファイル解析に関連する関数を含みます。
 */

import { CaseData, RawCaseData } from './types';
import { TARGET_PROCEDURES } from './constants';

/**
 * EFファイルの行からデータを抽出する共通関数
 * @param columns - データ列の配列
 * @returns 患者データ（対象手術の場合は完全、それ以外は基本情報のみ）またはnull（データが不十分な場合）
 */
function extractCaseData(
  columns: string[],
):
  | (RawCaseData & { procedure: string; procedureName: string | null })
  | { dataId: string; admission: string; discharge: string; procedure: null; procedureName: null }
  | null {
  // 少なくとも基本情報（ID, 入院日, 退院日）を含む列が必要
  if (columns.length < 4) {
    return null;
  }

  const dataId = columns[1].trim();
  if (!dataId) {
    return null;
  }
  const admission = columns[3].trim();
  const discharge = columns[2].trim();

  // 行為明細番号を取得 (列が存在する場合のみ)
  const actionDetailNo = columns.length > 6 ? columns[6].trim() : null;

  // 行為明細番号が"000"の行（Eファイル）は日付更新にも不要なためスキップ
  if (actionDetailNo === '000') {
    return null;
  }

  // 基本情報
  const basicInfo = { dataId, admission, discharge };

  // レセプト電算コードと診療明細名称を取得 (列が存在する場合のみ)
  const procedure = columns.length > 8 ? columns[8].trim() : null;
  const procedureName = columns.length > 10 ? columns[10].trim() : null;

  // 短手3の対象手術かどうかを判定
  if (!procedure || !TARGET_PROCEDURES.includes(procedure)) {
    // 対象手術でなくても基本情報は返す（日付更新のため）
    return { ...basicInfo, procedure: null, procedureName: null };
  }

  // 対象手術の場合、完全な情報を返す
  // RawCaseData型にキャストして返す (procedureはstringであることが保証されている)
  // procedureNameがnullの場合もデフォルト値を設定し、string型を保証
  return {
    ...basicInfo,
    procedure: procedure, // procedure is guaranteed to be string here
    procedureName: procedureName ?? '(名称なし)', // Ensure string type for RawCaseData compatibility
  };
}

/**
 * 入院EF統合ファイルの内容をパースする関数
 * ファイルの内容を解析し、患者ごとのデータを抽出します
 * @param content - ファイルの内容
 * @returns 統合前の症例データ配列
 */
export function parseEFFile(content: string): CaseData[] {
  const lines = content.split(/\r?\n/);
  // キーを複合キー (dataId_admission) に変更
  const caseMap: Record<string, CaseData> = {};

  // ヘッダー行を除いたデータ行を処理
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      continue;
    }

    try {
      const columns = line.split('\t');
      const extractedData = extractCaseData(columns);

      if (extractedData) {
        const { dataId, discharge, admission, procedure, procedureName } = extractedData;

        // 複合キーを作成
        const caseKey = `${dataId}_${admission}`;

        // 既存の症例データを取得または新規作成 (複合キーを使用)
        let currentCase = caseMap[caseKey];
        if (!currentCase) {
          currentCase = {
            id: dataId,
            admission: admission,
            discharge: discharge, // 初期値として設定
            procedures: [],
            procedureNames: [],
          };
          caseMap[caseKey] = currentCase;
        }

        // 退院日の更新 (00000000 でなく、既存より新しい日付の場合)
        // この症例 (複合キーで特定) の退院日を更新
        if (
          discharge &&
          discharge !== '00000000' &&
          (!currentCase.discharge ||
            currentCase.discharge === '00000000' ||
            discharge > currentCase.discharge)
        ) {
          currentCase.discharge = discharge;
        }

        // 対象手術コードと名称を追加（procedureがnullでない場合のみ）
        // この症例 (複合キーで特定) の手術リストに追加
        if (procedure && !currentCase.procedures.includes(procedure)) {
          currentCase.procedures.push(procedure);
          if (!currentCase.procedureNames) {
            currentCase.procedureNames = [];
          }
          currentCase.procedureNames.push(procedureName ?? '(名称なし)');
        }
      }
    } catch {
      // エラーが発生しても処理を継続するが、ログは残さない
      continue;
    }
  }

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
  // キーを複合キー (dataId_admission) に変更
  const caseMap: Record<string, CaseData> = {};

  // 既存のケースをマップに追加 (複合キーを使用)
  for (const c of existingCases) {
    const caseKey = `${c.id}_${c.admission}`;
    caseMap[caseKey] = createSafeCase(c); // 既存データも安全にコピー
  }

  // 新しいケースをマージ (複合キーを使用)
  for (const c of newCases) {
    const caseKey = `${c.id}_${c.admission}`;
    if (caseMap[caseKey]) {
      // 既存症例の更新処理 (複合キーで特定された症例を更新)
      updateExistingCase(caseMap[caseKey], c);
    } else {
      // 新しい症例を追加 (複合キーでマップに追加)
      caseMap[caseKey] = createSafeCase(c);
    }
  }

  return Object.values(caseMap);
}

/**
 * 既存の症例データを新しいデータで更新する
 * @param currentCase - 更新対象の症例データ
 * @param newCase - 新しい症例データ
 */
function updateExistingCase(currentCase: CaseData, newCase: CaseData): void {
  // 退院日が確定した場合（00000000 から具体的な日付に変わった場合）
  // または、より新しい退院日が来た場合 (YYYYMMDD形式なので文字列比較でOK)
  if (
    newCase.discharge &&
    newCase.discharge !== '00000000' &&
    (!currentCase.discharge ||
      currentCase.discharge === '00000000' ||
      newCase.discharge > currentCase.discharge)
  ) {
    currentCase.discharge = newCase.discharge;
  }

  // procedures と procedureNames の初期化を確実に行う
  if (!Array.isArray(currentCase.procedures)) {
    currentCase.procedures = [];
  }
  if (!Array.isArray(currentCase.procedureNames)) {
    currentCase.procedureNames = [];
  }

  // 新しい手術コードを追加
  mergeProcedures(currentCase, newCase);
}

/**
 * 安全な症例データオブジェクトを作成する
 * @param c - 元の症例データ
 * @returns 配列が初期化された症例データ
 */
function createSafeCase(c: CaseData): CaseData {
  return {
    ...c,
    procedures: Array.isArray(c.procedures) ? [...c.procedures] : [],
    procedureNames: Array.isArray(c.procedureNames) ? [...c.procedureNames] : [],
  };
}

/**
 * 症例の処置データを統合する
 * @param currentCase - 統合先の症例データ
 * @param newCase - 統合元の症例データ
 */
function mergeProcedures(currentCase: CaseData, newCase: CaseData): void {
  // 新しい手術コードを追加（重複を避ける）
  const procedures = Array.isArray(newCase.procedures) ? newCase.procedures : [];
  const procedureNames = Array.isArray(newCase.procedureNames) ? newCase.procedureNames : [];

  for (let i = 0; i < procedures.length; i++) {
    const proc = procedures[i];
    if (!currentCase.procedures.includes(proc)) {
      currentCase.procedures.push(proc);

      // procedureNamesが未定義の場合は初期化
      if (!currentCase.procedureNames) {
        currentCase.procedureNames = [];
      }
      // 対応する手術名も追加（存在しない場合はデフォルト値）
      currentCase.procedureNames.push(procedureNames[i] ?? '(名称なし)');
    }
  }
}
