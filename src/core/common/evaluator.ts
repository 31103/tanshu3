/**
 * 短期滞在手術等基本料３判定プログラム - 評価ロジック
 * このファイルには、短手３該当症例の判定などの評価ロジックを含みます。
 */

import { CaseData, OutputSettings } from './types';
import { calculateHospitalDays, formatDate } from './utils'; // formatDate をインポート
import {
  COLONOSCOPY_PROCEDURE_CODES,
  COLONOSCOPY_SPECIAL_ADDITIONS,
  DEFAULT_RESULT_HEADER,
  INELIGIBILITY_REASONS,
  MAX_HOSPITAL_DAYS,
  PROCEDURE_NAME_MAP,
  TARGET_PROCEDURES,
} from './constants';

/**
 * 短手３該当症例を判定する関数
 * 各症例が短期滞在手術等基本料３の条件に該当するかを判定します
 * @param cases - 判定対象の症例データ
 * @returns 短手３に該当する症例データ（ID昇順でソート済み）
 */
export function evaluateCases(cases: CaseData[]): CaseData[] {
  // 全症例に対して適格性と理由を設定
  const evaluatedCases = cases.map((c) => {
    try {
      // 評価結果を格納するオブジェクトを作成（元のオブジェクトをコピー）
      const evaluatedCase = { ...c };

      // 1. 退院日が '00000000' でない（退院が確定している）
      if (!c.discharge || c.discharge === '00000000') {
        evaluatedCase.isEligible = false;
        evaluatedCase.reason = INELIGIBILITY_REASONS.UNDISCHARGED;
        return evaluatedCase;
      }

      // 2. 対象手術等の実施（少なくとも1つの対象手術等が実施されている）
      const targetProceduresFound = c.procedures.filter((p) => TARGET_PROCEDURES.includes(p));

      if (targetProceduresFound.length === 0) {
        evaluatedCase.isEligible = false;
        evaluatedCase.reason = INELIGIBILITY_REASONS.NO_TARGET_PROCEDURE;
        return evaluatedCase;
      }

      // 3. 入院期間が5日以内
      const hospitalDays = calculateHospitalDays(c.admission, c.discharge);

      if (hospitalDays === null || hospitalDays > MAX_HOSPITAL_DAYS) {
        evaluatedCase.isEligible = false;
        evaluatedCase.reason = INELIGIBILITY_REASONS.HOSPITAL_DAYS_EXCEEDED;
        return evaluatedCase;
      }

      // 4. 入院期間中に対象手術等を2以上実施していないかチェック
      // ただし、同一の対象手術等を複数回実施する場合は例外とする
      if (targetProceduresFound.length > 1) {
        // 対象手術等の種類数をカウント（重複を除外）
        const uniqueTargetProcedures = new Set(targetProceduresFound);
        if (uniqueTargetProcedures.size > 1) {
          evaluatedCase.isEligible = false;
          evaluatedCase.reason = INELIGIBILITY_REASONS.MULTIPLE_TARGET_PROCEDURES;
          return evaluatedCase;
        }
      }

      // 5. 入院期間中に対象手術等に加えて、他の手術を実施していないかチェック
      // 手術コードは通常 '15' で始まるが、診療明細名称に「加算」が含まれるコードは手術ではないため除外
      const surgeryProcedures = c.procedures.filter((p, index) => {
        // 対象手術等に含まれるコードは除外
        if (TARGET_PROCEDURES.includes(p)) return false;

        // '15'で始まるコードのみを対象
        if (!p.startsWith('15')) return false;

        // 診療明細名称に「加算」が含まれるコードは手術ではないため除外
        if (
          c.procedureNames &&
          c.procedureNames[index] &&
          c.procedureNames[index].includes('加算')
        ) {
          return false;
        }

        // 加算コードは通常、特定のパターンを持つ（例：150000490）
        // 多くの加算コードは '1500' で始まり、その後に '00' が続く
        if (p.startsWith('1500') && p.substring(4, 6) === '00') return false;

        return true;
      });

      if (surgeryProcedures.length > 0) {
        evaluatedCase.isEligible = false;
        evaluatedCase.reason = INELIGIBILITY_REASONS.OTHER_SURGERY;
        return evaluatedCase;
      }

      // 6. 内視鏡的大腸ポリープ・粘膜切除術の特定加算チェック
      // 内視鏡的大腸ポリープ・粘膜切除術を実施したかどうか
      const hasColonoscopy = c.procedures.some((p) => COLONOSCOPY_PROCEDURE_CODES.includes(p));

      // 特定加算が含まれているかどうか
      const hasSpecialAddition = c.procedures.some((p) =>
        COLONOSCOPY_SPECIAL_ADDITIONS.includes(p)
      );

      // 内視鏡的大腸ポリープ術に特定加算がある場合は対象外
      if (hasColonoscopy && hasSpecialAddition) {
        evaluatedCase.isEligible = false;
        evaluatedCase.reason = INELIGIBILITY_REASONS.SPECIAL_ADDITION;
        return evaluatedCase;
      }

      // すべての条件を満たす場合は短手３対象症例
      evaluatedCase.isEligible = true;

      // 実施された対象手術の名称を理由として設定
      const procedureCode = targetProceduresFound[0]; // 最初の対象手術コード
      evaluatedCase.reason = PROCEDURE_NAME_MAP[procedureCode] || '対象手術等';

      return evaluatedCase;
    } catch (error) {
      console.error(
        `症例 ${c.id} の評価中にエラーが発生しました: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      // エラーが発生した場合は該当しないと判断
      return {
        ...c,
        isEligible: false,
        reason: `評価エラー: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  });

  // 修正: フィルタリングせず、全ての評価済み症例を返す
  // フィルタリングは formatResults で行う
  // ID順にソート
  return evaluatedCases.sort((a, b) => a.id.localeCompare(b.id));
}

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
