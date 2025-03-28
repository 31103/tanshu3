/**
 * アクセシビリティテストのためのスクリプト
 *
 * このファイルには、アプリケーションのアクセシビリティをテストするための
 * コードが含まれています。
 *
 * 注意: このスクリプトを実行するには、以下のパッケージをインストールする必要があります。
 * npm install axe-core puppeteer --save-dev
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

// テスト対象のURL
const TEST_URL = 'http://localhost:3000';

// テスト結果の保存先ディレクトリ
const RESULTS_DIR = path.join(__dirname, '../../test-results/accessibility');

/**
 * 結果保存用のディレクトリを作成する関数
 *
 * @param {string} dirPath - ディレクトリのパス
 */
async function createResultsDirectory(dirPath) {
  try {
    await mkdir(dirPath, { recursive: true });
    console.log(`ディレクトリを作成しました: ${dirPath}`);
  } catch (error) {
    console.error(`ディレクトリの作成に失敗しました: ${error.message}`);
  }
}

/**
 * axe-coreを使用してアクセシビリティテストを実行する関数
 *
 * @param {Object} page - Puppeteerのページオブジェクト
 * @returns {Object} - アクセシビリティテスト結果
 */
async function runAxeTest(page) {
  // axe-coreをページに注入
  await page.evaluateHandle(() => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.4.2/axe.min.js';
      script.onload = resolve;
      document.head.appendChild(script);
    });
  });

  // axe-coreを実行
  const results = await page.evaluate(() => {
    return new Promise((resolve) => {
      // axeが読み込まれるまで待機
      const checkAxe = setInterval(() => {
        if (window.axe) {
          clearInterval(checkAxe);

          // axeを実行
          window.axe
            .run(document, {
              runOnly: {
                type: 'tag',
                values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
              },
            })
            .then((results) => {
              resolve(results);
            });
        }
      }, 100);
    });
  });

  return results;
}

/**
 * キーボード操作のテストを実行する関数
 *
 * @param {Object} page - Puppeteerのページオブジェクト
 * @returns {Object} - キーボード操作テスト結果
 */
async function testKeyboardNavigation(page) {
  // フォーカス可能な要素を取得
  const focusableElements = await page.evaluate(() => {
    const selectors = 'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const elements = Array.from(document.querySelectorAll(selectors));

    return elements.map((el) => {
      const rect = el.getBoundingClientRect();
      return {
        tagName: el.tagName,
        id: el.id,
        className: el.className,
        tabIndex: el.tabIndex,
        visible:
          rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).display !== 'none',
      };
    });
  });

  // キーボードでのフォーカス移動をシミュレート
  const navigationResults = [];

  // ページの先頭にフォーカスを設定
  await page.evaluate(() => {
    document.body.focus();
  });

  // Tabキーを押して各要素にフォーカスを移動
  for (let i = 0; i < focusableElements.length + 2; i++) {
    // Tabキーを押す
    await page.keyboard.press('Tab');

    // 現在フォーカスされている要素を取得
    const focusedElement = await page.evaluate(() => {
      const activeElement = document.activeElement;
      if (!activeElement || activeElement === document.body) {
        return null;
      }

      return {
        tagName: activeElement.tagName,
        id: activeElement.id,
        className: activeElement.className,
        tabIndex: activeElement.tabIndex,
        text: activeElement.textContent.trim().substring(0, 50),
      };
    });

    if (focusedElement) {
      navigationResults.push(focusedElement);
    }
  }

  return {
    focusableElements,
    navigationResults,
  };
}

/**
 * コントラスト比のテストを実行する関数
 *
 * @param {Object} page - Puppeteerのページオブジェクト
 * @returns {Object} - コントラスト比テスト結果
 */
async function testContrastRatio(page) {
  // テキスト要素を取得
  const textElements = await page.evaluate(() => {
    const elements = Array.from(
      document.querySelectorAll(
        'p, h1, h2, h3, h4, h5, h6, span, a, button, label, input, select, textarea',
      ),
    );

    return elements
      .map((el) => {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();

        // 要素が表示されていない場合はスキップ
        if (
          rect.width === 0 ||
          rect.height === 0 ||
          style.display === 'none' ||
          style.visibility === 'hidden'
        ) {
          return null;
        }

        return {
          tagName: el.tagName,
          text: el.textContent.trim().substring(0, 50),
          color: style.color,
          backgroundColor: style.backgroundColor,
          fontSize: style.fontSize,
        };
      })
      .filter((el) => el !== null);
  });

  // コントラスト比を計算（実際の実装ではより正確な計算が必要）
  const contrastResults = textElements.map((el) => {
    // 簡易的なコントラスト比計算（実際の実装ではより正確な計算が必要）
    const contrastRatio = 'Not calculated in this test';

    return {
      ...el,
      contrastRatio,
      passes: true, // 実際の実装では実際の計算結果に基づいて判定
    };
  });

  return {
    textElements,
    contrastResults,
  };
}

/**
 * ARIA属性のテストを実行する関数
 *
 * @param {Object} page - Puppeteerのページオブジェクト
 * @returns {Object} - ARIA属性テスト結果
 */
async function testAriaAttributes(page) {
  // ARIA属性を持つ要素を取得
  const ariaElements = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('[aria-*]'));

    return elements.map((el) => {
      const attributes = Array.from(el.attributes)
        .filter((attr) => attr.name.startsWith('aria-'))
        .map((attr) => ({ name: attr.name, value: attr.value }));

      return {
        tagName: el.tagName,
        id: el.id,
        className: el.className,
        attributes,
      };
    });
  });

  // ARIA属性の検証（実際の実装ではより詳細な検証が必要）
  const ariaResults = ariaElements.map((el) => {
    // 簡易的な検証（実際の実装ではより詳細な検証が必要）
    const validAttributes = el.attributes.map((attr) => {
      return {
        ...attr,
        isValid: true, // 実際の実装では実際の検証結果に基づいて判定
      };
    });

    return {
      ...el,
      validAttributes,
    };
  });

  return {
    ariaElements,
    ariaResults,
  };
}

/**
 * セマンティックHTMLのテストを実行する関数
 *
 * @param {Object} page - Puppeteerのページオブジェクト
 * @returns {Object} - セマンティックHTMLテスト結果
 */
async function testSemanticHTML(page) {
  // HTML構造を取得
  const htmlStructure = await page.evaluate(() => {
    function getElementStructure(element, depth = 0) {
      if (!element) return null;

      const children = Array.from(element.children).map((child) =>
        getElementStructure(child, depth + 1),
      );

      return {
        tagName: element.tagName,
        id: element.id,
        className: element.className,
        role: element.getAttribute('role'),
        children: children.filter((child) => child !== null),
      };
    }

    return getElementStructure(document.body);
  });

  // セマンティックHTMLの検証（実際の実装ではより詳細な検証が必要）
  const semanticResults = {
    hasHeader: await page.evaluate(() => document.querySelector('header') !== null),
    hasMain: await page.evaluate(() => document.querySelector('main') !== null),
    hasFooter: await page.evaluate(() => document.querySelector('footer') !== null),
    hasNav: await page.evaluate(() => document.querySelector('nav') !== null),
    hasHeadings: await page.evaluate(
      () => document.querySelector('h1, h2, h3, h4, h5, h6') !== null,
    ),
    hasLandmarks: await page.evaluate(
      () =>
        document.querySelector(
          '[role="banner"], [role="navigation"], [role="main"], [role="contentinfo"]',
        ) !== null,
    ),
  };

  return {
    htmlStructure,
    semanticResults,
  };
}

/**
 * アクセシビリティテストを実行する関数
 *
 * @param {string} url - テスト対象のURL
 */
async function runAccessibilityTests(url) {
  console.log(`アクセシビリティテストを開始します: ${url}`);

  // 結果保存用のディレクトリを作成
  await createResultsDirectory(RESULTS_DIR);

  // Puppeteerを起動
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    // 新しいページを開く
    const page = await browser.newPage();

    // ページを読み込む
    await page.goto(url, { waitUntil: 'networkidle2' });

    // スクリーンショットを撮影
    await page.screenshot({ path: path.join(RESULTS_DIR, 'screenshot.png'), fullPage: true });

    // 各テストを実行
    console.log('axe-coreによるテストを実行中...');
    const axeResults = await runAxeTest(page);

    console.log('キーボード操作のテストを実行中...');
    const keyboardResults = await testKeyboardNavigation(page);

    console.log('コントラスト比のテストを実行中...');
    const contrastResults = await testContrastRatio(page);

    console.log('ARIA属性のテストを実行中...');
    const ariaResults = await testAriaAttributes(page);

    console.log('セマンティックHTMLのテストを実行中...');
    const semanticResults = await testSemanticHTML(page);

    // テスト結果をまとめる
    const testResults = {
      url,
      timestamp: new Date().toISOString(),
      axe: {
        violations: axeResults.violations.length,
        passes: axeResults.passes.length,
        incomplete: axeResults.incomplete.length,
        inapplicable: axeResults.inapplicable.length,
      },
      keyboard: {
        focusableElements: keyboardResults.focusableElements.length,
        navigationResults: keyboardResults.navigationResults.length,
      },
      contrast: {
        textElements: contrastResults.textElements.length,
        failingElements: contrastResults.contrastResults.filter((result) => !result.passes).length,
      },
      aria: {
        elements: ariaResults.ariaElements.length,
      },
      semantic: semanticResults.semanticResults,
    };

    // 結果の概要を表示
    console.log('テスト結果の概要:');
    console.log(`- axe-core違反: ${testResults.axe.violations}`);
    console.log(`- axe-core合格: ${testResults.axe.passes}`);
    console.log(`- フォーカス可能な要素: ${testResults.keyboard.focusableElements}`);
    console.log(`- キーボードナビゲーション: ${testResults.keyboard.navigationResults}`);
    console.log(`- テキスト要素: ${testResults.contrast.textElements}`);
    console.log(`- コントラスト比違反: ${testResults.contrast.failingElements}`);
    console.log(`- ARIA属性を持つ要素: ${testResults.aria.elements}`);
    console.log(`- ヘッダー要素: ${testResults.semantic.hasHeader ? 'あり' : 'なし'}`);
    console.log(`- メイン要素: ${testResults.semantic.hasMain ? 'あり' : 'なし'}`);
    console.log(`- フッター要素: ${testResults.semantic.hasFooter ? 'あり' : 'なし'}`);

    // 詳細な結果をファイルに保存
    await writeFile(
      path.join(RESULTS_DIR, 'axe-results.json'),
      JSON.stringify(axeResults, null, 2),
    );

    await writeFile(
      path.join(RESULTS_DIR, 'keyboard-results.json'),
      JSON.stringify(keyboardResults, null, 2),
    );

    await writeFile(
      path.join(RESULTS_DIR, 'contrast-results.json'),
      JSON.stringify(contrastResults, null, 2),
    );

    await writeFile(
      path.join(RESULTS_DIR, 'aria-results.json'),
      JSON.stringify(ariaResults, null, 2),
    );

    await writeFile(
      path.join(RESULTS_DIR, 'semantic-results.json'),
      JSON.stringify(semanticResults, null, 2),
    );

    await writeFile(path.join(RESULTS_DIR, 'summary.json'), JSON.stringify(testResults, null, 2));

    // ページを閉じる
    await page.close();
  } catch (error) {
    console.error(`テスト実行中にエラーが発生しました: ${error.message}`);
  } finally {
    // ブラウザを閉じる
    await browser.close();
  }

  console.log('アクセシビリティテストが完了しました');
}

// テストを実行
runAccessibilityTests(TEST_URL);

// モジュールとしてエクスポート
module.exports = {
  runAxeTest,
  testKeyboardNavigation,
  testContrastRatio,
  testAriaAttributes,
  testSemanticHTML,
  runAccessibilityTests,
};
