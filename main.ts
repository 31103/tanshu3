// CaseDataインターフェースの定義
interface CaseData {
    id: string;
    admission: string;
    discharge: string;
    procedures: string[];
}

/**
 * 短期滞在手術等基本料３判定プログラム - メイン処理
 * このファイルには、ブラウザ上での実行に関する処理を定義しています。
 * 共通の処理ロジックはcommon.tsに定義されています。
 *
 * @author Your Team
 * @version 1.1.0
 * @license MIT
 */

interface AppState {
    isProcessing: boolean;
    totalFiles: number;
    processedFiles: number;
    cases: CaseData[];
}

interface FileInfo {
    name: string;
    size: number;
    type: string;
}

const AppState: AppState = {
    isProcessing: false,
    totalFiles: 0,
    processedFiles: 0,
    cases: []
};

// エラーオブジェクトの型定義
interface ErrorWithMessage {
    message: string;
}

// エラーオブジェクトからメッセージを取得するヘルパー関数
function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
}

document.addEventListener('DOMContentLoaded', function (): void {
    if (typeof parseEFFile !== 'function') {
        showError('共通ライブラリが読み込まれていません。', 'common.tsが正しく読み込まれていません。ページを再読み込みしてください。');
        return;
    }

    const executeButton = document.getElementById('executeButton');
    const fileInput = document.getElementById('fileInput');

    if (executeButton instanceof HTMLButtonElement && fileInput instanceof HTMLInputElement) {
        executeButton.addEventListener('click', handleExecute);
        fileInput.addEventListener('change', handleFileInputChange);
    }

    initializeUI();
});

function initializeUI(): void {
    const progressArea = document.createElement('div');
    progressArea.id = 'progressArea';
    progressArea.style.display = 'none';
    progressArea.innerHTML = `
    <div class="progress-container">
      <div id="progressBar" class="progress-bar"></div>
    </div>
    <p id="progressStatus">処理中: 0 / 0 ファイル</p>
  `;

    const resultArea = document.getElementById('resultArea');
    if (resultArea) {
        resultArea.parentNode?.insertBefore(progressArea, resultArea);
    }

    const statsArea = document.createElement('div');
    statsArea.id = 'statsArea';
    statsArea.style.display = 'none';
    if (resultArea) {
        resultArea.parentNode?.insertBefore(statsArea, resultArea);
    }

    const style = document.createElement('style');
    style.textContent = `
    .progress-container {
      width: 100%;
      background-color: #f0f0f0;
      border-radius: 4px;
      margin: 10px 0;
    }
    .progress-bar {
      height: 20px;
      width: 0;
      background-color: #4CAF50;
      border-radius: 4px;
      transition: width 0.3s;
    }
    #statsArea {
      margin: 10px 0;
      padding: 10px;
      background-color: #e7f3fe;
      border-left: 5px solid #2196F3;
    }
    .download-link {
      display: inline-block;
      margin: 10px 0;
      padding: 8px 16px;
      background-color: #2196F3;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .download-link:hover {
      background-color: #0b7dda;
    }
    .error-message {
      color: #D32F2F;
      background-color: #FFEBEE;
      padding: 10px;
      border-left: 5px solid #D32F2F;
      margin: 10px 0;
    }
  `;
    document.head.appendChild(style);
}

function handleFileInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    const executeButton = document.getElementById('executeButton') as HTMLButtonElement;

    if (executeButton) {
        executeButton.disabled = !files || files.length === 0;
    }

    if (files && files.length > 0) {
        const fileInfoArea = document.getElementById('fileInfoArea') || document.createElement('div');
        fileInfoArea.id = 'fileInfoArea';
        fileInfoArea.innerHTML = `<p>選択されたファイル: ${files.length}個</p>`;

        const fileList = Array.from(files).slice(0, 5).map(f => f.name).join('<br>');
        if (files.length > 5) {
            fileInfoArea.innerHTML += `<p>${fileList}<br>...(他 ${files.length - 5} ファイル)</p>`;
        } else {
            fileInfoArea.innerHTML += `<p>${fileList}</p>`;
        }

        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.parentNode?.insertBefore(fileInfoArea, fileInput.nextSibling);
        }
    }
}

function handleExecute(): void {
    if (AppState.isProcessing) return;

    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    const files = fileInput.files;

    if (!files || files.length === 0) {
        showError('ファイルが選択されていません', 'ファイルを選択してから実行してください。');
        return;
    }

    AppState.isProcessing = true;
    AppState.totalFiles = files.length;
    AppState.processedFiles = 0;
    AppState.cases = [];

    updateUI('processing');

    processFiles(files)
        .then(cases => {
            const resultCases = evaluateCases(cases);
            const outputText = formatResults(resultCases);
            const resultArea = document.getElementById('resultArea') as HTMLPreElement;
            if (resultArea) {
                resultArea.textContent = outputText;
            }

            createDownloadLink(outputText);
            showStatistics(cases, resultCases);

            AppState.isProcessing = false;
            updateUI('completed');
        })
        .catch(error => {
            console.error('処理エラー:', error);
            showError('処理中にエラーが発生しました', getErrorMessage(error));
            AppState.isProcessing = false;
            updateUI('error');
        });
}

async function processFiles(files: FileList): Promise<CaseData[]> {
    let cases: CaseData[] = [];

    for (let i = 0; i < files.length; i++) {
        try {
            const file = files[i];
            const content = await readFile(file);
            const parsedCases = parseEFFile(content);
            console.log(`ファイル ${file.name} から ${parsedCases.length} 件の症例データを抽出しました。`);
            cases = mergeCases(cases, parsedCases);
            AppState.processedFiles++;
            updateProgress();
        } catch (error) {
            console.error(`ファイル ${files[i].name} の処理中にエラーが発生しました:`, error);
            showError(`ファイル ${files[i].name} の処理中にエラーが発生しました`, getErrorMessage(error), true);
        }
    }

    return cases;
}

function updateProgress(): void {
    const percentage = (AppState.processedFiles / AppState.totalFiles) * 100;
    const progressBar = document.getElementById('progressBar');
    const progressStatus = document.getElementById('progressStatus');

    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
    }

    if (progressStatus) {
        progressStatus.textContent = `処理中: ${AppState.processedFiles} / ${AppState.totalFiles} ファイル`;
    }
}

function updateUI(state: 'idle' | 'processing' | 'completed' | 'error'): void {
    const executeButton = document.getElementById('executeButton') as HTMLButtonElement;
    const progressArea = document.getElementById('progressArea') as HTMLDivElement;
    const resultArea = document.getElementById('resultArea') as HTMLPreElement;
    const statsArea = document.getElementById('statsArea') as HTMLDivElement;

    if (!executeButton || !progressArea || !resultArea || !statsArea) return;

    switch (state) {
        case 'processing':
            executeButton.disabled = true;
            executeButton.textContent = '処理中...';
            progressArea.style.display = 'block';
            resultArea.textContent = '';
            statsArea.style.display = 'none';
            break;

        case 'completed':
            executeButton.disabled = false;
            executeButton.textContent = '実行';
            progressArea.style.display = 'none';
            statsArea.style.display = 'block';
            break;

        case 'error':
            executeButton.disabled = false;
            executeButton.textContent = '再実行';
            progressArea.style.display = 'none';
            break;

        case 'idle':
        default:
            executeButton.disabled = false;
            executeButton.textContent = '実行';
            progressArea.style.display = 'none';
            break;
    }
}

function showStatistics(allCases: CaseData[], resultCases: CaseData[]): void {
    const statsArea = document.getElementById('statsArea') as HTMLDivElement;
    if (!statsArea) return;

    const totalCases = allCases.length;
    const targetCases = resultCases.length;
    const percentage = totalCases > 0 ? (targetCases / totalCases * 100).toFixed(1) : 0;

    statsArea.innerHTML = `
    <h3>処理結果</h3>
    <p>全症例数: ${totalCases}件</p>
    <p>短期滞在手術等基本料３該当症例: ${targetCases}件 (${percentage}%)</p>
  `;

    statsArea.style.display = 'block';
}

function showError(title: string, message: string, isWarning: boolean = false): void {
    const errorContainer = document.getElementById('errorContainer') || document.createElement('div');
    errorContainer.id = 'errorContainer';
    errorContainer.className = 'error-message';

    errorContainer.innerHTML = `
    <h3>${title}</h3>
    <p>${message}</p>
  `;

    const executeButton = document.getElementById('executeButton') as HTMLButtonElement;
    if (executeButton) {
        executeButton.parentNode?.insertBefore(errorContainer, executeButton.nextSibling);
    }

    if (!isWarning) {
        console.error(title, message);
    }

    if (isWarning) {
        setTimeout(() => {
            errorContainer.style.opacity = '0';
            errorContainer.style.transition = 'opacity 0.5s';
            setTimeout(() => errorContainer.remove(), 500);
        }, 3000);
    }
}

function readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function (e: ProgressEvent<FileReader>) {
            if (e.target?.result) {
                resolve(e.target.result as string);
            } else {
                reject(new Error(`ファイル "${file.name}" の読み込みに失敗しました。`));
            }
        };

        reader.onerror = function (e: ProgressEvent<FileReader>) {
            reject(new Error(`ファイル "${file.name}" の読み込みに失敗しました。`));
        };

        try {
            reader.readAsText(file, 'Shift_JIS');
        } catch (error) {
            try {
                reader.readAsText(file, 'UTF-8');
            } catch (e) {
                reject(new Error(`ファイル "${file.name}" のエンコーディングを検出できませんでした。`));
            }
        }
    });
}

function createDownloadLink(text: string): void {
    let link = document.getElementById('downloadLink') as HTMLAnchorElement | null;
    if (!link) {
        link = document.createElement('a');
        link.id = 'downloadLink';
        link.className = 'download-link';
        link.textContent = '結果をダウンロード';

        const resultArea = document.getElementById('resultArea') as HTMLPreElement;
        if (resultArea) {
            resultArea.parentNode?.insertBefore(link, resultArea.nextSibling);
        }
    }

    const now = new Date();
    const dateStr = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
    const timeStr = `${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `短手３該当症例_${dateStr}_${timeStr}.txt`);
    link.style.display = 'inline-block';

    link.addEventListener('click', () => {
        setTimeout(() => URL.revokeObjectURL(url), 100);
    });
}