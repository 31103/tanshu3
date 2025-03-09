/**
 * ステップ管理クラス
 * アプリケーションの処理ステップを管理するコンポーネント
 */
export class StepManager {
    private steps: HTMLElement[] = [];
    private currentStep: number = 0;

    /**
     * ステップ管理クラスのコンストラクタ
     */
    constructor() {
        // ステップ要素を取得
        const stepElements = document.querySelectorAll('.step');
        this.steps = Array.from(stepElements) as HTMLElement[];

        // 初期状態の設定
        this.updateStep(0);
    }

    /**
     * 現在のステップを更新する
     * @param stepIndex 設定するステップのインデックス
     */
    public updateStep(stepIndex: number): void {
        // 範囲外のインデックスを修正
        if (stepIndex < 0) stepIndex = 0;
        if (stepIndex >= this.steps.length) stepIndex = this.steps.length - 1;

        // 前のステップをすべて完了状態に
        for (let i = 0; i < this.steps.length; i++) {
            if (i < stepIndex) {
                this.steps[i].classList.remove('active');
                this.steps[i].classList.add('completed');
                this.steps[i].removeAttribute('aria-current');
            } else if (i === stepIndex) {
                this.steps[i].classList.add('active');
                this.steps[i].classList.remove('completed');
                this.steps[i].setAttribute('aria-current', 'step');
            } else {
                this.steps[i].classList.remove('active', 'completed');
                this.steps[i].removeAttribute('aria-current');
            }
        }

        // 現在のステップを更新
        this.currentStep = stepIndex;

        // ステップ変更イベントを発行
        const event = new CustomEvent('stepChange', {
            detail: { previousStep: this.currentStep, currentStep: stepIndex }
        });
        document.dispatchEvent(event);
    }

    /**
     * 次のステップに進む
     */
    public nextStep(): void {
        if (this.currentStep < this.steps.length - 1) {
            this.updateStep(this.currentStep + 1);
        }
    }

    /**
     * 前のステップに戻る
     */
    public previousStep(): void {
        if (this.currentStep > 0) {
            this.updateStep(this.currentStep - 1);
        }
    }

    /**
     * 特定のステップに移動する
     * @param stepIndex 移動先のステップインデックス
     */
    public goToStep(stepIndex: number): void {
        this.updateStep(stepIndex);
    }

    /**
     * 現在のステップを取得する
     * @returns 現在のステップインデックス
     */
    public getCurrentStep(): number {
        return this.currentStep;
    }

    /**
     * ステップの総数を取得する
     * @returns ステップの総数
     */
    public getTotalSteps(): number {
        return this.steps.length;
    }
}

// グローバルでアクセス可能なインスタンスを作成
export const stepManager = new StepManager();