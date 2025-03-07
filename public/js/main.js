/**
 * 短期滞在手術等基本料３判定プログラム - UIロジック
 * 
 * このファイルは、ユーザーインターフェースの操作とフィードバックを管理します。
 * ファイル選択、バリデーション、処理実行、結果表示などの機能を提供します。
 */
document.addEventListener('DOMContentLoaded', function () {
    // DOM要素の取得
    const fileInput = document.getElementById('fileInput');
    const fileSelectButton = document.getElementById('fileSelectButton');
    const fileInfoArea = document.getElementById('fileInfoArea');
    const executeButton = document.getElementById('executeButton');
    const clearButton = document.getElementById('clearButton');
    const resultTextarea = document.getElementById('resultTextarea');
    const copyButton = document.getElementById('copyButton');
    const copyMessage = document.getElementById('copyMessage');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const dropArea = document.getElementById('dropArea');
    const downloadLink = document.getElementById('downloadLink');
    const eligibleOnlyRadio = document.getElementById('eligibleOnly');
    const allCasesRadio = document.getElementById('allCases');
    const toastContainer = document.getElementById('toastContainer');
    const steps = document.querySelectorAll('.step');
    const fileProcessing = document.getElementById('fileProcessing');
    const textViewButton = document.getElementById('textViewButton');
    const tableViewButton = document.getElementById('tableViewButton');
    const textResultView = document.getElementById('textResultView');
    const tableResultView = document.getElementById('tableResultView');
    const resultTable = document.getElementById('resultTable');

    // 状態管理
    let currentStep = 0;
    let validFiles = 0;
    let currentView = 'text'; // 'text' または 'table'

    /**
     * ステップ管理
     * 現在のステップを更新し、UIに反映します
     * @param {number} stepIndex - 設定するステップのインデックス
     */
    function updateStep(stepIndex) {
        // 前のステップをすべて完了状態に
        for (let i = 0; i < steps.length; i++) {
            if (i < stepIndex) {
                steps[i].classList.remove('active');
                steps[i].classList.add('completed');
                steps[i].removeAttribute('aria-current');
            } else if (i === stepIndex) {
                steps[i].classList.add('active');
                steps[i].classList.remove('completed');
                steps[i].setAttribute('aria-current', 'step');
            } else {
                steps[i].classList.remove('active', 'completed');
                steps[i].removeAttribute('aria-current');
            }
        }
        currentStep = stepIndex;
    }

    /**
     * トースト通知を表示する関数
     * @param {string} type - 通知タイプ（success, warning, error, info）
     * @param {string} title - 通知タイトル
     * @param {string} message - 通知メッセージ
     * @param {number} duration - 表示時間（ミリ秒）
     */
    function showToast(type, title, message, duration = 5000) {
        // トーストのHTML構造を作成
        const toastId = 'toast-' + Date.now();
        const toast = document.createElement('div');
        toast.id = toastId;
        toast.className = `toast toast-${type}`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');

        // アイコンを設定
        let icon = '';
        switch (type) {
            case 'success': icon = '✅'; break;
            case 'warning': icon = '⚠️'; break;
            case 'error': icon = '❌'; break;
            case 'info': icon = 'ℹ️'; break;
        }

        // トーストの内容を設定
        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-content">
                <h3 class="toast-title">${title}</h3>
                <p class="toast-message">${message}</p>
            </div>
            <button class="toast-close" aria-label="通知を閉じる">×</button>
        `;

        // トーストをコンテナに追加
        toastContainer.appendChild(toast);

        // 閉じるボタンのイベントリスナーを設定
        const closeButton = toast.querySelector('.toast-close');
        closeButton.addEventListener('click', () => {
            removeToast(toastId);
        });

        // 一定時間後に自動的に閉じる
        setTimeout(() => {
            removeToast(toastId);
        }, duration);
    }

    /**
     * トースト通知を削除する関数
     * @param {string} toastId - 削除するトーストのID
     */
    function removeToast(toastId) {
        const toast = document.getElementById(toastId);
        if (toast) {
            // フェードアウトのためのクラスを追加
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';

            // アニメーション完了後に要素を削除
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }
    }

    // ファイル選択ボタンのクリックイベント
    fileSelectButton.addEventListener('click', () => {
        fileInput.click();
    });

    // ドラッグ&ドロップ処理
    dropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropArea.classList.add('drag-over');
    });

    dropArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropArea.classList.remove('drag-over');
    });

    dropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        dropArea.classList.remove('drag-over');

        if (e.dataTransfer.files.length > 0) {
            // ドロップされたファイルを処理
            processNewFiles(Array.from(e.dataTransfer.files));
        }
    });

    // キーボード操作のサポート
    dropArea.addEventListener('keydown', (e) => {
        // Enterキーまたはスペースキーでファイル選択ダイアログを開く
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInput.click();
        }
    });

    // ドロップエリア全体をクリック可能に
    dropArea.addEventListener('click', (e) => {
        // buttonの場合は、buttonのイベントに任せる
        if (e.target.tagName !== 'BUTTON') {
            fileInput.click();
        }
    });

    // ファイル選択時の処理
    fileInput.addEventListener('change', () => {
        // 選択されたファイルを処理
        processNewFiles(Array.from(fileInput.files));
    });

    /**
     * 新しく選択されたファイルを処理する関数
     * @param {Array<File>} files - 処理対象のファイル配列
     */
    function processNewFiles(files) {
        // テキストファイルのみをフィルタリング
        const textFiles = files.filter(file => file.name.endsWith('.txt'));

        if (textFiles.length === 0) {
            showToast('error', 'ファイル形式エラー', 'テキストファイル(.txt)のみ追加できます');
            return;
        }

        // DataTransferオブジェクトを使用して新しいFileListを作成
        const dt = new DataTransfer();

        // 重複するファイルを除外するために名前を追跡
        const fileNames = new Set();
        let duplicateCount = 0;

        // 既存のファイルがあれば追加
        if (window.selectedFiles) {
            Array.from(window.selectedFiles).forEach(file => {
                fileNames.add(file.name);
                dt.items.add(file);
            });
        }

        // 新しいファイルを追加（重複を除外）
        textFiles.forEach(file => {
            if (!fileNames.has(file.name)) {
                fileNames.add(file.name);
                dt.items.add(file);
            } else {
                duplicateCount++;
            }
        });

        // フィードバックメッセージを表示
        if (duplicateCount > 0) {
            if (duplicateCount === textFiles.length) {
                showToast('warning', 'ファイル重複', 'すべてのファイルが既に追加されています');
            } else {
                showToast('success', 'ファイル追加完了', `${textFiles.length - duplicateCount}ファイルを追加しました (${duplicateCount}ファイルは重複)`);
            }
        } else {
            showToast('success', 'ファイル追加完了', `${textFiles.length}ファイルを追加しました`);
        }

        // グローバル変数に保存
        window.selectedFiles = dt.files;

        // input要素のfilesプロパティを更新
        fileInput.files = dt.files;

        // ファイル情報表示を更新
        updateFileInfo();

        // 追加したファイルのバリデーションを実行
        validateFiles(textFiles.filter(file => !fileNames.has(file.name) || duplicateCount === 0));

        // ステップ1が完了したら次のステップへ
        if (window.selectedFiles && window.selectedFiles.length > 0) {
            updateStep(1); // 設定ステップへ
        }
    }

    /**
     * ファイル情報表示を更新する関数
     */
    function updateFileInfo() {
        // ファイルが選択されているか確認
        if (!window.selectedFiles || window.selectedFiles.length === 0) {
            fileInfoArea.innerHTML = '<p class="no-file-message">ファイルが選択されていません</p>';
            clearButton.disabled = true;
            executeButton.disabled = true;
            return;
        }

        // ファイル情報を表示するHTMLを生成
        let html = '';
        Array.from(window.selectedFiles).forEach(file => {
            const fileStatus = file.validationStatus || { status: 'pending', messages: [] };
            let statusClass = '';
            let statusText = '';

            switch (fileStatus.status) {
                case 'valid':
                    statusClass = 'status-valid';
                    statusText = '有効';
                    break;
                case 'warning':
                    statusClass = 'status-warning';
                    statusText = '警告';
                    break;
                case 'error':
                    statusClass = 'status-error';
                    statusText = 'エラー';
                    break;
                default:
                    statusClass = '';
                    statusText = '検証中...';
            }

            html += `
                <div class="file-item">
                    <div class="file-icon">📄</div>
                    <div class="file-name">${file.name}</div>
                    <div class="file-status ${statusClass}">${statusText}</div>
                </div>
            `;

            // バリデーションメッセージがある場合は表示
            if (fileStatus.messages && fileStatus.messages.length > 0) {
                html += '<div class="validation-feedback">';
                fileStatus.messages.forEach(msg => {
                    let icon = '';
                    switch (msg.type) {
                        case 'error': icon = '❌'; break;
                        case 'warning': icon = '⚠️'; break;
                        case 'info': icon = 'ℹ️'; break;
                    }
                    html += `
                        <div class="validation-message">
                            <span class="validation-icon">${icon}</span>
                            <span class="validation-text">${msg.text}</span>
                        </div>
                    `;
                });
                html += '</div>';
            }
        });

        fileInfoArea.innerHTML = html;
        clearButton.disabled = false;

        // 有効なファイルがあれば実行ボタンを有効化
        executeButton.disabled = validFiles === 0;
    }

    /**
     * ファイルのバリデーションを実行する関数
     * @param {Array<File>} files - バリデーション対象のファイル配列
     */
    async function validateFiles(files) {
        if (!files || files.length === 0) return;

        // ファイル処理中インジケーターを表示
        fileProcessing.style.display = 'flex';

        // 各ファイルを順番に処理
        for (const file of files) {
            try {
                // ファイルの内容を読み込む
                const content = await readFileAsText(file);

                // バリデーション実行
                // ここでは仮のバリデーション結果を設定
                // 実際のアプリケーションでは、validateEFFile関数を使用
                const validationResult = window.validateEFFile ?
                    window.validateEFFile(content) :
                    { isValid: true, warnings: [], errors: [] };

                // ファイルにバリデーション結果を付与
                if (validationResult.isValid && validationResult.warnings.length === 0) {
                    file.validationStatus = {
                        status: 'valid',
                        messages: []
                    };
                    validFiles++;
                } else if (validationResult.isValid && validationResult.warnings.length > 0) {
                    file.validationStatus = {
                        status: 'warning',
                        messages: validationResult.warnings.map(w => ({ type: 'warning', text: w }))
                    };
                    validFiles++;
                } else {
                    file.validationStatus = {
                        status: 'error',
                        messages: validationResult.errors.map(e => ({ type: 'error', text: e }))
                    };
                }

                // ファイル情報表示を更新
                updateFileInfo();

            } catch (error) {
                console.error('ファイル処理エラー:', error);
                file.validationStatus = {
                    status: 'error',
                    messages: [{ type: 'error', text: 'ファイルの読み込みに失敗しました' }]
                };
                updateFileInfo();
            }
        }

        // ファイル処理中インジケーターを非表示
        fileProcessing.style.display = 'none';

        // 実行ボタンの状態を更新
        executeButton.disabled = validFiles === 0;
    }

    /**
     * ファイルをテキストとして読み込む関数
     * @param {File} file - 読み込むファイル
     * @returns {Promise<string>} ファイルの内容
     */
    function readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = event => resolve(event.target.result);
            reader.onerror = error => reject(error);
            reader.readAsText(file);
        });
    }

    // クリアボタンのクリックイベント
    clearButton.addEventListener('click', () => {
        // 選択されたファイルをクリア
        window.selectedFiles = null;
        fileInput.value = '';
        validFiles = 0;

        // ファイル情報表示を更新
        updateFileInfo();

        // ステップを最初に戻す
        updateStep(0);

        showToast('info', 'クリア完了', 'ファイル選択をクリアしました');
    });

    // 実行ボタンのクリックイベント
    executeButton.addEventListener('click', async () => {
        if (!window.selectedFiles || window.selectedFiles.length === 0) {
            showToast('error', '実行エラー', 'ファイルが選択されていません');
            return;
        }

        // ステップを更新
        updateStep(2); // 処理実行ステップへ

        // ローディングインジケーターを表示
        loadingIndicator.classList.add('active');

        // 結果表示エリアをクリア
        resultTextarea.value = '';
        clearResultTable();

        // 結果操作ボタンを無効化
        copyButton.disabled = true;
        downloadLink.style.display = 'none';

        try {
            // 出力設定を取得
            const outputSettings = getOutputSettings();

            // ファイルの内容を読み込む
            const fileContents = await Promise.all(
                Array.from(window.selectedFiles).map(file => readFileAsText(file))
            );

            // 処理実行（実際のアプリケーションではprocessEFFilesを使用）
            const result = window.processEFFiles ?
                window.processEFFiles(fileContents, outputSettings) :
                '処理結果のサンプル\nデータ識別番号\t入院年月日\t退院年月日\t短手３対象症例\t理由\n123456\t20240101\t20240103\tYes\t内視鏡的大腸ポリープ・粘膜切除術';

            // 結果を表示
            resultTextarea.value = result;

            // テーブル表示も更新
            updateResultTable(result);

            // 結果操作ボタンを有効化
            copyButton.disabled = false;

            // ダウンロードリンクを設定
            const blob = new Blob([result], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            downloadLink.href = url;
            downloadLink.style.display = 'inline-flex';

            // ステップを更新
            updateStep(3); // 結果確認ステップへ

            showToast('success', '処理完了', '処理が正常に完了しました');

        } catch (error) {
            console.error('処理エラー:', error);
            showToast('error', '処理エラー', error.message || '処理中にエラーが発生しました');
        } finally {
            // ローディングインジケーターを非表示
            loadingIndicator.classList.remove('active');
        }
    });

    /**
     * 出力設定を取得する関数
     * @returns {Object} 出力設定オブジェクト
     */
    function getOutputSettings() {
        return {
            outputMode: eligibleOnlyRadio.checked ? 'eligibleOnly' : 'allCases',
            dateFormat: document.querySelector('input[name="dateFormat"]:checked').value
        };
    }

    // コピーボタンのクリックイベント
    copyButton.addEventListener('click', () => {
        if (!resultTextarea.value) return;

        // テキストをクリップボードにコピー
        resultTextarea.select();
        document.execCommand('copy');

        // 選択を解除
        window.getSelection().removeAllRanges();

        // コピー成功メッセージを表示
        copyMessage.textContent = 'コピーしました！';
        copyMessage.classList.add('visible');

        // メッセージを一定時間後に消す
        setTimeout(() => {
            copyMessage.classList.remove('visible');
        }, 2000);
    });

    // 表示切替ボタンのイベント
    textViewButton.addEventListener('click', () => {
        setResultView('text');
    });

    tableViewButton.addEventListener('click', () => {
        setResultView('table');
    });

    /**
     * 結果表示モードを設定する関数
     * @param {string} viewMode - 表示モード ('text' または 'table')
     */
    function setResultView(viewMode) {
        currentView = viewMode;

        if (viewMode === 'text') {
            textResultView.style.display = 'block';
            tableResultView.style.display = 'none';
            textViewButton.classList.add('active');
            tableViewButton.classList.remove('active');
            textViewButton.setAttribute('aria-pressed', 'true');
            tableViewButton.setAttribute('aria-pressed', 'false');
        } else {
            textResultView.style.display = 'none';
            tableResultView.style.display = 'block';
            textViewButton.classList.remove('active');
            tableViewButton.classList.add('active');
            textViewButton.setAttribute('aria-pressed', 'false');
            tableViewButton.setAttribute('aria-pressed', 'true');
        }
    }

    /**
     * 結果テーブルをクリアする関数
     */
    function clearResultTable() {
        const tbody = resultTable.querySelector('tbody');
        tbody.innerHTML = '';
    }

    /**
     * 結果テーブルを更新する関数
     * @param {string} resultText - タブ区切りのテキスト結果
     */
    function updateResultTable(resultText) {
        if (!resultText) return;

        const tbody = resultTable.querySelector('tbody');
        tbody.innerHTML = '';

        // テキストを行に分割
        const lines = resultText.trim().split('\n');

        // ヘッダー行をスキップして2行目から処理
        for (let i = 1; i < lines.length; i++) {
            const columns = lines[i].split('\t');

            // 行が正しいフォーマットかチェック
            if (columns.length >= 5) {
                const row = document.createElement('tr');

                // 各列のデータをセルに追加
                for (let j = 0; j < 5; j++) {
                    const cell = document.createElement('td');
                    cell.textContent = columns[j];

                    // 短手３対象症例の列に特別なスタイルを適用
                    if (j === 3) {
                        if (columns[j] === 'Yes') {
                            cell.classList.add('eligible-yes');
                        } else {
                            cell.classList.add('eligible-no');
                        }
                    }

                    row.appendChild(cell);
                }

                tbody.appendChild(row);
            }
        }
    }

    // 初期化
    updateStep(0);
    setResultView('text');
}); 