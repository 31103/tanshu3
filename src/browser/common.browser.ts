/**
 * 短期滞在手術等基本料３判定プログラム - 共通関数（ブラウザ環境用）
 * このファイルには、ブラウザ環境で使用される共通関数を定義しています。
 * 入院EF統合ファイルを解析し、短期滞在手術等基本料３に該当する症例を抽出します。
 */

/**
 * 症例データの型定義
 */
interface CaseData {
    id: string;
    admission: string;
    discharge: string;
    procedures: string[];
    procedureNames?: string[];  // 診療明細名称のリスト（procedures配列と同じ順序）
    isEligible?: boolean;       // 短手３対象症例かどうか
    reason?: string;            // 対象/非対象の理由
}

/**
 * EFファイルから抽出した生データの型定義
 */
interface RawCaseData {
    dataId: string;
    discharge: string;
    admission: string;
    procedure: string;
}

/**
 * バリデーション結果の型定義
 */
interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

/**
 * 対象手術等のコード一覧
 * 短期滞在手術等基本料３の対象となる診療行為コードのリスト
 */
const targetProcedures: string[] = [
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
const colonoscopySpecialAdditions: string[] = ["150429570", "150437170"];

/**
 * 出力設定の型定義
 */
interface OutputSettings {
    showAllCases: boolean;   // 全症例を表示するかどうか（falseの場合は短手３対象症例のみ）
}

/**
 * EFファイルの行からデータを抽出する共通関数
 * @param columns - データ列の配列
 * @returns 患者データまたはnull（データが不十分な場合）
 * @private
 */
function _extractCaseData(columns: string[]): RawCaseData | null {
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
function parseEFFile(content: string): CaseData[] {
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
                    caseData = _extractCaseData(columns);
                }
            } else {
                // タブ区切りの場合（元のファイル形式）
                const columns = line.split('\t');
                caseData = _extractCaseData(columns);
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
function mergeCases(existingCases: CaseData[], newCases: CaseData[]): CaseData[] {
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

/**
 * 日付文字列（yyyymmdd）をDateオブジェクトに変換する関数
 * @param dateStr - 変換する日付文字列（yyyymmdd形式）
 * @returns Dateオブジェクトまたはnull（無効な日付の場合）
 * @private
 */
function _parseDate(dateStr: string): Date | null {
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
 * @private
 */
function _calculateHospitalDays(admissionStr: string, dischargeStr: string): number | null {
    const admissionDate = _parseDate(admissionStr);
    const dischargeDate = _parseDate(dischargeStr);

    if (!admissionDate || !dischargeDate) return null;

    // ミリ秒数を日数に変換（1日 = 24 * 60 * 60 * 1000 ミリ秒）
    return Math.round((dischargeDate.getTime() - admissionDate.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * 短手３該当症例を判定する関数
 * @param cases - 判定対象の症例データ
 * @returns 短手３に該当する症例データ（ID昇順でソート済み）
 */
function evaluateCases(cases: CaseData[]): CaseData[] {
    // 全症例に対して適格性と理由を設定
    const evaluatedCases = cases.map(c => {
        try {
            // 評価結果を格納するオブジェクトを作成（元のオブジェクトをコピー）
            const evaluatedCase = { ...c };

            // 1. 退院日が '00000000' でない（退院が確定している）
            if (!c.discharge || c.discharge === '00000000') {
                evaluatedCase.isEligible = false;
                evaluatedCase.reason = "退院日未確定";
                return evaluatedCase;
            }

            // 2. 対象手術等の実施（少なくとも1つの対象手術等が実施されている）
            const targetProceduresFound = c.procedures.filter(p => targetProcedures.includes(p));
            if (targetProceduresFound.length === 0) {
                evaluatedCase.isEligible = false;
                evaluatedCase.reason = "対象手術等なし";
                return evaluatedCase;
            }

            // 3. 入院期間が5日以内
            const hospitalDays = _calculateHospitalDays(c.admission, c.discharge);
            if (hospitalDays === null || hospitalDays > 5) {
                evaluatedCase.isEligible = false;
                evaluatedCase.reason = "入院期間が６日以上";
                return evaluatedCase;
            }

            // 4. 入院期間中に対象手術等を2以上実施していないかチェック
            // ただし、同一の対象手術等を複数回実施する場合は例外とする
            if (targetProceduresFound.length > 1) {
                // 対象手術等の種類数をカウント（重複を除外）
                const uniqueTargetProcedures = new Set(targetProceduresFound);
                if (uniqueTargetProcedures.size > 1) {
                    evaluatedCase.isEligible = false;
                    evaluatedCase.reason = "対象手術等を２以上実施";
                    return evaluatedCase;
                }
            }

            // 5. 内視鏡的大腸ポリープ・粘膜切除術の特定加算チェック
            // 大腸ポリープ切除術のコード
            const colonoscopyProcedures = ["150285010", "150183410"];

            // 内視鏡的大腸ポリープ術を実施したかどうか
            const hasColonoscopy = targetProceduresFound.some(p => colonoscopyProcedures.includes(p));

            // 特定加算が含まれているかどうか
            const hasSpecialAddition = c.procedures.some(p => colonoscopySpecialAdditions.includes(p));

            // 内視鏡的大腸ポリープ術に特定加算がある場合は対象外
            if (hasColonoscopy && hasSpecialAddition) {
                evaluatedCase.isEligible = false;
                evaluatedCase.reason = "内視鏡的大腸ポリープ術に特定加算あり";
                return evaluatedCase;
            }

            // すべての条件を満たす場合は短手３対象症例
            evaluatedCase.isEligible = true;

            // 実施された対象手術の名称を理由として設定
            // 対象手術名のマッピング（簡易版）
            const procedureNameMap: Record<string, string> = {
                "160218510": "終夜睡眠ポリグラフィー（１及び２以外の場合）（安全精度管理下で行うもの）",
                "160218610": "終夜睡眠ポリグラフィー（１及び２以外の場合）（その他のもの）",
                "160183110": "反復睡眠潜時試験（ＭＳＬＴ）",
                "160119710": "下垂体前葉負荷試験成長ホルモン（ＧＨ）（一連として）",
                "160180410": "小児食物アレルギー負荷検査",
                "160098110": "前立腺針生検法（その他のもの）",
                "150285010": "内視鏡的大腸ポリープ・粘膜切除術（長径２センチメートル未満）",
                "150183410": "内視鏡的大腸ポリープ・粘膜切除術（長径２センチメートル以上）",
                "150253010": "水晶体再建術（眼内レンズを挿入する場合）（その他のもの）"
                // 他の対象手術も必要に応じて追加
            };

            const procedureCode = targetProceduresFound[0]; // 最初の対象手術コード
            evaluatedCase.reason = procedureNameMap[procedureCode] || "対象手術等";

            return evaluatedCase;
        } catch (error) {
            console.error(`症例ID ${c.id} の評価中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
            // エラーが発生した場合は該当しないと判断
            return {
                ...c,
                isEligible: false,
                reason: `評価エラー: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    });

    // ID順にソート
    return evaluatedCases.sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * 結果をタブ区切りテキストにフォーマットする関数
 * @param cases - フォーマット対象の症例データ
 * @param settings - 出力設定（デフォルト: 短手３対象症例のみ）
 * @param headerLine - ヘッダー行（省略時は「データ識別番号\t入院年月日\t退院年月日\t短手３対象症例\t理由」）
 * @returns フォーマットされたテキスト
 */
function formatResults(
    cases: CaseData[],
    settings: OutputSettings = { showAllCases: false },
    headerLine = "データ識別番号\t入院年月日\t退院年月日\t短手３対象症例\t理由"
): string {
    try {
        // 設定に基づいて出力する症例をフィルタリング
        const filteredCases = settings.showAllCases
            ? cases
            : cases.filter(c => c.isEligible === true);

        if (filteredCases.length === 0) {
            return "該当する症例はありません。";
        }

        // 各症例の行をフォーマット
        const rows = filteredCases.map(c => {
            const eligibilityText = c.isEligible ? "Yes" : "No";
            const reasonText = c.reason || "";
            return `${c.id}\t${c.admission}\t${c.discharge}\t${eligibilityText}\t${reasonText}`;
        });

        // ヘッダー行と症例行を結合
        return [headerLine, ...rows].join('\n');
    } catch (error) {
        console.error(`結果のフォーマット中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
        return headerLine + '\n'; // 最低限ヘッダーは返す
    }
}

/**
 * 入院統合EFファイルのフォーマットを検証する関数
 * @param content - ファイルの内容
 * @returns 検証結果オブジェクト
 */
function validateEFFile(content: string): ValidationResult {
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