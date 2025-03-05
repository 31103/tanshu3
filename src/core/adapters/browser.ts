/**
 * 短期滞在手術等基本料３判定プログラム - ブラウザアダプター
 * このファイルには、ブラウザ環境固有の実装を含みます。
 */

/**
 * ファイルをテキストとして読み込む関数（ブラウザ環境用）
 * @param file - 読み込むファイルオブジェクト
 * @returns ファイルの内容を含むPromise
 */
export function readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            const reader = new FileReader();

            reader.onload = (event) => {
                if (event.target && typeof event.target.result === 'string') {
                    resolve(event.target.result);
                } else {
                    reject(new Error('ファイルの読み込みに失敗しました。'));
                }
            };

            reader.onerror = (event) => {
                reject(new Error(`ファイルの読み込み中にエラーが発生しました: ${event.target?.error?.message || 'Unknown error'}`));
            };

            reader.readAsText(file);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * テキストをダウンロードさせる関数（ブラウザ環境用）
 * @param text - ダウンロードするテキスト
 * @param filename - ダウンロードするファイル名
 */
export function downloadText(text: string, filename: string): void {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.className = 'download-link';
    link.textContent = `結果をダウンロード (${filename})`;

    // ダウンロードリンクをページに追加
    const downloadArea = document.getElementById('downloadArea') || document.createElement('div');
    downloadArea.id = 'downloadArea';
    downloadArea.innerHTML = '';  // 既存のリンクをクリア
    downloadArea.appendChild(link);

    const resultArea = document.getElementById('resultArea');
    if (resultArea && !document.getElementById('downloadArea')) {
        resultArea.parentNode?.insertBefore(downloadArea, resultArea.nextSibling);
    }
}

/**
 * エラーメッセージを表示する関数（ブラウザ環境用）
 * @param title - エラータイトル
 * @param message - エラーメッセージ
 * @param isWarning - 警告として表示するかどうか
 */
export function showError(title: string, message: string, isWarning = false): void {
    // エラーメッセージ要素の作成
    const errorDiv = document.createElement('div');
    errorDiv.className = isWarning ? 'warning-message' : 'error-message';
    errorDiv.innerHTML = `
        <h3>${title}</h3>
        <p>${message}</p>
    `;

    // エラーメッセージの表示
    const errorArea = document.getElementById('errorArea') || document.createElement('div');
    errorArea.id = 'errorArea';

    // 警告の場合は追加、エラーの場合は置き換え
    if (isWarning) {
        errorArea.appendChild(errorDiv);
    } else {
        errorArea.innerHTML = '';
        errorArea.appendChild(errorDiv);
    }

    // まだDOMに追加されていない場合は追加
    if (!document.getElementById('errorArea')) {
        const mainContainer = document.querySelector('.container') || document.body;
        const firstChild = mainContainer.firstChild;
        mainContainer.insertBefore(errorArea, firstChild);
    }

    // スクロールして表示
    if (!isWarning) {
        errorArea.scrollIntoView({ behavior: 'smooth' });
    }
} 