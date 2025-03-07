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

    // 通知管理のための変数
    let activeToasts = [];
    let toastHistory = [];
    const MAX_VISIBLE_TOASTS = 3;
    const MAX_HISTORY_ITEMS = 10;

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
     * @param {number} priority - 優先度（1-5、5が最高）
     */
    function showToast(type, title, message, duration = 5000, priority = 3) {
        // 通知オブジェクトを作成
        const timestamp = Date.now();
        const toastId = 'toast-' + timestamp;
        const toastData = {
            id: toastId,
            type,
            title,
            message,
            timestamp,
            priority,
            duration,
            element: null
        };

        // 通知履歴に追加
        addToastToHistory(toastData);

        // 通知を表示キューに追加
        activeToasts.push(toastData);

        // 優先度順にソート（優先度が高く、新しいものが上位）
        activeToasts.sort((a, b) => {
            if (a.priority !== b.priority) {
                return b.priority - a.priority;
            }
            return b.timestamp - a.timestamp;
        });

        // 表示数を制限
        manageActiveToasts();

        // 通知を表示
        renderToast(toastData);
    }

    /**
     * 通知履歴に追加する関数
     * @param {Object} toastData - 通知データ
     */
    function addToastToHistory(toastData) {
        // 履歴に追加
        toastHistory.unshift({
            type: toastData.type,
            title: toastData.title,
            message: toastData.message,
            timestamp: toastData.timestamp
        });

        // 履歴の最大数を制限
        if (toastHistory.length > MAX_HISTORY_ITEMS) {
            toastHistory = toastHistory.slice(0, MAX_HISTORY_ITEMS);
        }

        // 履歴ボタンを更新（存在する場合）
        updateHistoryButton();
    }

    /**
     * 通知履歴ボタンを更新する関数
     */
    function updateHistoryButton() {
        const historyButton = document.getElementById('notificationHistoryButton');
        if (historyButton && toastHistory.length > 0) {
            historyButton.classList.remove('hidden');
            historyButton.setAttribute('data-count', toastHistory.length);
        }
    }

    /**
     * アクティブな通知を管理する関数
     */
    function manageActiveToasts() {
        // 表示数を制限
        if (activeToasts.length > MAX_VISIBLE_TOASTS) {
            // 優先度の低い通知を非表示にする
            const visibleToasts = activeToasts.slice(0, MAX_VISIBLE_TOASTS);
            const hiddenToasts = activeToasts.slice(MAX_VISIBLE_TOASTS);

            // 非表示にする通知を削除
            hiddenToasts.forEach(toast => {
                if (toast.element) {
                    removeToastElement(toast.id);
                }
            });

            // 集約通知を表示（複数の通知がある場合）
            if (hiddenToasts.length > 1) {
                const highestPriorityType = getHighestPriorityType(hiddenToasts);
                showAggregateToast(hiddenToasts.length, highestPriorityType);
            }

            // アクティブリストを更新
            activeToasts = visibleToasts;
        }
    }

    /**
     * 最も優先度の高い通知タイプを取得する関数
     * @param {Array} toasts - 通知の配列
     * @return {string} 最も優先度の高い通知タイプ
     */
    function getHighestPriorityType(toasts) {
        const typePriority = { 'error': 4, 'warning': 3, 'info': 2, 'success': 1 };
        let highestType = 'info';

        toasts.forEach(toast => {
            if (typePriority[toast.type] > typePriority[highestType]) {
                highestType = toast.type;
            }
        });

        return highestType;
    }

    /**
     * 集約通知を表示する関数
     * @param {number} count - 集約する通知の数
     * @param {string} type - 通知タイプ
     */
    function showAggregateToast(count, type) {
        const aggregateToastId = 'toast-aggregate';

        // 既存の集約通知を削除
        const existingAggregate = document.getElementById(aggregateToastId);
        if (existingAggregate) {
            existingAggregate.parentNode.removeChild(existingAggregate);
        }

        // 新しい集約通知を作成
        const toast = document.createElement('div');
        toast.id = aggregateToastId;
        toast.className = `toast toast-${type}`;
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');

        // アイコンを設定
        let icon = '';
        switch (type) {
            case 'success': icon = '✅'; break;
            case 'warning': icon = '⚠️'; break;
            case 'error': icon = '❌'; break;
            case 'info': icon = 'ℹ️'; break;
        }

        // 通知の内容を設定
        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-content">
                <h3 class="toast-title">その他の通知</h3>
                <p class="toast-message">他に${count}件の通知があります</p>
            </div>
            <button class="toast-view-all" aria-label="すべての通知を表示">表示</button>
        `;

        // 通知をコンテナに追加
        toastContainer.appendChild(toast);

        // 「すべて表示」ボタンのイベントリスナーを設定
        const viewAllButton = toast.querySelector('.toast-view-all');
        viewAllButton.addEventListener('click', showNotificationHistory);
    }

    /**
     * 通知履歴を表示する関数
     */
    function showNotificationHistory() {
        // 既存の履歴モーダルを削除
        const existingModal = document.getElementById('notificationHistoryModal');
        if (existingModal) {
            existingModal.parentNode.removeChild(existingModal);
        }

        // 履歴モーダルを作成
        const modal = document.createElement('div');
        modal.id = 'notificationHistoryModal';
        modal.className = 'notification-history-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-labelledby', 'notificationHistoryTitle');
        modal.setAttribute('aria-modal', 'true');

        // 履歴リストを作成
        let historyItems = '';
        toastHistory.forEach(item => {
            const date = new Date(item.timestamp);
            const timeString = date.toLocaleTimeString();
            historyItems += `
                <div class="history-item history-item-${item.type}">
                    <div class="history-item-time">${timeString}</div>
                    <div class="history-item-content">
                        <h4 class="history-item-title">${item.title}</h4>
                        <p class="history-item-message">${item.message}</p>
                    </div>
                </div>
            `;
        });

        // モーダルの内容を設定
        modal.innerHTML = `
            <div class="notification-history-content">
                <div class="notification-history-header">
                    <h3 id="notificationHistoryTitle">通知履歴</h3>
                    <button class="notification-history-close" aria-label="履歴を閉じる">×</button>
                </div>
                <div class="notification-history-list">
                    ${historyItems.length ? historyItems : '<p class="no-history">通知履歴はありません</p>'}
                </div>
                <div class="notification-history-footer">
                    <button class="secondary-button notification-history-clear">履歴をクリア</button>
                    <button class="primary-button notification-history-close-btn">閉じる</button>
                </div>
            </div>
        `;

        // モーダルをページに追加
        document.body.appendChild(modal);

        // モーダルを表示（アニメーション用）
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);

        // 閉じるボタンのイベントリスナーを設定
        const closeButtons = modal.querySelectorAll('.notification-history-close, .notification-history-close-btn');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                closeNotificationHistory();
            });
        });

        // クリアボタンのイベントリスナーを設定
        const clearButton = modal.querySelector('.notification-history-clear');
        clearButton.addEventListener('click', () => {
            clearNotificationHistory();
            closeNotificationHistory();
        });

        // モーダル外クリックで閉じる
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeNotificationHistory();
            }
        });

        // ESCキーで閉じる
        document.addEventListener('keydown', handleHistoryEscKey);
    }

    /**
     * 履歴モーダルのESCキーハンドラ
     * @param {KeyboardEvent} e - キーボードイベント
     */
    function handleHistoryEscKey(e) {
        if (e.key === 'Escape') {
            closeNotificationHistory();
        }
    }

    /**
     * 通知履歴モーダルを閉じる関数
     */
    function closeNotificationHistory() {
        const modal = document.getElementById('notificationHistoryModal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 300);
        }

        // ESCキーイベントリスナーを削除
        document.removeEventListener('keydown', handleHistoryEscKey);
    }

    /**
     * 通知履歴をクリアする関数
     */
    function clearNotificationHistory() {
        toastHistory = [];
        updateHistoryButton();
    }

    /**
     * トースト通知を描画する関数
     * @param {Object} toastData - 通知データ
     */
    function renderToast(toastData) {
        // トーストのHTML構造を作成
        const toast = document.createElement('div');
        toast.id = toastData.id;
        toast.className = `toast toast-${toastData.type}`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');

        // アイコンを設定
        let icon = '';
        switch (toastData.type) {
            case 'success': icon = '✅'; break;
            case 'warning': icon = '⚠️'; break;
            case 'error': icon = '❌'; break;
            case 'info': icon = 'ℹ️'; break;
        }

        // トーストの内容を設定
        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-content">
                <h3 class="toast-title">${toastData.title}</h3>
                <p class="toast-message">${toastData.message}</p>
            </div>
            <button class="toast-close" aria-label="通知を閉じる">×</button>
        `;

        // トーストをコンテナに追加
        toastContainer.appendChild(toast);

        // 要素への参照を保存
        toastData.element = toast;

        // 閉じるボタンのイベントリスナーを設定
        const closeButton = toast.querySelector('.toast-close');
        closeButton.addEventListener('click', () => {
            removeToast(toastData.id);
        });

        // 一定時間後に自動的に閉じる
        if (toastData.duration > 0) {
            setTimeout(() => {
                removeToast(toastData.id);
            }, toastData.duration);
        }
    }

    /**
     * トースト通知を削除する関数
     * @param {string} toastId - 削除するトーストのID
     */
    function removeToast(toastId) {
        // アクティブリストから削除
        activeToasts = activeToasts.filter(toast => toast.id !== toastId);

        // 要素を削除
        removeToastElement(toastId);
    }

    /**
     * トースト要素を削除する関数
     * @param {string} toastId - 削除するトースト要素のID
     */
    function removeToastElement(toastId) {
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
        const textFiles = Array.from(files).filter(file => file.type === 'text/plain' || file.name.endsWith('.txt'));

        // テキストファイル以外が含まれていた場合
        if (textFiles.length < files.length) {
            handleError(new Error('テキストファイル以外が含まれています'), 'file-format');
            return;
        }

        // 既に追加されているファイルと重複するものを確認
        const existingFileNames = Array.from(selectedFiles).map(f => f.name);
        const newFiles = textFiles.filter(file => !existingFileNames.includes(file.name));
        const duplicateCount = textFiles.length - newFiles.length;

        // 新しいファイルを追加
        newFiles.forEach(file => selectedFiles.push(file));

        // ファイル情報を更新
        updateFileInfo();

        // 結果をユーザーに通知
        if (newFiles.length === 0) {
            handleError(new Error('すべてのファイルが既に追加されています'), 'file-duplicate', {
                recoveryAction: {
                    message: '既存のファイルをクリアして新しいファイルを追加しますか？',
                    label: 'クリアして追加',
                    handler: () => {
                        selectedFiles = [...textFiles];
                        updateFileInfo();
                        showToast('success', 'ファイル更新完了', `${textFiles.length}ファイルを追加しました`);
                    }
                }
            });
        } else if (duplicateCount > 0) {
            showToast('warning', 'ファイル重複', `${textFiles.length - duplicateCount}ファイルを追加しました (${duplicateCount}ファイルは重複)`, 5000, 3);
        } else {
            showToast('success', 'ファイル追加完了', `${textFiles.length}ファイルを追加しました`, 5000, 2);
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
        if (!files || files.length === 0) {
            handleError(new Error('ファイルが選択されていません'), 'no-files');
            return false;
        }

        // 検証結果
        let isValid = true;
        const validationResults = [];

        // 各ファイルを検証
        for (const file of files) {
            try {
                const content = await readFileAsText(file);
                const lines = content.split('\n');

                // 検証結果オブジェクト
                const result = {
                    file: file,
                    isValid: true,
                    warnings: [],
                    errors: []
                };

                // ヘッダー行の検証
                if (lines.length < 2) {
                    result.isValid = false;
                    result.errors.push('ファイルが空か、データが不足しています');
                } else {
                    const headerLine = lines[0];

                    // ヘッダーに必要なフィールドが含まれているか確認
                    if (!headerLine.includes('患者ID') || !headerLine.includes('入院日')) {
                        result.isValid = false;
                        result.errors.push('必須フィールド（患者ID、入院日など）がヘッダーにありません');
                    }

                    // データ行の検証（サンプルとして最初の10行をチェック）
                    const dataLines = lines.slice(1, Math.min(11, lines.length));
                    let emptyLineCount = 0;
                    let invalidFormatCount = 0;

                    dataLines.forEach(line => {
                        if (!line.trim()) {
                            emptyLineCount++;
                        } else if (line.split(',').length < 5) { // 最低限必要なフィールド数
                            invalidFormatCount++;
                        }
                    });

                    // 警告の追加
                    if (emptyLineCount > 0) {
                        result.warnings.push(`空の行が${emptyLineCount}行あります`);
                    }

                    if (invalidFormatCount > 0) {
                        result.warnings.push(`フォーマットが不正な行が${invalidFormatCount}行あります`);
                        if (invalidFormatCount > dataLines.length / 2) {
                            result.isValid = false;
                            result.errors.push('データ形式が正しくない可能性があります');
                        }
                    }
                }

                // 検証結果を追加
                validationResults.push(result);

                // 全体の検証結果を更新
                if (!result.isValid) {
                    isValid = false;
                }
            } catch (error) {
                handleError(error, 'file-validation', {
                    recoveryAction: {
                        message: `ファイル「${file.name}」を除外して続行しますか？`,
                        label: '除外して続行',
                        handler: () => {
                            selectedFiles = selectedFiles.filter(f => f !== file);
                            updateFileInfo();
                            showToast('info', 'ファイル除外', `「${file.name}」を除外しました`, 5000, 3);
                        }
                    }
                });
                return false;
            }
        }

        // 検証結果をUIに反映
        updateValidationUI(validationResults);

        return isValid;
    }

    /**
     * 検証結果をUIに反映する関数
     * @param {Array} results - 検証結果の配列
     */
    function updateValidationUI(results) {
        const fileItems = document.querySelectorAll('.file-item');

        results.forEach(result => {
            const fileName = result.file.name;
            const fileItem = Array.from(fileItems).find(item =>
                item.querySelector('.file-name').textContent === fileName
            );

            if (fileItem) {
                // ステータスクラスをリセット
                fileItem.classList.remove('status-valid', 'status-warning', 'status-error');

                // 検証結果に基づいてステータスを設定
                if (!result.isValid) {
                    fileItem.classList.add('status-error');
                } else if (result.warnings.length > 0) {
                    fileItem.classList.add('status-warning');
                } else {
                    fileItem.classList.add('status-valid');
                }

                // 検証フィードバックを更新
                let feedbackHTML = '';

                if (result.errors.length > 0) {
                    feedbackHTML += '<div class="validation-message error">';
                    feedbackHTML += '<span class="validation-icon">❌</span>';
                    feedbackHTML += '<span class="validation-text">' + result.errors.join('</span></div><div class="validation-message error"><span class="validation-icon">❌</span><span class="validation-text">') + '</span>';
                    feedbackHTML += '</div>';
                }

                if (result.warnings.length > 0) {
                    feedbackHTML += '<div class="validation-message warning">';
                    feedbackHTML += '<span class="validation-icon">⚠️</span>';
                    feedbackHTML += '<span class="validation-text">' + result.warnings.join('</span></div><div class="validation-message warning"><span class="validation-icon">⚠️</span><span class="validation-text">') + '</span>';
                    feedbackHTML += '</div>';
                }

                if (result.isValid && result.warnings.length === 0) {
                    feedbackHTML += '<div class="validation-message success">';
                    feedbackHTML += '<span class="validation-icon">✅</span>';
                    feedbackHTML += '<span class="validation-text">ファイル形式は有効です</span>';
                    feedbackHTML += '</div>';
                }

                const feedbackContainer = fileItem.querySelector('.validation-feedback');
                if (feedbackContainer) {
                    feedbackContainer.innerHTML = feedbackHTML;
                }
            }
        });
    }

    /**
     * ファイルをテキストとして読み込む関数
     * @param {File} file - 読み込むファイル
     * @returns {Promise<string>} ファイルの内容
     */
    function readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = event => {
                resolve(event.target.result);
            };

            reader.onerror = error => {
                reject(new Error(`ファイル「${file.name}」の読み込み中にエラーが発生しました: ${error.message}`));
            };

            try {
                reader.readAsText(file);
            } catch (error) {
                reject(new Error(`ファイル「${file.name}」の読み込みを開始できませんでした: ${error.message}`));
            }
        }).catch(error => {
            handleError(error, 'file-read');
            throw error; // 呼び出し元でもエラーをキャッチできるように再スロー
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
        // ステップを更新
        updateStep(2);

        // ファイルが選択されているか確認
        if (selectedFiles.length === 0) {
            handleError(new Error('ファイルが選択されていません'), 'no-files', {
                recoveryAction: {
                    message: 'ファイルを選択してください',
                    label: 'ファイル選択',
                    handler: () => {
                        document.getElementById('fileInput').click();
                    }
                }
            });
            return;
        }

        // 処理中表示
        const loadingIndicator = document.getElementById('loadingIndicator');
        loadingIndicator.classList.add('active');

        try {
            // ファイルの検証
            const isValid = await validateFiles(selectedFiles);
            if (!isValid) {
                loadingIndicator.classList.remove('active');
                return;
            }

            // 処理の実行（実際の処理はここに実装）
            // この例では、単純に1秒待機してから成功とする
            await new Promise(resolve => setTimeout(resolve, 1000));

            // 結果表示エリアにダミーデータを表示
            const resultText = generateDummyResult(selectedFiles);
            document.getElementById('resultTextarea').value = resultText;
            updateResultTable(resultText);

            // 結果表示エリアを表示
            document.getElementById('resultContainer').classList.remove('hidden');

            // ステップを更新
            updateStep(3);

            // 成功通知
            showToast('success', '処理完了', '処理が正常に完了しました', 5000, 2);
        } catch (error) {
            handleError(error, 'processing', {
                recoveryAction: {
                    message: '設定を変更して再試行しますか？',
                    label: '再試行',
                    handler: () => {
                        document.getElementById('executeButton').click();
                    }
                },
                updateUI: () => {
                    // エラー時のUI更新
                    updateStep(1);
                }
            });
        } finally {
            // 処理中表示を非表示
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

/**
 * エラーを処理し、適切なフィードバックを提供する関数
 * @param {Error} error - エラーオブジェクト
 * @param {string} context - エラーが発生したコンテキスト
 * @param {Object} options - 追加オプション
 */
function handleError(error, context, options = {}) {
    console.error(`エラー (${context}):`, error);

    // エラータイプに基づいて適切なメッセージと解決策を提供
    let title = 'エラーが発生しました';
    let message = error.message || 'エラーが発生しました';
    let solution = '';
    let priority = 4; // エラーは高い優先度

    switch (context) {
        case 'file-read':
            title = 'ファイル読み込みエラー';
            if (error.name === 'SecurityError') {
                message = 'セキュリティ上の理由でファイルを読み込めませんでした';
                solution = 'ブラウザの設定を確認し、ファイルアクセス権限を許可してください';
            } else if (error.name === 'NotReadableError') {
                message = 'ファイルを読み込めませんでした';
                solution = 'ファイルが破損していないか確認してください';
            } else {
                solution = 'ファイルを再度選択するか、別のファイルを試してください';
            }
            break;

        case 'file-format':
            title = 'ファイル形式エラー';
            solution = 'テキストファイル(.txt)のみ追加できます。ファイル形式を確認してください';
            break;

        case 'file-validation':
            title = 'ファイル検証エラー';
            solution = '正しい形式のEF統合ファイルであることを確認してください';
            break;

        case 'processing':
            title = '処理エラー';
            if (error.message.includes('メモリ')) {
                solution = 'ファイルサイズが大きすぎる可能性があります。小さなファイルに分割して処理してください';
            } else {
                solution = '入力データを確認し、再度実行してください';
            }
            break;

        case 'no-files':
            title = 'ファイル未選択';
            message = 'ファイルが選択されていません';
            solution = 'ファイルを選択してから処理を実行してください';
            break;

        default:
            solution = '問題が解決しない場合は、ページを再読み込みしてください';
    }

    // 解決策がある場合はメッセージに追加
    const fullMessage = solution ? `${message}<br><span class="error-solution">解決策: ${solution}</span>` : message;

    // 通知を表示
    showToast('error', title, fullMessage, 8000, priority);

    // エラー回復のためのアクションを提供
    if (options.recoveryAction) {
        setTimeout(() => {
            showRecoveryToast(options.recoveryAction);
        }, 1000);
    }

    // エラー状態をUIに反映
    if (options.updateUI) {
        options.updateUI();
    }
}

/**
 * エラーからの回復アクションを提供する通知を表示
 * @param {Object} action - 回復アクション情報
 */
function showRecoveryToast(action) {
    const recoveryToastId = 'toast-recovery-' + Date.now();
    const toast = document.createElement('div');
    toast.id = recoveryToastId;
    toast.className = 'toast toast-info';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');

    toast.innerHTML = `
        <div class="toast-icon">🔄</div>
        <div class="toast-content">
            <h3 class="toast-title">回復アクション</h3>
            <p class="toast-message">${action.message}</p>
        </div>
        <button class="toast-action" aria-label="${action.label}">${action.label}</button>
        <button class="toast-close" aria-label="通知を閉じる">×</button>
    `;

    toastContainer.appendChild(toast);

    // アクションボタンのイベントリスナーを設定
    const actionButton = toast.querySelector('.toast-action');
    actionButton.addEventListener('click', () => {
        action.handler();
        removeToastElement(recoveryToastId);
    });

    // 閉じるボタンのイベントリスナーを設定
    const closeButton = toast.querySelector('.toast-close');
    closeButton.addEventListener('click', () => {
        removeToastElement(recoveryToastId);
    });

    // 一定時間後に自動的に閉じる
    setTimeout(() => {
        removeToastElement(recoveryToastId);
    }, 15000); // 回復アクションは長めに表示
} 