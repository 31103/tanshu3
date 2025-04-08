/**
 * 短期滞在手術等基本料３判定プログラム - パーサー関数
 * このファイルには、ファイル解析に関連する関数を含みます。
 */

import { CaseData, ProcedureDetail, RawCaseData } from './types.ts'; // ProcedureDetail をインポート
// import { TARGET_PROCEDURES } from './constants.ts'; // TARGET_PROCEDURES はここでは不要になる

/**
 * EFファイルの行からデータを抽出する共通関数
 * @param columns - データ列の配列
 * @returns 抽出されたデータ（基本情報 + 診療行為詳細）またはnull（データ不足またはEファイル行）
 */
function extractLineData(
  columns: string[],
): {
  dataId: string;
  admission: string;
  discharge: string;
  dataCategory: string; // データ区分 (列4) を追加
  procedureDetail: ProcedureDetail | null; // 診療行為詳細、Fファイルでなければnull
} | null {
  // 必須列（データ識別番号、入院日、退院日、データ区分、順序番号、行為明細番号、レセプトコード、実施日）の存在を確認
  if (columns.length < 24) { // 実施年月日(列24)まで必要
    return null;
  }

  const dataId = columns[1].trim();
  if (!dataId) return null;
  const admission = columns[3].trim();
  const discharge = columns[2].trim();
  const dataCategory = columns[4].trim(); // データ区分 (列4) を抽出
  const sequenceNumber = columns[5].trim(); // 順序番号 (列6)
  const actionDetailNo = columns[6].trim(); // 行為明細番号 (列7)
  const procedureCode = columns[8].trim(); // レセプト電算コード (列9)
  const procedureName = columns[10].trim(); // 診療明細名称 (列11)
  const procedureDate = columns[23].trim(); // 実施年月日 (列24)

  // 行為明細番号が"000"の行（Eファイル）はスキップ
  if (actionDetailNo === '000') {
    return null;
  }

  // Fファイルの場合、診療行為詳細を作成
  const procedureDetail: ProcedureDetail = {
    code: procedureCode,
    name: procedureName || '(名称なし)', // 名称が空の場合のデフォルト値
    date: procedureDate,
    sequenceNumber: sequenceNumber,
    dataCategory: dataCategory, // dataCategory を追加
  };

  return {
    dataId,
    admission,
    discharge,
    dataCategory, // dataCategory を返す
    procedureDetail, // Fファイルの詳細情報を返す
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
  const caseMap: Record<string, CaseData> = {}; // キーは複合キー (dataId_admission)

  for (let i = 1; i < lines.length; i++) { // ヘッダー行(i=0)をスキップ
    const line = lines[i].trim();
    if (!line) continue;

    try { // try...catch を元に戻す
      const columns = line.split('\t');
      const extractedData = extractLineData(columns); // 新しい抽出関数を使用

      if (extractedData) {
        // dataCategory も受け取るように修正
        const { dataId, admission, discharge, dataCategory, procedureDetail } = extractedData;
        const caseKey = `${dataId}_${admission}`;

        // 既存の症例データを取得または新規作成
        let currentCase = caseMap[caseKey];
        if (!currentCase) {
          currentCase = {
            id: dataId,
            admission: admission,
            discharge: discharge, // 初期値として設定
            procedureDetails: [], // procedureDetails を初期化
          };
          caseMap[caseKey] = currentCase;
        }

        // 退院日の更新ロジック (変更なし)
        if (
          discharge &&
          discharge !== '00000000' &&
          (!currentCase.discharge ||
            currentCase.discharge === '00000000' ||
            discharge > currentCase.discharge)
        ) {
          currentCase.discharge = discharge;
        }

        // 診療行為詳細を追加 (procedureDetail が null でない場合)
        if (procedureDetail) {
          // 重複チェック（コード、日付、順序番号がすべて一致する場合を重複とみなす）
          const isDuplicate = currentCase.procedureDetails.some(
            (pd) =>
              pd.code === procedureDetail.code &&
              pd.date === procedureDetail.date &&
              pd.sequenceNumber === procedureDetail.sequenceNumber &&
              pd.dataCategory === procedureDetail.dataCategory, // dataCategory も重複チェックに含める (念のため)
          );
          if (!isDuplicate) {
            currentCase.procedureDetails.push(procedureDetail);
          }
        }
      } // End of if (extractedData) block
    } // End of try block
    catch (error) { // try...catch を元に戻す
      // エラーログをより詳細に表示
      console.error(
        `Error processing line ${i + 1}: "${line}"\n`,
        error instanceof Error ? error.stack : String(error),
      );
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
export function mergeCases(existingCases: CaseData[], newCases: CaseData[]): CaseData[] { // 引数間にカンマを追加
  const caseMap: Record<string, CaseData> = {}; // キーは複合キー (dataId_admission)

  // 既存のケースをマップに追加
  for (const c of existingCases) {
    const caseKey = `${c.id}_${c.admission}`;
    caseMap[caseKey] = createSafeCase(c); // procedureDetails を初期化
  }

  // 新しいケースをマージ
  for (const c of newCases) {
    const caseKey = `${c.id}_${c.admission}`;
    const existingCase = caseMap[caseKey];
    if (existingCase) {
      updateExistingCase(existingCase, c); // 既存症例を更新
    } else {
      caseMap[caseKey] = createSafeCase(c); // 新しい症例を追加
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
  // 退院日の更新ロジック (変更なし)
  if (
    newCase.discharge &&
    newCase.discharge !== '00000000' &&
    (!currentCase.discharge ||
      currentCase.discharge === '00000000' ||
      newCase.discharge > currentCase.discharge)
  ) {
    currentCase.discharge = newCase.discharge;
  }

  // procedureDetails の初期化を確実に行う
  if (!Array.isArray(currentCase.procedureDetails)) {
    currentCase.procedureDetails = [];
  }

  // 新しい診療行為詳細を追加
  mergeProcedureDetails(currentCase, newCase); // 新しいマージ関数を呼び出す
}

/**
 * 安全な症例データオブジェクトを作成する
 * @param c - 元の症例データ
 * @returns procedureDetails が初期化された症例データ
 */
function createSafeCase(c: CaseData): CaseData {
  return {
    ...c,
    // procedureDetails を確実に配列として初期化し、コピーする
    procedureDetails: Array.isArray(c.procedureDetails) ? [...c.procedureDetails] : [],
  };
}

/**
 * 症例の診療行為詳細データを統合する (旧 mergeProcedures から変更)
 * @param currentCase - 統合先の症例データ
 * @param newCase - 統合元の症例データ
 */
function mergeProcedureDetails(currentCase: CaseData, newCase: CaseData): void {
  const newDetails = Array.isArray(newCase.procedureDetails) ? newCase.procedureDetails : [];

  for (const newDetail of newDetails) {
    // 重複チェック（コード、日付、順序番号がすべて一致する場合を重複とみなす）
    const isDuplicate = currentCase.procedureDetails.some(
      (existingDetail) =>
        existingDetail.code === newDetail.code &&
        existingDetail.date === newDetail.date &&
        existingDetail.sequenceNumber === newDetail.sequenceNumber &&
        existingDetail.dataCategory === newDetail.dataCategory, // dataCategory も重複チェックに含める (念のため)
    );

    if (!isDuplicate) {
      currentCase.procedureDetails.push(newDetail);
    }
  }
}
