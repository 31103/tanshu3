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

    // 状態管理
    let currentStep = 0;
    let validFiles = 0;

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

        // ボタンを有効化
        clearButton.disabled = false;
        executeButton.disabled = validFiles === 0;

        // ファイル情報を表示
        let fileInfoHTML = '';
        Array.from(window.selectedFiles).forEach(file => {
            const fileStatus = file.validationStatus || 'pending';
            let statusClass = '';
            let statusText = '';

            switch (fileStatus) {
                case 'valid':
                    statusClass = 'status-valid';
                    statusText = '有効';
                    break;
                case 'warning':
                    statusClass = 'status-warning';
                    statusText = '警告あり';
                    break;
                case 'error':
                    statusClass = 'status-error';
                    statusText = 'エラー';
                    break;
                default:
                    statusClass = '';
                    statusText = '検証中...';
            }

            fileInfoHTML += `
                <div class="file-item">
                    <span class="file-icon">📄</span>
                    <span class="file-name">${file.name}</span>
                    ${statusText ? `<span class="file-status ${statusClass}">${statusText}</span>` : ''}
                </div>
            `;
        });

        fileInfoArea.innerHTML = fileInfoHTML;
    }

    /**
     * 追加されたファイルのバリデーションを実行する関数
     * @param {Array<File>} files - バリデーション対象のファイル配列
     */
    async function validateFiles(files) {
        if (files.length === 0 || typeof validateEFFile !== 'function') return;

        // バリデーション中フィードバックを表示
        showToast('info', 'ファイル検証中', 'ファイルのフォーマットを検証しています...');

        let hasErrors = false;
        let warnings = [];
        validFiles = 0;

        // 各ファイルを検証
        for (const file of files) {
            try {
                const content = await readFileAsText(file);
                const validationResult = validateEFFile(content);

                // ファイルに検証結果を関連付ける
                if (window.selectedFiles) {
                    Array.from(window.selectedFiles).forEach(selectedFile => {
                        if (selectedFile.name === file.name) {
                            if (!validationResult.isValid) {
                                selectedFile.validationStatus = 'error';
                            } else if (validationResult.warnings.length > 0) {
                                selectedFile.validationStatus = 'warning';
                                validFiles++;
                            } else {
                                selectedFile.validationStatus = 'valid';
                                validFiles++;
                            }
                        }
                    });
                }

                // エラーがある場合は処理を中断
                if (!validationResult.isValid) {
                    const errorMessages = validationResult.errors.join('<br>');
                    showToast('error', 'ファイル形式エラー', `ファイル「${file.name}」は入院統合EFファイルのフォーマットに準拠していません。`);
                    hasErrors = true;
                    break;
                }

                // 警告がある場合は収集
                if (validationResult.warnings.length > 0) {
                    warnings.push(`ファイル「${file.name}」: ${validationResult.warnings.join(' ')}`);
                }
            } catch (error) {
                console.error(`ファイル ${file.name} の検証中にエラーが発生しました:`, error);
                showToast('error', '検証エラー', `ファイル「${file.name}」の検証中にエラーが発生しました`);
                hasErrors = true;
                break;
            }
        }

        // ファイル情報表示を更新
        updateFileInfo();

        // エラーがなく警告がある場合
        if (!hasErrors && warnings.length > 0) {
            // 警告メッセージを表示
            if (warnings.length > 3) {
                // 警告が多すぎる場合は省略
                showToast('warning', '検証警告', `一部のファイルに注意が必要です (${warnings.length}件の警告)`);
            } else {
                showToast('warning', '検証警告', warnings.join('\n'));
            }
        } else if (!hasErrors) {
            // すべて正常の場合
            showToast('success', '検証完了', 'すべてのファイルは入院統合EFファイルのフォーマットに準拠しています');
        }

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
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('ファイルの読み込みに失敗しました'));
            reader.readAsText(file);
        });
    }

    /**
     * クリアボタン押下時の処理
     */
    clearButton.addEventListener('click', function () {
        // ファイル選択をリセット
        fileInput.value = '';

        // FileListを空にするためのダミーのDataTransferを作成
        const dt = new DataTransfer();
        fileInput.files = dt.files;

        // グローバル変数もクリア
        window.selectedFiles = null;
        validFiles = 0;

        // ファイル情報表示をリセット
        updateFileInfo();

        // 結果表示をクリア
        resultTextarea.value = '';
        copyButton.disabled = true;

        // ダウンロードリンクを非表示
        downloadLink.style.display = 'none';

        // ステップをリセット
        updateStep(0);

        // フィードバックを表示
        showToast('info', 'クリア完了', '選択されたファイルと結果をクリアしました');
    });

    /**
     * 出力設定を取得する関数
     * @returns {Object} 出力設定オブジェクト
     */
    function getOutputSettings() {
        // 出力モード設定の取得
        const showAllCases = document.getElementById('allCases').checked;

        // 日付フォーマット設定の取得
        const dateFormatElements = document.getElementsByName('dateFormat');
        let dateFormat = 'yyyymmdd'; // デフォルト値

        for (const element of dateFormatElements) {
            if (element.checked) {
                dateFormat = element.value;
                break;
            }
        }

        return {
            showAllCases: showAllCases,
            dateFormat: dateFormat
        };
    }

    /**
     * 実行ボタン押下時の処理
     */
    executeButton.addEventListener('click', function () {
        if (!window.selectedFiles || window.selectedFiles.length === 0) return;

        // 必要な関数が存在するか確認
        if (typeof parseEFFile !== 'function' || typeof evaluateCases !== 'function' || typeof formatResults !== 'function') {
            resultTextarea.value = 'エラー: 必要なモジュールが読み込まれていません。';
            showToast('error', '実行エラー', '必要なモジュールが読み込まれていません');
            console.error('必要な関数が見つかりません。スクリプトが正しく読み込まれているか確認してください。');
            return;
        }

        // ステップを更新
        updateStep(2); // 処理実行ステップへ

        // 処理中表示
        if (loadingIndicator) {
            loadingIndicator.classList.add('active');
        }

        // 処理結果をクリア
        resultTextarea.value = '処理中...';

        // 出力設定を取得
        const outputSettings = getOutputSettings();

        // 非同期処理を開始
        setTimeout(() => {
            try {
                // ファイル処理を開始
                const filePromises = Array.from(window.selectedFiles).map(file => {
                    return readFileAsText(file).then(content => {
                        return {
                            fileName: file.name,
                            content: content
                        };
                    });
                });

                // すべてのファイルを読み込んだ後の処理
                Promise.all(filePromises)
                    .then(fileDataArray => {
                        // 各ファイルを解析
                        const parsedDataArray = fileDataArray.map(fileData => {
                            return parseEFFile(fileData.content);
                        });

                        // 解析結果を評価
                        const evaluationResult = evaluateCases(parsedDataArray);

                        // 結果をフォーマット
                        const formattedResult = formatResults(evaluationResult, outputSettings);

                        // 結果を表示
                        resultTextarea.value = formattedResult;

                        // コピーボタンを有効化
                        copyButton.disabled = false;

                        // ダウンロードリンクを設定
                        const blob = new Blob([formattedResult], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        downloadLink.href = url;
                        downloadLink.style.display = 'inline-flex';

                        // 処理完了メッセージ
                        showToast('success', '処理完了', '短手３該当症例の判定が完了しました');

                        // ステップを更新
                        updateStep(3); // 結果確認ステップへ
                    })
                    .catch(error => {
                        console.error('ファイル処理中にエラーが発生しました:', error);
                        resultTextarea.value = `エラー: ${error.message || 'ファイル処理中に問題が発生しました。'}`;
                        showToast('error', '処理エラー', 'ファイル処理中にエラーが発生しました');
                    })
                    .finally(() => {
                        // 処理中表示を非表示
                        if (loadingIndicator) {
                            loadingIndicator.classList.remove('active');
                        }
                    });
            } catch (error) {
                console.error('処理実行中にエラーが発生しました:', error);
                resultTextarea.value = `エラー: ${error.message || '処理実行中に問題が発生しました。'}`;
                showToast('error', '実行エラー', '処理実行中にエラーが発生しました');

                // 処理中表示を非表示
                if (loadingIndicator) {
                    loadingIndicator.classList.remove('active');
                }
            }
        }, 100); // 少し遅延させてUIの更新を確実にする
    });

    /**
     * コピーボタン押下時の処理
     */
    copyButton.addEventListener('click', function () {
        if (!resultTextarea.value) return;

        // テキストエリアの内容をクリップボードにコピー
        resultTextarea.select();
        document.execCommand('copy');

        // 選択を解除
        window.getSelection().removeAllRanges();

        // コピー成功メッセージを表示
        copyMessage.textContent = 'クリップボードにコピーしました！';

        // トースト通知も表示
        showToast('success', 'コピー完了', '結果をクリップボードにコピーしました');

        // 一定時間後にメッセージを消す
        setTimeout(() => {
            copyMessage.textContent = '';
        }, 3000);
    });

    // 初期ステップを設定
    updateStep(0);
}); 