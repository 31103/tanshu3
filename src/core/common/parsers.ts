/**
 * 短期滞在手術等基本料３判定プログラム - パーサー関数
 * このファイルには、ファイル解析に関連する関数を含みます。
 */

import { CaseData, ProcedureDetail, RawCaseData } from './types.ts'; // ProcedureDetail をインポート
// import { TARGET_PROCEDURES } from './constants.ts'; // TARGET_PROCEDURES はここでは不要になる

/**
 * EFファイルの行からデータを抽出する共通関数
 * @param columns - データ列の配列
 * @param lineNumber - ファイル内の行番号 (1始まり、警告表示用)
 * @returns 抽出されたデータ（基本情報 + 診療行為詳細）またはnull（データ不足、形式不正、またはEファイル行）
 */
function extractLineData(
  columns: string[],
  lineNumber: number, // 行番号を引数に追加
): {
  dataId: string;
  admission: string;
  discharge: string;
  dataCategory: string; // データ区分 (列4) を追加
  procedureDetail: ProcedureDetail | null; // 診療行為詳細、Fファイルでなければnull
} | null {
  // 列数チェック (最低限必要な列数)
  if (columns.length < 24) {
    // console.warn(`[Parser Warn] Line ${lineNumber}: Skipped due to insufficient columns (${columns.length} < 24).`); // 通知は parseEFFile で集約
    return null;
  }

  // --- 必須項目と形式のチェック ---
  const dataId = columns[1]?.trim(); // ?. を使用して安全にアクセス
  const admission = columns[3]?.trim();
  const discharge = columns[2]?.trim();
  const dataCategory = columns[4]?.trim();
  const sequenceNumber = columns[5]?.trim();
  const actionDetailNo = columns[6]?.trim();
  const procedureCode = columns[8]?.trim();
  const procedureName = columns[10]?.trim(); // 必須ではないが取得
  const procedureDate = columns[23]?.trim();

  const dateRegex = /^\d{8}$/; // YYYYMMDD形式
  const numberRegex = /^\d+$/; // 数値形式

  // 必須項目チェック (主要なもの)
  if (
    !dataId || !admission || !discharge || !dataCategory || !sequenceNumber || !actionDetailNo ||
    !procedureCode || !procedureDate
  ) {
    // console.warn(`[Parser Warn] Line ${lineNumber}: Skipped due to missing required field(s).`); // 通知は parseEFFile で集約
    return null;
  }

  // 形式チェック
  if (
    !(dateRegex.test(admission) || admission === '00000000') ||
    !(dateRegex.test(discharge) || discharge === '00000000') ||
    !(dateRegex.test(procedureDate) || procedureDate === '00000000')
  ) {
    // console.warn(`[Parser Warn] Line ${lineNumber}: Skipped due to invalid date format.`); // 通知は parseEFFile で集約
    return null;
  }
  if (!numberRegex.test(sequenceNumber) || !numberRegex.test(actionDetailNo)) {
    // console.warn(`[Parser Warn] Line ${lineNumber}: Skipped due to invalid number format for sequence/action number.`); // 通知は parseEFFile で集約
    return null;
  }
  // dataCategory, procedureCode は特定の形式チェックは一旦保留 (文字列として扱う)

  // --- チェックここまで ---

  // 行為明細番号が"000"の行（Eファイル）はスキップ
  if (actionDetailNo === '000') {
    // Eファイル行はエラーではないので警告は出さない
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
  const skippedLines: { lineNumber: number; reason: string; lineContent: string }[] = []; // スキップされた行の情報

  for (let i = 1; i < lines.length; i++) { // ヘッダー行(i=0)をスキップ
    const lineNumber = i + 1; // 1始まりの行番号
    const line = lines[i].trim();
    if (!line) continue; // 空行はスキップ

    try {
      const columns = line.split('\t');
      const extractedData = extractLineData(columns, lineNumber); // 行番号を渡す

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
      } else {
        // extractLineData が null を返した場合（検証失敗またはEファイル行）
        // Eファイル行は警告対象外とするため、ここで明示的な警告は出さない
        // (extractLineData内で警告済み、または警告不要)
        // 警告を出す場合は理由を特定する必要がある
        const columns = line.split('\t');
        if (columns.length < 24) {
          skippedLines.push({
            lineNumber,
            reason: `Insufficient columns (${columns.length} < 24)`,
            lineContent: line,
          });
        } else if (columns[6]?.trim() !== '000') { // Eファイル行以外で検証に失敗した場合
          skippedLines.push({
            lineNumber,
            reason: 'Invalid data format or missing required field',
            lineContent: line,
          });
        }
      }
    } catch (error) {
      // エラーログをより詳細に表示
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(
        `[Parser Error] Error processing line ${lineNumber}: "${line}"\n`,
        error instanceof Error ? error.stack : errorMessage,
      );
      skippedLines.push({ lineNumber, reason: `Error: ${errorMessage}`, lineContent: line }); // エラーが発生した行を記録
      continue; // エラーが発生しても次の行へ
    }
  }

  // 処理終了後にスキップされた行の情報を警告として表示 (仮実装)
  if (skippedLines.length > 0) {
    console.warn(
      `[Parser Summary] Skipped ${skippedLines.length} lines due to errors or validation issues:`,
    );
    skippedLines.forEach((skip) => {
      // 行内容はデバッグ時以外は冗長なので省略
      console.warn(`  - Line ${skip.lineNumber}: ${skip.reason}`);
    });
    // TODO: ここで NotificationSystem を使ってユーザーに通知する
    // 例: notificationSystem.warn(`ファイル処理中に ${skippedLines.length} 行がスキップされました。詳細は開発者コンソールを確認してください。`);
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
