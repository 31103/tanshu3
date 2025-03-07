/**
 * ファイル選択処理を管理するスクリプト
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
            showDropFeedback('error', 'テキストファイル(.txt)のみ追加できます');
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
                showDropFeedback('warning', 'すべてのファイルが既に追加されています');
            } else {
                showDropFeedback('success', `${textFiles.length - duplicateCount}ファイルを追加しました (${duplicateCount}ファイルは重複)`);
            }
        } else {
            showDropFeedback('success', `${textFiles.length}ファイルを追加しました`);
        }

        // グローバル変数に保存
        window.selectedFiles = dt.files;

        // input要素のfilesプロパティを更新
        fileInput.files = dt.files;

        // ファイル情報表示を更新
        updateFileInfo();

        // 追加したファイルのバリデーションを実行
        validateFiles(textFiles.filter(file => !fileNames.has(file.name) || duplicateCount === 0));
    }

    /**
     * 追加されたファイルのバリデーションを実行する関数
     * @param {Array<File>} files - バリデーション対象のファイル配列
     */
    async function validateFiles(files) {
        if (files.length === 0 || typeof validateEFFile !== 'function') return;

        // バリデーション中フィードバックを表示
        showDropFeedback('info', 'ファイルのフォーマットを検証中...');

        let hasErrors = false;
        let warnings = [];

        // 各ファイルを検証
        for (const file of files) {
            try {
                const content = await readFileAsText(file);
                const validationResult = validateEFFile(content);

                // エラーがある場合は処理を中断
                if (!validationResult.isValid) {
                    const errorMessages = validationResult.errors.join('<br>');
                    showDropFeedback('error', `ファイル「${file.name}」は入院統合EFファイルのフォーマットに準拠していません。<br>${errorMessages}`);
                    hasErrors = true;
                    break;
                }

                // 警告がある場合は収集
                if (validationResult.warnings.length > 0) {
                    warnings.push(`ファイル「${file.name}」: ${validationResult.warnings.join(' ')}`);
                }
            } catch (error) {
                console.error(`ファイル ${file.name} の検証中にエラーが発生しました:`, error);
                showDropFeedback('error', `ファイル「${file.name}」の検証中にエラーが発生しました: ${error.message || 'Unknown error'}`);
                hasErrors = true;
                break;
            }
        }

        // エラーがなく警告がある場合
        if (!hasErrors && warnings.length > 0) {
            // 警告メッセージを表示
            if (warnings.length > 3) {
                // 警告が多すぎる場合は省略
                showDropFeedback('warning', `一部のファイルに注意が必要です: <br>${warnings.slice(0, 3).join('<br>')}<br>...(他 ${warnings.length - 3} 件の警告)`);
            } else {
                showDropFeedback('warning', `一部のファイルに注意が必要です: <br>${warnings.join('<br>')}`);
            }
        } else if (!hasErrors) {
            // すべて正常の場合
            showDropFeedback('success', 'すべてのファイルは入院統合EFファイルのフォーマットに準拠しています。');
        }
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

        // ファイル情報表示をリセット
        updateFileInfo();

        // 結果表示をクリア
        resultTextarea.value = '';
        copyButton.disabled = true;

        // ダウンロードリンクを非表示
        downloadLink.style.display = 'none';
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
        if (fileInput.files.length === 0) return;

        // 必要な関数が存在するか確認
        if (typeof parseEFFile !== 'function' || typeof evaluateCases !== 'function' || typeof formatResults !== 'function') {
            resultTextarea.value = 'エラー: 必要なモジュールが読み込まれていません。';
            console.error('必要な関数が見つかりません。スクリプトが正しく読み込まれているか確認してください。');
            return;
        }

        // 処理中表示
        if (loadingIndicator) {
            loadingIndicator.classList.add('active');
        }

        // 処理結果をクリア
        resultTextarea.value = '処理中...';

        // 出力設定を取得
        const outputSettings = getOutputSettings();

        // ファイル処理を開始
        processFiles(fileInput.files)
            .then(cases => {
                // 短手３該当症例を評価
                const evaluatedCases = evaluateCases(cases);

                // 結果をフォーマット（出力設定を渡す）
                const outputText = formatResults(evaluatedCases, outputSettings);

                // 結果をテキストエリアに表示
                resultTextarea.value = outputText;

                // コピーボタンを有効化
                copyButton.disabled = false;

                // ダウンロードリンクを作成
                createDownloadLink(outputText);

                // 処理完了表示
                if (loadingIndicator) {
                    loadingIndicator.classList.remove('active');
                }
            })
            .catch(error => {
                console.error('処理中にエラーが発生しました:', error);
                resultTextarea.value = `エラー: ${error.message || '処理中に問題が発生しました。'}`;

                if (loadingIndicator) {
                    loadingIndicator.classList.remove('active');
                }
            });
    });

    /**
     * ファイルを処理する関数
     * @param {FileList} files - 処理対象のファイルリスト
     * @returns {Promise<Array>} 処理された症例データの配列
     */
    async function processFiles(files) {
        let allCases = [];

        for (let i = 0; i < files.length; i++) {
            try {
                const file = files[i];
                // ファイル内容を読み込み
                const content = await readFileAsText(file);

                // ファイルフォーマットのバリデーション
                if (typeof validateEFFile === 'function') {
                    const validationResult = validateEFFile(content);

                    // エラーがある場合は処理を中断
                    if (!validationResult.isValid) {
                        const errorMessages = validationResult.errors.join('\n');
                        throw new Error(`ファイル「${file.name}」は入院統合EFファイルのフォーマットに準拠していません。\n${errorMessages}`);
                    }

                    // 警告がある場合はコンソールに出力
                    if (validationResult.warnings.length > 0) {
                        console.warn(`ファイル「${file.name}」の警告: ${validationResult.warnings.join(', ')}`);
                    }
                }

                // EFファイルを解析
                const parsedCases = parseEFFile(content);
                console.log(`ファイル ${file.name} から ${parsedCases.length} 件の症例データを抽出しました。`);

                // 既存のケースとマージ（同一症例の場合は情報を統合）
                if (typeof mergeCases === 'function') {
                    allCases = mergeCases(allCases, parsedCases);
                } else {
                    // mergeCases関数がない場合は単純に結合
                    allCases = allCases.concat(parsedCases);
                }
            } catch (error) {
                console.error(`ファイル ${files[i].name} の処理中にエラーが発生しました:`, error);
                throw new Error(`ファイル ${files[i].name} の処理中にエラーが発生しました: ${error.message}`);
            }
        }

        return allCases;
    }

    /**
     * ファイルをテキストとして読み込む関数
     * @param {File} file - 読み込むファイル
     * @returns {Promise<string>} ファイルの内容
     */
    function readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = function (e) {
                resolve(e.target.result);
            };

            reader.onerror = function (e) {
                reject(new Error(`ファイル "${file.name}" の読み込みに失敗しました。`));
            };

            try {
                // まずShift_JISで読み込みを試みる
                reader.readAsText(file, 'Shift_JIS');
            } catch (error) {
                try {
                    // Shift_JISで失敗した場合はUTF-8で試す
                    reader.readAsText(file, 'UTF-8');
                } catch (finalError) {
                    reject(new Error(`ファイル "${file.name}" の読み込みに失敗しました: ${finalError.message}`));
                }
            }
        });
    }

    /**
     * コピーボタン押下時の処理
     */
    copyButton.addEventListener('click', function () {
        if (!resultTextarea.value) return;

        // テキストエリアの内容をクリップボードにコピー
        navigator.clipboard.writeText(resultTextarea.value)
            .then(() => {
                // コピー成功時のフィードバック
                copyMessage.textContent = 'クリップボードにコピーしました！';
                copyMessage.style.opacity = 1;

                // 3秒後にメッセージを消す
                setTimeout(() => {
                    copyMessage.style.opacity = 0;
                    setTimeout(() => {
                        copyMessage.textContent = '';
                    }, 500);
                }, 3000);
            })
            .catch(err => {
                console.error('クリップボードへのコピーに失敗しました:', err);
                copyMessage.textContent = 'コピーに失敗しました。';
                copyMessage.style.color = '#D32F2F';
            });
    });

    /**
     * ファイル情報を更新する関数
     */
    function updateFileInfo() {
        if (fileInput.files && fileInput.files.length > 0) {
            // ファイル情報のコンテナを作成
            let fileInfoHTML = '';

            // ファイル数を表示するヘッダーを追加
            fileInfoHTML += `<div class="file-count">${fileInput.files.length}ファイルが選択されています</div>`;

            // 最大5つまで表示
            const displayCount = Math.min(fileInput.files.length, 5);

            for (let i = 0; i < displayCount; i++) {
                const file = fileInput.files[i];
                fileInfoHTML += `
                    <div class="file-item" data-filename="${file.name}">
                        <div class="file-item-info">
                            <p class="file-name">${file.name}</p>
                            <p class="file-size">${formatFileSize(file.size)}</p>
                        </div>
                        <button type="button" class="file-remove" title="削除" aria-label="${file.name}を削除">×</button>
                    </div>
                `;
            }

            // 5つ以上ある場合は残りの数を表示
            if (fileInput.files.length > 5) {
                fileInfoHTML += `<p class="file-more">...他 ${fileInput.files.length - 5} ファイル</p>`;
            }

            fileInfoArea.innerHTML = fileInfoHTML;

            // 削除ボタンのイベントリスナーを追加
            document.querySelectorAll('.file-remove').forEach(button => {
                button.addEventListener('click', (e) => {
                    const filename = e.currentTarget.closest('.file-item').dataset.filename;
                    removeFile(filename);
                });
            });

            // ボタンを有効化
            executeButton.disabled = false;
            clearButton.disabled = false;
        } else {
            // ファイルが選択されていない場合
            fileInfoArea.innerHTML = '<p class="no-file-message">ファイルが選択されていません</p>';

            // ボタンを無効化
            executeButton.disabled = true;
            clearButton.disabled = true;
        }
    }

    /**
     * 特定のファイルを削除する関数
     * @param {string} filename - 削除するファイルの名前
     */
    function removeFile(filename) {
        if (!window.selectedFiles || window.selectedFiles.length === 0) return;

        // DataTransferオブジェクトを使用して新しいFileListを作成
        const dt = new DataTransfer();

        // 削除対象以外のファイルを追加
        Array.from(window.selectedFiles).forEach(file => {
            if (file.name !== filename) {
                dt.items.add(file);
            }
        });

        // 更新したFileListを設定
        window.selectedFiles = dt.files;
        fileInput.files = dt.files;

        // ファイル情報表示を更新
        updateFileInfo();

        // ファイルがすべて削除された場合は結果もクリア
        if (fileInput.files.length === 0) {
            resultTextarea.value = '';
            copyButton.disabled = true;
            downloadLink.style.display = 'none';
        }
    }

    /**
     * ファイルサイズを読みやすい形式にフォーマットする関数
     * @param {number} bytes - バイト単位のファイルサイズ
     * @returns {string} フォーマットされたファイルサイズ
     */
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * ダウンロードリンクを作成する関数
     * @param {string} text - ダウンロードするテキスト
     */
    function createDownloadLink(text) {
        if (!text) return;

        // Blobオブジェクトを作成
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        // ダウンロードリンクを設定
        downloadLink.href = url;
        downloadLink.style.display = 'inline-flex';

        // 現在の日時を取得してファイル名に使用
        const now = new Date();
        const dateStr = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
        const timeStr = `${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
        downloadLink.download = `短手３該当症例_${dateStr}_${timeStr}.txt`;

        // 古いURLを解放
        downloadLink.addEventListener('click', () => {
            setTimeout(() => URL.revokeObjectURL(url), 100);
        }, { once: true });
    }

    /**
     * ドラッグ&ドロップのフィードバックを表示する関数
     * @param {string} type - フィードバックのタイプ (success/warning/error)
     * @param {string} message - 表示するメッセージ
     */
    function showDropFeedback(type, message) {
        // フィードバックエレメントがなければ作成
        let feedbackEl = document.getElementById('dropFeedback');
        if (!feedbackEl) {
            feedbackEl = document.createElement('div');
            feedbackEl.id = 'dropFeedback';
            feedbackEl.className = 'drop-feedback';
            document.querySelector('.input-section').appendChild(feedbackEl);
        }

        // タイプに応じたクラスを設定
        feedbackEl.className = `drop-feedback ${type}`;
        feedbackEl.textContent = message;

        // アニメーション効果
        feedbackEl.style.opacity = '1';

        // 3秒後に消す
        setTimeout(() => {
            feedbackEl.style.opacity = '0';
            setTimeout(() => {
                if (feedbackEl.parentNode) {
                    feedbackEl.parentNode.removeChild(feedbackEl);
                }
            }, 300);
        }, 3000);
    }
}); 