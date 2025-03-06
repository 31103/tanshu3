/**
 * 短期滞在手術等基本料３判定プログラム - 評価ロジック
 * このファイルには、短手３該当症例の判定などの評価ロジックを含みます。
 */

import { CaseData } from './types';
import { calculateHospitalDays } from './utils';
import { TARGET_PROCEDURES, COLONOSCOPY_SPECIAL_ADDITIONS, DEFAULT_RESULT_HEADER, MAX_HOSPITAL_DAYS } from './constants';

/**
 * 短手３該当症例を判定する関数
 * 各症例が短期滞在手術等基本料３の条件に該当するかを判定します
 * @param cases - 判定対象の症例データ
 * @returns 短手３に該当する症例データ（ID昇順でソート済み）
 */
export function evaluateCases(cases: CaseData[]): CaseData[] {
    return cases.filter(c => {
        try {
            // 1. 退院日が '00000000' でない（退院が確定している）
            if (!c.discharge || c.discharge === '00000000') return false;

            // 2. 対象手術等の実施（少なくとも1つの対象手術等が実施されている）
            const targetProceduresFound = c.procedures.filter(p => TARGET_PROCEDURES.includes(p));
            if (targetProceduresFound.length === 0) return false;

            // 3. 入院期間が5日以内
            const hospitalDays = calculateHospitalDays(c.admission, c.discharge);
            if (hospitalDays === null || hospitalDays > MAX_HOSPITAL_DAYS) return false;

            // 4. 入院期間中に対象手術等を2以上実施していないかチェック
            // ただし、同一の対象手術等を複数回実施する場合は例外とする
            if (targetProceduresFound.length > 1) {
                // 対象手術等の種類数をカウント（重複を除外）
                const uniqueTargetProcedures = new Set(targetProceduresFound);
                if (uniqueTargetProcedures.size > 1) return false;
            }

            // 5. 入院期間中に対象手術等に加えて、他の手術を実施していないかチェック
            // 手術コードは通常 '15' で始まるが、「加算」が含まれるコードは手術ではないため除外
            const surgeryProcedures = c.procedures.filter(p => {
                // 対象手術等に含まれるコードは除外
                if (TARGET_PROCEDURES.includes(p)) return false;

                // '15'で始まるコードのみを対象
                if (!p.startsWith('15')) return false;

                // 「加算」が含まれるコードは手術ではないため除外
                // 加算コードは通常、末尾に数字が付く（例：150000490 時間外加算２（手術））
                if (p.includes('加算')) return false;

                // 加算コードは通常、特定のパターンを持つ（例：150000490）
                // 多くの加算コードは '1500' で始まり、その後に '00' が続く
                if (p.startsWith('1500') && p.substring(4, 6) === '00') return false;

                return true;
            });

            if (surgeryProcedures.length > 0) return false;

            // 6. 内視鏡的大腸ポリープ・粘膜切除術の特定加算チェック
            // 内視鏡的大腸ポリープ・粘膜切除術のコード
            const colonoscopyProcedures = ["150285010", "150183410"];

            // 内視鏡的大腸ポリープ術を実施したかどうか
            const hasColonoscopy = targetProceduresFound.some(p => colonoscopyProcedures.includes(p));

            // 特定加算が含まれているかどうか
            const hasSpecialAddition = c.procedures.some(p => COLONOSCOPY_SPECIAL_ADDITIONS.includes(p));

            // 内視鏡的大腸ポリープ術に特定加算がある場合は対象外
            if (hasColonoscopy && hasSpecialAddition) return false;

            return true;
        } catch (error) {
            console.error(`症例 ${c.id} の評価中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
            return false; // エラーが発生した場合は該当しないと判断
        }
    }).sort((a, b) => a.id.localeCompare(b.id)); // ID順にソート
}

/**
 * 結果をフォーマットする関数
 * 判定結果をタブ区切りテキスト形式でフォーマットします
 * @param cases - フォーマットする症例データ
 * @param headerLine - 出力ヘッダー行（デフォルト: "データ識別番号\t入院年月日\t退院年月日"）
 * @returns フォーマットされた結果テキスト
 */
export function formatResults(cases: CaseData[], headerLine = DEFAULT_RESULT_HEADER): string {
    if (cases.length === 0) {
        return "該当する症例はありません。";
    }

    const rows = cases.map(c => `${c.id}\t${c.admission}\t${c.discharge}`);
    return [headerLine, ...rows].join('\n');
} 