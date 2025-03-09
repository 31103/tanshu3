import { CaseData } from '../types/types';
import { readFileAsText } from './validator';

/**
 * ファイル処理クラス
 * EFファイルの読み込みと処理を行うユーティリティ
 */
export class FileProcessor {
    /**
     * 複数のファイルを処理する
     * @param files 処理対象のファイル配列
     * @returns 処理結果のプロミス
     */
    public async processFiles(files: File[]): Promise<string> {
        if (!files || files.length === 0) {
            throw new Error('ファイルが選択されていません');
        }

        try {
            // ファイルの内容を読み込む
            const fileContents: string[] = [];
            for (const file of files) {
                const content = await readFileAsText(file);
                fileContents.push(content);
            }

            // ファイルの内容を解析
            const allCases: CaseData[] = [];
            for (const content of fileContents) {
                const cases = this.parseEFFile(content);
                this.mergeCases(allCases, cases);
            }

            // 判定処理を実行
            const evaluatedCases = this.evaluateCases(allCases);

            // 結果をフォーマットして返す
            return this.formatResults(evaluatedCases);
        } catch (error) {
            console.error('ファイル処理エラー:', error);
            throw error;
        }
    }

    /**
     * EFファイルの内容を解析する
     * @param content ファイルの内容
     * @returns 解析された症例データの配列
     */
    public parseEFFile(content: string): CaseData[] {
        // TODO: 実際の解析ロジックを実装
        // サンプル実装
        const cases: CaseData[] = [];
        const lines = content.split('\n');

        // ヘッダー行をスキップ
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const fields = line.split(',');
            if (fields.length >= 4) {
                cases.push({
                    dataId: fields[0],
                    patientId: fields[1],
                    admissionDate: fields[2],
                    dischargeDate: fields[3],
                    procedures: fields.slice(4),
                    status: 'pending'
                });
            }
        }

        return cases;
    }

    /**
     * 症例データを結合する
     * @param existingCases 既存の症例データ配列
     * @param newCases 新しい症例データ配列
     * @returns 結合された症例データの配列
     */
    public mergeCases(existingCases: CaseData[], newCases: CaseData[]): CaseData[] {
        // TODO: 実際のマージロジックを実装
        // サンプル実装
        for (const newCase of newCases) {
            const existingIndex = existingCases.findIndex(c => c.dataId === newCase.dataId);

            if (existingIndex >= 0) {
                // 既存の症例がある場合、必要に応じて情報を更新
                const existingCase = existingCases[existingIndex];

                // 退院日が未確定の場合は新しい情報で上書き
                if (existingCase.dischargeDate === '00000000' && newCase.dischargeDate !== '00000000') {
                    existingCases[existingIndex] = { ...existingCase, dischargeDate: newCase.dischargeDate };
                }

                // 処置情報を統合
                existingCases[existingIndex].procedures = [
                    ...new Set([...existingCase.procedures, ...newCase.procedures])
                ];
            } else {
                // 新しい症例の場合はそのまま追加
                existingCases.push(newCase);
            }
        }

        return existingCases;
    }

    /**
     * 症例データの判定処理を実行
     * @param cases 症例データの配列
     * @returns 判定結果を含む症例データの配列
     */
    public evaluateCases(cases: CaseData[]): CaseData[] {
        // TODO: 実際の判定ロジックを実装
        // サンプル実装
        return cases.map(caseData => {
            // 退院日が未確定の場合は判定保留
            if (caseData.dischargeDate === '00000000') {
                return {
                    ...caseData,
                    status: 'pending',
                    isShortStayEligible: false,
                    eligibilityReason: '退院日未確定'
                };
            }

            // 短手3の判定条件（サンプル）
            const hasEligibleProcedure = caseData.procedures.some((p: string) =>
                ['K123', 'K456', 'K789'].includes(p)
            );

            // 入院日から退院日までの日数を計算
            const admissionDate = new Date(
                parseInt(caseData.admissionDate.substring(0, 4)),
                parseInt(caseData.admissionDate.substring(4, 6)) - 1,
                parseInt(caseData.admissionDate.substring(6, 8))
            );

            const dischargeDate = new Date(
                parseInt(caseData.dischargeDate.substring(0, 4)),
                parseInt(caseData.dischargeDate.substring(4, 6)) - 1,
                parseInt(caseData.dischargeDate.substring(6, 8))
            );

            const stayDuration = Math.floor(
                (dischargeDate.getTime() - admissionDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            // 短手3の条件を満たすかどうか判定
            const isEligible = hasEligibleProcedure && stayDuration <= 5;

            return {
                ...caseData,
                status: 'evaluated',
                isShortStayEligible: isEligible,
                eligibilityReason: isEligible
                    ? '対象処置あり、5日以内の退院'
                    : (!hasEligibleProcedure ? '対象処置なし' : '5日超の入院')
            };
        });
    }

    /**
     * 結果を出力用にフォーマット
     * @param cases 判定結果を含む症例データの配列
     * @returns タブ区切りのテキスト結果
     */
    public formatResults(cases: CaseData[]): string {
        // ヘッダー行
        let result = 'データ識別番号\t入院年月日\t退院年月日\t短手３対象症例\t判定理由\n';

        // データをソート（データ識別番号の昇順）
        const sortedCases = [...cases].sort((a, b) => a.dataId.localeCompare(b.dataId));

        // データ行の追加
        for (const caseData of sortedCases) {
            result += `${caseData.dataId}\t${caseData.admissionDate}\t${caseData.dischargeDate}\t`;
            result += `${caseData.isShortStayEligible ? 'Yes' : 'No'}\t${caseData.eligibilityReason || ''}\n`;
        }

        return result;
    }
}

// グローバルでアクセス可能なインスタンスを作成
export const fileProcessor = new FileProcessor();