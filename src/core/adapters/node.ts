/**
 * 短期滞在手術等基本料３判定プログラム - Node.jsアダプター
 * このファイルには、Node.js環境固有の実装を含みます。
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * ファイルをテキストとして読み込む関数（Node.js環境用）
 * @param filePath - 読み込むファイルパス
 * @returns ファイルの内容を含むPromise
 */
export function readFile(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(data);
    });
  });
}

/**
 * テキストをファイルに書き込む関数（Node.js環境用）
 * @param text - 書き込むテキスト
 * @param filePath - 出力ファイルパス
 * @returns 書き込み完了を示すPromise
 */
export function writeFile(text: string, filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const dirPath = path.dirname(filePath);

    // ディレクトリが存在するか確認し、なければ作成
    if (!fs.existsSync(dirPath)) {
      try {
        fs.mkdirSync(dirPath, { recursive: true });
      } catch (err) {
        reject(new Error(`ディレクトリの作成に失敗しました: ${dirPath}`));
        return;
      }
    }

    fs.writeFile(filePath, text, 'utf8', (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

/**
 * ディレクトリ内のファイル一覧を取得する関数（Node.js環境用）
 * @param dirPath - ディレクトリパス
 * @param extension - 拡張子フィルター（例: '.txt'）
 * @returns ファイルパスの配列を含むPromise
 */
export function listFiles(dirPath: string, extension?: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    fs.readdir(dirPath, (err, files) => {
      if (err) {
        reject(err);
        return;
      }

      // 完全なパスに変換
      const fullPaths = files.map((file) => path.join(dirPath, file));

      // 拡張子でフィルタリング（指定された場合）
      const filtered = extension
        ? fullPaths.filter((file) => path.extname(file).toLowerCase() === extension.toLowerCase())
        : fullPaths;

      resolve(filtered);
    });
  });
}

/**
 * エラーメッセージを表示する関数（Node.js環境用）
 * @param title - エラータイトル
 * @param message - エラーメッセージ
 * @param isWarning - 警告として表示するかどうか
 */
export function showError(title: string, message: string, isWarning = false): void {
  const prefix = isWarning ? '警告: ' : 'エラー: ';
  console.error(`${prefix}${title}`);
  console.error(message);
}
