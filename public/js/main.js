/**
 * ファイル選択処理を管理するスクリプト
 */
document.addEventListener('DOMContentLoaded', function () {
    // DOM要素の取得
    const fileInput = document.getElementById('fileInput');
    const fileInfoArea = document.getElementById('fileInfoArea');
    const fileLabel = document.querySelector('.file-input-label');
    const executeButton = document.getElementById('executeButton');
    const clearButton = document.getElementById('clearButton');
    const resultTextarea = document.getElementById('resultTextarea');
    const copyButton = document.getElementById('copyButton');
    const copyMessage = document.getElementById('copyMessage');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const dropArea = document.getElementById('dropArea');
    const downloadLink = document.getElementById('downloadLink');
    const customFileInput = document.querySelector('.custom-file-input');

    /**
     * ファイル選択時の処理
     */
    fileInput.addEventListener('change', function (e) {
        e.stopPropagation(); // イベントの伝播を停止
        updateFileInfo();
    });

    /**
     * クリアボタン押下時の処理
     */
    clearButton.addEventListener('click', function () {
        // ファイル選択をリセット
        fileInput.value = '';

        // FileListを空にするためのダミーのDataTransferを作成
        const dt = new DataTransfer();
        fileInput.files = dt.files;

        // ファイル情報表示をリセット
        updateFileInfo();

        // 結果表示をクリア
        resultTextarea.value = '';
        copyButton.disabled = true;

        // ダウンロードリンクを非表示
        downloadLink.style.display = 'none';
    });

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

        // ファイル処理を開始
        processFiles(fileInput.files)
            .then(cases => {
                // 短手３該当症例を評価
                const resultCases = evaluateCases(cases);

                // 結果をフォーマット
                const outputText = formatResults(resultCases);

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
                    // 失敗した場合はUTF-8で試行
                    reader.readAsText(file, 'UTF-8');
                } catch (e) {
                    reject(new Error(`ファイル "${file.name}" のエンコーディングを検出できませんでした。`));
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
     * ドラッグ&ドロップ関連のイベント設定
     */
    // ドラッグオーバー時
    dropArea.addEventListener('dragover', function (e) {
        e.preventDefault();
        e.stopPropagation();
        dropArea.classList.add('drag-over');
    });

    // ドラッグリーブ時
    dropArea.addEventListener('dragleave', function (e) {
        e.preventDefault();
        e.stopPropagation();
        dropArea.classList.remove('drag-over');
    });

    // ドロップ時
    dropArea.addEventListener('drop', function (e) {
        e.preventDefault();
        e.stopPropagation();
        dropArea.classList.remove('drag-over');

        // ドロップされたファイルを取得
        if (e.dataTransfer.files.length > 0) {
            // FileListをDataTransferを使って新しく作成
            const dt = new DataTransfer();
            Array.from(e.dataTransfer.files).forEach(file => {
                dt.items.add(file);
            });
            fileInput.files = dt.files;
            updateFileInfo();
        }
    });

    // ドロップエリアクリック時
    dropArea.addEventListener('click', function (e) {
        e.preventDefault(); // デフォルトの動作を防止
        e.stopPropagation(); // イベントの伝播を停止
        fileInput.click();
    });

    // ファイル選択ボタンのクリックイベント
    customFileInput.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        fileInput.click();
    });

    // ファイル選択ボタンのキーボードイベント（アクセシビリティ対応）
    customFileInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            fileInput.click();
        }
    });

    /**
     * ファイル情報を更新する関数
     */
    function updateFileInfo() {
        if (fileInput.files && fileInput.files.length > 0) {
            // ファイル情報を表示
            if (fileInput.files.length === 1) {
                fileLabel.textContent = `1 ファイルが選択されました: ${fileInput.files[0].name}`;
                fileInfoArea.innerHTML = `<span class="file-input-label">${fileLabel.textContent}</span>`;
            } else {
                fileLabel.textContent = `${fileInput.files.length} ファイルが選択されました`;

                // 選択されたファイル一覧を表示
                const fileList = Array.from(fileInput.files).slice(0, 5).map(f => f.name).join('<br>');
                if (fileInput.files.length > 5) {
                    fileInfoArea.innerHTML = `<span class="file-input-label">${fileLabel.textContent}</span><p>${fileList}<br>...(他 ${fileInput.files.length - 5} ファイル)</p>`;
                } else {
                    fileInfoArea.innerHTML = `<span class="file-input-label">${fileLabel.textContent}</span><p>${fileList}</p>`;
                }
            }

            // ボタンを有効化
            executeButton.disabled = false;
            clearButton.disabled = false;
        } else {
            fileLabel.textContent = 'ファイルが選択されていません';
            fileInfoArea.innerHTML = `<span class="file-input-label">ファイルが選択されていません</span>`;

            // ボタンを無効化
            executeButton.disabled = true;
            clearButton.disabled = true;
        }
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
}); 