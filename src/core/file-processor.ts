import { CaseData, OutputSettings } from './common/types'; // OutputSettings をインポート
import { readFileAsText } from './validator';
import { parseEFFile, mergeCases } from './common/parsers';
import { evaluateCases, formatResults } from './common/evaluator';
import { DEFAULT_RESULT_HEADER } from './common/constants'; // DEFAULT_RESULT_HEADER をインポート

/**
 * ファイル処理クラス
 * EFファイルの読み込みと処理を行うユーティリティ
 */
class FileProcessor {
  /**
   * 複数のファイルを処理する
   * @param files 処理対象のファイル配列
   * @param settings 出力設定
   * @returns 処理結果のプロミス
   */
  public async processFiles(files: File[], settings: OutputSettings): Promise<string> {
    // settings 引数を追加
    try {
      if (!files || files.length === 0) {
        throw new Error('ファイルが選択されていません');
      }

      // ファイルの内容を読み込む
      const fileContents: string[] = [];
      for (const file of files) {
        const content = await readFileAsText(file);
        fileContents.push(content);
      }

      // ファイルの内容を解析して症例データを統合
      let allCases: CaseData[] = [];
      for (const content of fileContents) {
        const cases = parseEFFile(content);
        allCases = mergeCases(allCases, cases);
      }

      // 判定処理を実行
      const evaluatedCases = evaluateCases(allCases);

      // 結果をフォーマット
      const result = formatResults(evaluatedCases, DEFAULT_RESULT_HEADER, settings); // settings を渡すように修正

      return result;
    } catch (error) {
      console.error('ファイル処理エラー:', error);
      throw error;
    }
  }
}

// グローバルでアクセス可能なインスタンスを作成
export const fileProcessor = new FileProcessor();
