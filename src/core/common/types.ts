/**
 * 短期滞在手術等基本料３判定プログラム - 共通型定義
 * このファイルには、アプリケーション全体で使用される型定義を含みます。
 */

/**
 * 症例データの型定義
 * ファイルから抽出された患者の症例情報を表します。
 */
export interface CaseData {
    id: string;           // データ識別番号
    admission: string;    // 入院年月日（yyyymmdd形式）
    discharge: string;    // 退院年月日（yyyymmdd形式）
    procedures: string[]; // 実施された診療行為コードのリスト
}

/**
 * EFファイルから抽出した生データの型定義
 * ファイルの各行から抽出された未加工の情報を表します。
 */
export interface RawCaseData {
    dataId: string;     // データ識別番号
    discharge: string;  // 退院年月日
    admission: string;  // 入院年月日
    procedure: string;  // レセプト電算コード
}

/**
 * アプリケーションの状態を表す型定義
 * ブラウザUI用の状態管理に使用されます。
 */
export interface AppState {
    isProcessing: boolean;   // 処理中フラグ
    totalFiles: number;      // 処理対象の総ファイル数
    processedFiles: number;  // 処理済みファイル数
    cases: CaseData[];       // 抽出された症例データ
}

/**
 * ファイル情報の型定義
 * 選択されたファイルの基本情報を表します。
 */
export interface FileInfo {
    name: string;  // ファイル名
    size: number;  // ファイルサイズ（バイト単位）
    type: string;  // MIMEタイプ
}

/**
 * エラーメッセージを持つオブジェクトの型定義
 * エラーハンドリングに使用されます。
 */
export interface ErrorWithMessage {
    message: string;  // エラーメッセージ
} 