/**
 * 短期滞在手術等基本料３判定プログラム - ユーティリティ関数
 * このファイルには、アプリケーション全体で使用される汎用的な関数を含みます。
 */

/**
 * 日付文字列（yyyymmdd）をDateオブジェクトに変換する関数
 * @param dateStr - 変換する日付文字列（yyyymmdd形式）
 * @returns Dateオブジェクトまたはnull（無効な日付の場合）
 */
export function parseDate(dateStr: string): Date | null {
    if (!dateStr || dateStr === '00000000') return null;

    try {
        const year = parseInt(dateStr.substring(0, 4), 10);
        const month = parseInt(dateStr.substring(4, 6), 10) - 1; // 月は0から始まる
        const day = parseInt(dateStr.substring(6, 8), 10);

        const date = new Date(year, month, day);

        // 有効な日付かチェック
        if (isNaN(date.getTime())) return null;

        return date;
    } catch (error) {
        console.error(`日付の解析中にエラーが発生しました: ${dateStr} - ${error instanceof Error ? error.message : String(error)}`);
        return null;
    }
}

/**
 * 入院期間（日数）を計算する関数
 * @param admissionStr - 入院日（yyyymmdd形式）
 * @param dischargeStr - 退院日（yyyymmdd形式）
 * @returns 入院日数または null（日付が無効な場合）
 */
export function calculateHospitalDays(admissionStr: string, dischargeStr: string): number | null {
    const admissionDate = parseDate(admissionStr);
    const dischargeDate = parseDate(dischargeStr);

    if (!admissionDate || !dischargeDate) return null;

    // ミリ秒数を日数に変換（1日 = 24 * 60 * 60 * 1000 ミリ秒）
    return Math.round((dischargeDate.getTime() - admissionDate.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * 日付文字列のフォーマットを変換する関数
 * @param dateStr - 変換する日付文字列（yyyymmdd形式）
 * @param format - 出力フォーマット（'yyyymmdd'または'yyyy/mm/dd'）
 * @returns フォーマットされた日付文字列、または元の文字列（無効な日付の場合）
 */
export function formatDate(dateStr: string, format: 'yyyymmdd' | 'yyyy/mm/dd' = 'yyyymmdd'): string {
    // 00000000の場合はそのまま返す
    if (dateStr === '00000000') return dateStr;

    // 日付オブジェクトに変換
    const date = parseDate(dateStr);
    if (!date) return dateStr; // 変換できない場合は元の文字列を返す

    // 年、月、日を取得
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 月は0から始まるので+1
    const day = date.getDate();

    // 指定されたフォーマットに変換
    if (format === 'yyyy/mm/dd') {
        return `${year}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
    } else {
        return `${year}${month.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}`;
    }
}

/**
 * エラーオブジェクトからメッセージを取得するヘルパー関数
 * @param error - エラーオブジェクトまたは任意の値
 * @returns エラーメッセージ文字列
 */
export function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
} 