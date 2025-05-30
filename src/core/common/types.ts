/**
 * 短期滞在手術等基本料３判定プログラム - 共通型定義
 * このファイルには、アプリケーション全体で使用される型定義を含みます。
 */

/**
 * 症例データの型定義
 * ファイルから抽出された患者の症例情報を表します。
 */
export interface ProcedureDetail {
  code: string; // レセプト電算コード (列9)
  name: string; // 診療明細名称 (列11)
  date: string; // 実施年月日 (列24)
  sequenceNumber: string; // 順序番号 (列6)
  dataCategory: string; // データ区分 (列4)
  // 必要に応じて他の列情報も追加可能
}

/**
 * 症例データの型定義
 * ファイルから抽出された患者の症例情報を表します。
 */
export interface CaseData {
  id: string; // データ識別番号
  admission: string; // 入院年月日（yyyymmdd形式）
  discharge: string; // 退院年月日（yyyymmdd形式）
  procedureDetails: ProcedureDetail[]; // 実施された診療行為詳細のリスト
  isEligible?: boolean; // 短手３対象症例かどうか
  reason?: string; // 対象/非対象の理由
}

/**
 * EFファイルから抽出した生データの型定義
 * ファイルの各行から抽出された未加工の情報を表します。
 */
export interface RawCaseData {
  dataId: string; // データ識別番号
  discharge: string; // 退院年月日
  admission: string; // 入院年月日
  procedure: string; // レセプト電算コード
  procedureName?: string; // 診療明細名称
}

/**
 * アプリケーションの状態を表す型定義
 * ブラウザUI用の状態管理に使用されます。
 */
export interface AppState {
  isProcessing: boolean; // 処理中フラグ
  totalFiles: number; // 処理対象の総ファイル数
  processedFiles: number; // 処理済みファイル数
  cases: CaseData[]; // 抽出された症例データ
  outputSettings: OutputSettings; // 出力設定
}

/**
 * 出力設定の型定義
 * 結果出力の設定を表します。
 */
export interface OutputSettings {
  outputMode: 'eligibleOnly' | 'allCases'; // 出力モード（対象症例のみ or 全症例）
  dateFormat: 'yyyymmdd' | 'yyyy/mm/dd'; // 日付フォーマット (小文字に修正)
}

/**
 * ファイル情報の型定義
 * 選択されたファイルの基本情報を表します。
 */
export interface FileInfo {
  name: string; // ファイル名
  size: number; // ファイルサイズ（バイト単位）
  type: string; // MIMEタイプ
}

/**
 * エラーメッセージを持つオブジェクトの型定義
 * エラーハンドリングに使用されます。
 */
export interface ErrorWithMessage {
  message: string; // エラーメッセージ
}

/**
 * ファイルバリデーション結果の型定義
 * 入院統合EFファイルのフォーマット検証結果を表します。
 */
export interface ValidationResult {
  isValid: boolean; // ファイルが有効かどうかのフラグ
  errors: string[]; // 重大なエラーメッセージの配列
  warnings: string[]; // 警告メッセージの配列
}

/**
 * エラーハンドラオプション型
 * エラー発生時の追加アクションやUI更新を指定します。
 */
export interface ErrorHandlerOptions {
  recoveryAction?: {
    message: string; // 回復アクションの説明メッセージ
    label: string; // 回復アクションボタンのラベル
    handler: () => void; // 回復アクションを実行する関数
  };
  updateUI?: () => void; // エラー発生後にUIを更新する関数
}
