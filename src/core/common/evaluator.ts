/**
 * 短期滞在手術等基本料３判定プログラム - 評価ロジック
 * このファイルには、短手３該当症例の判定などの評価ロジックを含みます。
 */

import { CaseData, OutputSettings, ProcedureDetail } from './types.ts'; // ProcedureDetail をインポート
import { calculateHospitalDays, formatDate } from './utils.ts';
import {
  COLONOSCOPY_PROCEDURE_CODES,
  COLONOSCOPY_SPECIAL_ADDITIONS,
  DEFAULT_RESULT_HEADER,
  INELIGIBILITY_REASONS,
  MAX_HOSPITAL_DAYS,
  PROCEDURE_NAME_MAP,
  TARGET_PROCEDURES,
} from './constants.ts';

/**
 * 短手３該当症例を判定する関数
 * 各症例が短期滞在手術等基本料３の条件に該当するかを判定します
 * @param cases - 判定対象の症例データ
 * @returns 短手３に該当する症例データ（ID昇順でソート済み）
 */
export function evaluateCases(cases: CaseData[]): CaseData[] {
  const evaluatedCases = cases.map((c) => {
    try {
      // 評価結果を格納するオブジェクトを作成（元のオブジェクトをコピー）
      const evaluatedCase: CaseData = {
        ...c,
        procedureDetails: [...c.procedureDetails], // 配列をコピー
      };

      // 1. 退院日チェック (変更なし)
      if (!c.discharge || c.discharge === '00000000') {
        evaluatedCase.isEligible = false;
        evaluatedCase.reason = INELIGIBILITY_REASONS.UNDISCHARGED;
        return evaluatedCase;
      }

      // 2. 対象手術等の実施チェック (procedureDetails を使用)
      const targetProcedureDetails = c.procedureDetails.filter((pd) =>
        TARGET_PROCEDURES.includes(pd.code)
      );

      if (targetProcedureDetails.length === 0) {
        evaluatedCase.isEligible = false;
        evaluatedCase.reason = INELIGIBILITY_REASONS.NO_TARGET_PROCEDURE;
        return evaluatedCase;
      }

      // 3. 入院期間チェック (変更なし)
      const hospitalDays = calculateHospitalDays(c.admission, c.discharge);
      if (hospitalDays === null || hospitalDays > MAX_HOSPITAL_DAYS) {
        evaluatedCase.isEligible = false;
        evaluatedCase.reason = INELIGIBILITY_REASONS.HOSPITAL_DAYS_EXCEEDED;
        return evaluatedCase;
      }

      // 4. 複数種類の対象手術等チェック (procedureDetails を使用)
      if (targetProcedureDetails.length > 1) {
        const uniqueTargetProcedureCodes = new Set(targetProcedureDetails.map((pd) => pd.code));
        if (uniqueTargetProcedureCodes.size > 1) {
          evaluatedCase.isEligible = false;
          evaluatedCase.reason = INELIGIBILITY_REASONS.MULTIPLE_TARGET_PROCEDURES;
          return evaluatedCase;
        }
      }

      // 5. 内視鏡的大腸ポリープ・粘膜切除術の特定加算チェック (procedureDetails を使用)
      const hasColonoscopy = c.procedureDetails.some((pd) =>
        COLONOSCOPY_PROCEDURE_CODES.includes(pd.code)
      );
      const hasSpecialAddition = c.procedureDetails.some((pd) =>
        COLONOSCOPY_SPECIAL_ADDITIONS.includes(pd.code)
      );
      if (hasColonoscopy && hasSpecialAddition) {
        evaluatedCase.isEligible = false;
        evaluatedCase.reason = INELIGIBILITY_REASONS.SPECIAL_ADDITION;
        return evaluatedCase;
      }

      // 6. 他の手術の実施チェック (データ区分 '50' かつ コード '15' 始まり)
      const otherSurgeryDetails = c.procedureDetails.filter((pd) => {
        // データ区分が '50' (手術関連) かつ
        // コードが '15' で始まり (手術手技料) かつ
        // 短手３対象手術ではないものを抽出
        return pd.dataCategory === '50' &&
          pd.code.startsWith('15') &&
          !TARGET_PROCEDURES.includes(pd.code);
      });

      // 上記条件を満たす「他の手術手技料」が存在すれば、対象外とする
      if (otherSurgeryDetails.length > 0) {
        evaluatedCase.isEligible = false;
        evaluatedCase.reason = INELIGIBILITY_REASONS.OTHER_SURGERY;
        return evaluatedCase;
      }

      // すべての条件を満たす場合は短手３対象症例
      evaluatedCase.isEligible = true;
      // 実施された対象手術の名称を理由として設定 (最初の対象手術を使用)
      const firstTargetCode = targetProcedureDetails[0]?.code;
      evaluatedCase.reason = firstTargetCode
        ? PROCEDURE_NAME_MAP[firstTargetCode] || '対象手術等'
        : '対象手術等'; // fallback

      return evaluatedCase;
    } catch (error) {
      console.error( // エラーログ改善
        `症例 ${c.id} (入院日: ${c.admission}) の評価中にエラー:`,
        error instanceof Error ? error.stack : String(error),
      );
      return {
        ...c, // 元のデータを保持
        procedureDetails: [...c.procedureDetails], // 配列をコピー
        isEligible: false,
        reason: `評価エラー: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  });

  // ID順にソート (変更なし)
  return evaluatedCases.sort((a, b) => {
    // IDで比較
    const idCompare = a.id.localeCompare(b.id);
    if (idCompare !== 0) return idCompare;
    // IDが同じ場合は入院日で比較
    return a.admission.localeCompare(b.admission);
  });
}
// formatResults 関数は procedureDetails を直接使っていないため、修正不要

/**
 * 結果をフォーマットする関数
 * 判定結果をタブ区切りテキスト形式でフォーマットします
 * @param cases - フォーマットする症例データ
 * @param headerLine - 出力ヘッダー行（デフォルト: DEFAULT_RESULT_HEADER）
 * @param settings - 出力設定（outputMode と dateFormat を含む）
 * @returns フォーマットされた結果テキスト
 */
export function formatResults(
  cases: CaseData[],
  headerLine: string = DEFAULT_RESULT_HEADER,
  settings: OutputSettings, // デフォルト値を削除し、必須引数とする
): string {
  // 設定に基づいて出力する症例をフィルタリング
  const filteredCases = settings.outputMode === 'allCases'
    ? cases
    : cases.filter((c) => c.isEligible === true);

  // 症例が存在しない場合
  if (filteredCases.length === 0) {
    return '該当する症例はありません。';
  }

  // ヘッダー行を配列の最初の要素として追加
  const lines = [headerLine];

  // 各症例のデータ行を追加
  filteredCases.forEach((c) => {
    // 日付を指定されたフォーマットに変換
    const admissionDate = formatDate(c.admission, settings.dateFormat);
    const dischargeDate = formatDate(c.discharge, settings.dateFormat);

    const line = `${c.id}\t${admissionDate}\t${dischargeDate}\t${c.isEligible ? 'Yes' : 'No'}\t${
      c.reason || ''
    }`;
    lines.push(line);
  });

  // 行を改行文字で結合して返す
  return lines.join('\n');
}
