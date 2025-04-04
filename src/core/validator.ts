import { FileValidationResult } from './file-processor'; // Import from file-processor where it was moved

/**
 * ファイルのバリデーションを実行する関数
 * @param files バリデーション対象のファイル配列
 * @returns 検証結果の配列
 */
export async function validateFiles(files: File[]): Promise<FileValidationResult[]> {
  if (!files || files.length === 0) {
    throw new Error('ファイルが選択されていません');
  }

  // 検証結果の配列
  const validationResults: FileValidationResult[] = [];

  // 各ファイルを検証
  for (const file of files) {
    try {
      const content = await readFileAsText(file);
      const result = validateFileContent(file, content);
      validationResults.push(result);
    } catch {
      // ファイル読み込みエラーの場合
      validationResults.push({
        file,
        isValid: false,
        warnings: [],
        errors: ['不明なエラーが発生しました'],
      });
    }
  }

  return validationResults;
}

/**
 * ファイルをテキストとして読み込む
 * @param file 読み込むファイル
 * @returns ファイルの内容
 */
export function readFileAsText(file: File): Promise<string> {
  // テキストファイルでない場合はエラー
  if (!file.type.includes('text') && !file.name.endsWith('.txt')) {
    return Promise.reject(new Error('Read error: Invalid file format'));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event): void => {
      if (typeof event.target?.result === 'string') {
        resolve(event.target.result);
      } else {
        reject(new Error('Read error: Invalid file format'));
      }
    };

    reader.onerror = (): void => {
      reject(new Error('Read error: File read failed'));
    };

    try {
      reader.readAsText(file);
    } catch {
      reject(new Error('Read error: Cannot start reading file'));
    }
  });
}

/**
 * ファイルの内容を検証する
 * @param file ファイルオブジェクト
 * @param content ファイルの内容
 * @returns 検証結果
 */
export function validateFileContent(file: File, content: string): FileValidationResult {
  // 検証結果オブジェクトの初期化
  const result: FileValidationResult = {
    file,
    isValid: true,
    warnings: [],
    errors: [],
  };

  // 基本チェック（空ファイル、最低行数）
  if (!validateBasicContent(content, result)) {
    return result; // 基本チェックに失敗した場合は以降のチェック不要
  }

  // 行に分割 (CRLFとLFの両方に対応)
  const lines = content.split(/\r?\n/);

  // ヘッダー行のチェック
  validateHeaderLine(lines[0], result);

  // データ行のチェック（最初の5行まで）
  validateDataLines(lines, result);

  return result;
}

/**
 * ファイルの基本的な内容をチェックする
 * @param content ファイルの内容
 * @param result 検証結果オブジェクト
 * @returns 基本チェックに成功したかどうか
 */
function validateBasicContent(content: string, result: FileValidationResult): boolean {
  // 1. ファイル全体が空でないかチェック
  if (!content.trim()) {
    result.isValid = false;
    result.errors.push('ファイルが空です');
    return false; // 空の場合は以降のチェック不要
  }

  // 2. 最低行数チェック (ヘッダー行 + データ行1行以上)
  const lines = content.split(/\r?\n/);
  if (lines.filter((line) => line.trim()).length < 2) {
    result.isValid = false;
    result.errors.push('ファイルが空か、ヘッダー行またはデータ行が不足しています');
    return false; // 行数が足りない場合は以降のチェック不要
  }

  return true;
}

/**
 * ヘッダー行を検証する
 * @param headerLine ヘッダー行の内容
 * @param result 検証結果オブジェクト
 */
function validateHeaderLine(headerLine: string, result: FileValidationResult): void {
  const trimmedHeader = headerLine.trim();

  if (!trimmedHeader) {
    // ヘッダー行が空の場合 (通常はありえないが念のため)
    result.warnings.push('ヘッダー行が空のようです');
  } else if (!trimmedHeader.includes('\t')) {
    // ヘッダー行にタブが含まれていない場合 (タブ区切りでない可能性)
    result.warnings.push('ヘッダー行にタブ区切りが見られません');
  }
}

/**
 * データ行を検証する
 * @param lines ファイルの全行
 * @param result 検証結果オブジェクト
 */
function validateDataLines(lines: string[], result: FileValidationResult): void {
  const sampleSize = Math.min(5, lines.length - 1); // チェックするデータ行数 (最大5行)
  let tabWarningIssued = false; // タブ区切り警告発行済みフラグ
  let columnCountWarningIssued = false; // 列数不足警告発行済みフラグ
  let actionDetailNumWarningIssued = false; // 行為明細番号形式警告発行済みフラグ

  // データ行のループ (インデックス 1 から開始)
  for (let i = 1; i <= sampleSize; i++) {
    // lines[i] が存在しない場合 (ファイル末尾の空行など) はスキップ
    if (lines[i] === undefined) continue;

    const line = lines[i].trim();
    // 空のデータ行はスキップ
    if (!line) continue;

    validateDataLine(
      line,
      i,
      result,
      {
        tabWarningIssued,
        columnCountWarningIssued,
        actionDetailNumWarningIssued,
      },
      (flags) => {
        tabWarningIssued = flags.tabWarningIssued;
        columnCountWarningIssued = flags.columnCountWarningIssued;
        actionDetailNumWarningIssued = flags.actionDetailNumWarningIssued;
      },
    );
  }
}

/**
 * 1行のデータを検証する
 * @param line 検証対象の行
 * @param lineIndex 行のインデックス（0起点）
 * @param result 検証結果オブジェクト
 * @param flags 警告フラグの状態
 * @param updateFlags フラグを更新するコールバック
 */
function validateDataLine(
  line: string,
  lineIndex: number,
  result: FileValidationResult,
  flags: {
    tabWarningIssued: boolean;
    columnCountWarningIssued: boolean;
    actionDetailNumWarningIssued: boolean;
  },
  updateFlags: (updatedFlags: {
    tabWarningIssued: boolean;
    columnCountWarningIssued: boolean;
    actionDetailNumWarningIssued: boolean;
  }) => void,
): void {
  let { tabWarningIssued, columnCountWarningIssued, actionDetailNumWarningIssued } = flags;

  // 5-1. タブ区切り形式チェック (警告)
  if (!line.includes('\t') && !tabWarningIssued) {
    result.warnings.push(
      `一部のデータ行にタブ区切りが見られません (最初の例: 行 ${lineIndex + 1})`,
    );
    tabWarningIssued = true;
    // タブがない場合、以降の列チェックは無意味なのでスキップ
    updateFlags({ tabWarningIssued, columnCountWarningIssued, actionDetailNumWarningIssued });
    return;
  }

  // タブで列に分割
  const columns = line.split('\t');

  // 5-2. 列数チェック (警告) - 10列未満
  if (columns.length < 10 && !columnCountWarningIssued) {
    result.warnings.push(
      `一部のデータ行の列数が少ないようです (10列未満) (最初の例: 行 ${lineIndex + 1}, 列数: ${columns.length})`,
    );
    columnCountWarningIssued = true;
    // 列数が少ない場合、特定の列へのアクセスは危険なのでスキップ
    // (ただし、他の行で十分な列数がある可能性もあるため、ループは継続)
    updateFlags({ tabWarningIssued, columnCountWarningIssued, actionDetailNumWarningIssued });
    return;
  }

  // 入院年月日と行為明細番号の検証
  validateDateAndActionDetail(columns, lineIndex, result, flags, updateFlags);
}

/**
 * 入院年月日と行為明細番号を検証する
 * @param columns 行の列データ
 * @param lineIndex 行のインデックス（0起点）
 * @param result 検証結果オブジェクト
 * @param flags 警告フラグの状態
 * @param updateFlags フラグを更新するコールバック
 */
function validateDateAndActionDetail(
  columns: string[],
  lineIndex: number,
  result: FileValidationResult,
  flags: {
    tabWarningIssued: boolean;
    columnCountWarningIssued: boolean;
    actionDetailNumWarningIssued: boolean;
  },
  updateFlags: (updatedFlags: {
    tabWarningIssued: boolean;
    columnCountWarningIssued: boolean;
    actionDetailNumWarningIssued: boolean;
  }) => void,
): void {
  const { tabWarningIssued } = flags;
  // eslint-disable-next-line prefer-const
  let { columnCountWarningIssued, actionDetailNumWarningIssued } = flags; // Disable prefer-const for this line

  // 5-3. 入院年月日 (列4, インデックス3) の形式チェック (エラー)
  if (columns.length > 3) {
    const admission = columns[3].trim(); // 4列目の値を取得
    const dateRegex = /^(\d{8}|00000000)$/; // yyyymmdd または 00000000
    if (!dateRegex.test(admission)) {
      result.isValid = false; // 不正な形式ならファイルを無効とする
      // エラーメッセージは最初の一つだけ記録する
      if (
        result.errors.length === 0 ||
        !result.errors.some((e: string) => e.startsWith('入院年月日'))
      ) {
        result.errors.push(
          `入院年月日(4列目)の形式が不正です (yyyymmdd or 00000000) (最初の例: 行 ${lineIndex + 1}, 値: ${admission})`,
        );
      }
      // エラーが見つかっても、他の警告を拾うためにループは継続
    }
  } else if (!columnCountWarningIssued) {
    // 列数が足りず、まだ警告が出ていない場合
    result.warnings.push(
      `一部のデータ行で入院年月日(4列目)が確認できません (列数不足) (最初の例: 行 ${lineIndex + 1})`,
    );
    columnCountWarningIssued = true; // 列数不足の警告として扱う
  }

  // 5-4. 行為明細番号 (列7, インデックス6) の形式チェック (警告)
  if (columns.length > 6) {
    const actionDetailNum = columns[6].trim(); // 7列目の値を取得
    const actionDetailRegex = /^(000|\d{3})$/; // 000 または 3桁の数字
    if (!actionDetailRegex.test(actionDetailNum) && !actionDetailNumWarningIssued) {
      result.warnings.push(
        `行為明細番号(7列目)の形式が不正のようです (000 or 3桁数字) (最初の例: 行 ${lineIndex + 1}, 値: ${actionDetailNum})`,
      );
      actionDetailNumWarningIssued = true; // 警告は最初の一つだけ
    }
  } else if (!columnCountWarningIssued) {
    // 列数が足りず、まだ警告が出ていない場合
    result.warnings.push(
      `一部のデータ行で行為明細番号(7列目)が確認できません (列数不足) (最初の例: 行 ${lineIndex + 1})`,
    );
    columnCountWarningIssued = true; // 列数不足の警告として扱う
  }

  updateFlags({ tabWarningIssued, columnCountWarningIssued, actionDetailNumWarningIssued });
}
