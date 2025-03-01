/**
 * 短期滞在手術等基本料３判定プログラム - メイン処理
 * このファイルには、ブラウザ上での実行に関する処理を定義しています。
 * 共通の処理ロジックはcommon.jsに定義されています。
 *
 * @author Your Team
 * @version 1.1.0
 * @license MIT
 */

/**
 * アプリケーションの状態を管理するオブジェクト
 * @type {Object}
 */
const AppState = {
    isProcessing: false,
    totalFiles: 0,
    processedFiles: 0,
    cases: []
};

/**
 * DOMが読み込まれたときの初期化処理
 */
document.addEventListener('DOMContentLoaded', function () {
    // common.jsが読み込まれていることを確認
    if (typeof parseEFFile !== 'function') {
        showError('共通ライブラリが読み込まれていません。', 'common.jsが正しく読み込まれていません。ページを再読み込みしてください。');
        return;
    }

    // イベントリスナー設定
    document.getElementById('executeButton').addEventListener('click', handleExecute);
    document.getElementById('fileInput').addEventListener('change', handleFileInputChange);

    // UI要素の初期化
    initializeUI();
});

/**
 * UI要素の初期化
 */
function initializeUI() {
    // 進捗表示用のエリア作成
    const progressArea = document.createElement('div');
    progressArea.id = 'progressArea';
    progressArea.style.display = 'none';
    progressArea.innerHTML = `
        <div class="progress-container">
            <div id="progressBar" class="progress-bar"></div>
        </div>
        <p id="progressStatus">処理中: 0 / 0 ファイル</p>
    `;

    // 結果エリアの前に挿入
    const resultArea = document.getElementById('resultArea');
    resultArea.parentNode.insertBefore(progressArea, resultArea);

    // 結果の統計情報エリア作成
    const statsArea = document.createElement('div');
    statsArea.id = 'statsArea';
    statsArea.style.display = 'none';
    resultArea.parentNode.insertBefore(statsArea, resultArea);

    // スタイルを追加
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

/**
 * ファイル選択時のハンドラ
 * @param {Event} event - ファイル選択イベント
 */
function handleFileInputChange(event) {
    const files = event.target.files;
    document.getElementById('executeButton').disabled = files.length === 0;

    // ファイル情報を表示
    if (files.length > 0) {
        const fileInfoArea = document.getElementById('fileInfoArea') || document.createElement('div');
        fileInfoArea.id = 'fileInfoArea';
        fileInfoArea.innerHTML = `<p>選択されたファイル: ${files.length}個</p>`;

        // ファイル名リストを表示（最大5つまで）
        const fileList = Array.from(files).slice(0, 5).map(f => f.name).join('<br>');
        if (files.length > 5) {
            fileInfoArea.innerHTML += `<p>${fileList}<br>...(他 ${files.length - 5} ファイル)</p>`;
        } else {
            fileInfoArea.innerHTML += `<p>${fileList}</p>`;
        }

        const fileInput = document.getElementById('fileInput');
        fileInput.parentNode.insertBefore(fileInfoArea, fileInput.nextSibling);
    }
}

/**
 * 実行ボタンのクリックハンドラ
 * ファイルを読み込み、処理を実行します
 */
function handleExecute() {
    // 処理中の場合は何もしない
    if (AppState.isProcessing) return;

    const files = document.getElementById('fileInput').files;
    if (files.length === 0) {
        showError('ファイルが選択されていません', 'ファイルを選択してから実行してください。');
        return;
    }

    // 処理開始
    AppState.isProcessing = true;
    AppState.totalFiles = files.length;
    AppState.processedFiles = 0;
    AppState.cases = [];

    // UI更新
    updateUI('processing');

    // ファイル読み込みとデータ処理
    processFiles(files)
        .then(cases => {
            // 短手３該当症例の判定処理
            const resultCases = evaluateCases(cases);

            // 結果をタブ区切りテキストに整形
            const outputText = formatResults(resultCases);
            document.getElementById('resultArea').textContent = outputText;

            // 結果のダウンロードリンクと統計情報を生成
            createDownloadLink(outputText);
            showStatistics(cases, resultCases);

            // 処理完了
            AppState.isProcessing = false;
            updateUI('completed');
        })
        .catch(error => {
            console.error('処理エラー:', error);
            showError('処理中にエラーが発生しました', error.message);

            // エラー発生時も処理完了とする
            AppState.isProcessing = false;
            updateUI('error');
        });
}

/**
 * 複数ファイルを処理する関数
 * @param {FileList} files - 処理対象のファイルリスト
 * @returns {Promise<Object[]>} - 統合された症例データを返すPromise
 */
async function processFiles(files) {
    let cases = [];

    // 各ファイルを順番に処理
    for (let i = 0; i < files.length; i++) {
        try {
            const file = files[i];
            const content = await readFile(file);

            // ファイル内容を解析
            const parsedCases = parseEFFile(content);
            console.log(`ファイル ${file.name} から ${parsedCases.length} 件の症例データを抽出しました。`);

            // 既存の症例データと統合
            cases = mergeCases(cases, parsedCases);

            // 進捗を更新
            AppState.processedFiles++;
            updateProgress();

        } catch (error) {
            console.error(`ファイル ${files[i].name} の処理中にエラーが発生しました:`, error);
            // エラーを表示するが、処理は続行
            showError(`ファイル ${files[i].name} の処理中にエラーが発生しました`, error.message, true);
        }
    }

    return cases;
}

/**
 * 進捗状況を更新する関数
 */
function updateProgress() {
    const percentage = (AppState.processedFiles / AppState.totalFiles) * 100;
    document.getElementById('progressBar').style.width = `${percentage}%`;
    document.getElementById('progressStatus').textContent =
        `処理中: ${AppState.processedFiles} / ${AppState.totalFiles} ファイル`;
}

/**
 * UIの状態を更新する関数
 * @param {string} state - UI状態 ('idle', 'processing', 'completed', 'error')
 */
function updateUI(state) {
    const executeButton = document.getElementById('executeButton');
    const progressArea = document.getElementById('progressArea');
    const resultArea = document.getElementById('resultArea');
    const statsArea = document.getElementById('statsArea');

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

/**
 * 統計情報を表示する関数
 * @param {Object[]} allCases - 全症例データ
 * @param {Object[]} resultCases - 短手３該当症例データ
 */
function showStatistics(allCases, resultCases) {
    const statsArea = document.getElementById('statsArea');

    // 集計情報
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

/**
 * エラーメッセージを表示する関数
 * @param {string} title - エラーのタイトル
 * @param {string} message - エラーの詳細メッセージ
 * @param {boolean} isWarning - 警告として表示するか（処理を続行する場合はtrue）
 */
function showError(title, message, isWarning = false) {
    const errorContainer = document.getElementById('errorContainer') || document.createElement('div');
    errorContainer.id = 'errorContainer';
    errorContainer.className = 'error-message';

    errorContainer.innerHTML = `
        <h3>${title}</h3>
        <p>${message}</p>
    `;

    // エラーメッセージをページに追加
    const executeButton = document.getElementById('executeButton');
    executeButton.parentNode.insertBefore(errorContainer, executeButton.nextSibling);

    // 警告でない場合のみコンソールにエラーを出力
    if (!isWarning) {
        console.error(title, message);
    }

    // 3秒後に自動的に消える（警告の場合のみ）
    if (isWarning) {
        setTimeout(() => {
            errorContainer.style.opacity = '0';
            errorContainer.style.transition = 'opacity 0.5s';
            setTimeout(() => errorContainer.remove(), 500);
        }, 3000);
    }
}

/**
 * ファイル読み込みをPromiseで処理する関数
 * @param {File} file - 読み込むファイルオブジェクト
 * @returns {Promise<string>} - ファイルの内容を返すPromise
 */
function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function (e) {
            resolve(e.target.result);
        };

        reader.onerror = function (e) {
            reject(new Error(`ファイル "${file.name}" の読み込みに失敗しました。`));
        };

        // エンコーディングの自動検出（Shift-JIS対応）
        try {
            reader.readAsText(file, 'Shift_JIS');
        } catch (error) {
            // Shift-JISで失敗した場合はUTF-8で試行
            try {
                reader.readAsText(file, 'UTF-8');
            } catch (e) {
                reject(new Error(`ファイル "${file.name}" のエンコーディングを検出できませんでした。`));
            }
        }
    });
}

/**
 * 結果をダウンロード可能なリンクを生成する関数
 * @param {string} text - ダウンロード対象のテキスト
 */
function createDownloadLink(text) {
    let link = document.getElementById('downloadLink');
    if (!link) {
        link = document.createElement('a');
        link.id = 'downloadLink';
        link.className = 'download-link';
        link.textContent = '結果をダウンロード';

        // 結果エリアの後に挿入
        const resultArea = document.getElementById('resultArea');
        resultArea.parentNode.insertBefore(link, resultArea.nextSibling);
    }

    // ファイル名に日時を追加
    const now = new Date();
    const dateStr = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
    const timeStr = `${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `短手３該当症例_${dateStr}_${timeStr}.txt`;
    link.style.display = 'inline-block';

    // 古いBlobのURLを解放
    link.addEventListener('click', () => {
        setTimeout(() => URL.revokeObjectURL(url), 100);
    });
}