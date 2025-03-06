/**
 * 短期滞在手術等基本料３判定プログラム - 定数定義
 * このファイルには、アプリケーション全体で使用される定数を含みます。
 */

/**
 * 内視鏡的大腸ポリープ・粘膜切除術の診療行為コード
 */
export const COLONOSCOPY_PROCEDURE_CODE_SMALL = "150285010"; // 長径２センチメートル未満
export const COLONOSCOPY_PROCEDURE_CODE_LARGE = "150183410"; // 長径２センチメートル以上
export const COLONOSCOPY_PROCEDURE_CODES: string[] = [COLONOSCOPY_PROCEDURE_CODE_SMALL, COLONOSCOPY_PROCEDURE_CODE_LARGE]; // 小・大の両方のコードをまとめた配列

/**
 * 対象手術等のコード一覧
 * 短期滞在手術等基本料３の対象となる診療行為コードのリスト
 */
export const TARGET_PROCEDURES: string[] = [
    "160218510", "160218610", "160183110", "160119710", "160180410",
    "160098110", "150351910", "150011310", "150294810", "150020810",
    "150021010", "150021210", "150041010", "150314110", "150273810",
    "150355810", "150355910", "150078810", "150079010", "150080210",
    "150083410", "150083510", "150344510", "150395150", "150253010",
    "150315610", "150096010", "150097710", "150315910", "150316010",
    "150106850", "150299450", "150121110", "150121210", "150416610",
    "150416710", "150154010", "150263410", "150296510", "150154150",
    "150360910", "150411150", "150159010", "150263610", "150285010",
    "150183410", "150325410", "150190310", "150190410", "150194510",
    "150421110", "150404310", "150216510", "150421310", "150421410",
    "150421510", "150421610", "150421710", "150421810", "150366110",
    "180018910"
];

/**
 * 内視鏡的大腸ポリープ・粘膜切除術の特定加算コード
 */
export const COLONOSCOPY_SPECIAL_ADDITIONS: string[] = ["150429570", "150437170"];

/**
 * デフォルトの結果ヘッダー行
 */
export const DEFAULT_RESULT_HEADER = "データ識別番号\t入院年月日\t退院年月日";

/**
 * 入院期間の最大日数（短期滞在手術等基本料３の条件）
 */
export const MAX_HOSPITAL_DAYS = 5; 