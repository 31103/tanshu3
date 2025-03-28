// 入院EF統合ファイルの症例データ型
export interface CaseData {
  dataId: string; // データ識別番号
  patientId: string; // 患者ID
  admissionDate: string; // 入院年月日
  dischargeDate: string; // 退院年月日
  procedures: string[]; // 実施済み処置（手術コードなど）
  status: string; // 処理ステータス
  isShortStayEligible?: boolean; // 短期滞在手術等基本料3の対象かどうか
  eligibilityReason?: string; // 対象/非対象の理由
}

// ファイル検証結果型
export interface FileValidationResult {
  file: File;
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

// トースト通知型
export interface ToastData {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: number;
  priority: number;
  duration: number;
  element?: HTMLElement;
}

// 出力設定型
export interface OutputSettings {
  outputMode: 'eligibleOnly' | 'allCases';
  dateFormat: string;
}

// エラーハンドラオプション型
export interface ErrorHandlerOptions {
  recoveryAction?: {
    message: string;
    label: string;
    handler: () => void;
  };
  updateUI?: () => void;
}

// タイプ優先度マップ
export interface TypePriorityMap {
  [key: string]: number;
  error: number;
  warning: number;
  info: number;
  success: number;
}

// コアビジネス関数型宣言
export function parseEFFile(content: string): CaseData[];
export function evaluateCases(cases: CaseData[]): CaseData[];
export function formatResults(cases: CaseData[]): string;
export function mergeCases(existingCases: CaseData[], newCases: CaseData[]): CaseData[];
