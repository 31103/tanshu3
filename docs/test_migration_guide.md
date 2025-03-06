# 既存テスト移行ガイド

## 概要

このドキュメントでは、既存のカスタムテストフレームワークからJestへの移行手順を説明します。

## 移行手順

### 1. 既存テストコードの分析

既存のテストファイル（`test/unit/test.ts`）は以下の主要なセクションで構成されています：

- ファイルの解析テスト
- 症例データの統合テスト
- 短手３該当症例の判定テスト
- 結果のフォーマットテスト
- 出力結果の検証テスト

これらのテストを機能ごとに分割し、Jestのテストファイルとして再実装します。

### 2. テストファイルの構造

移行後のテストファイル構造：

```
test/jest/
├── unit/             # ユニットテスト
│   ├── parsers.test.ts       # 解析関連のテスト
│   ├── evaluator.test.ts     # 評価ロジック関連のテスト
│   ├── utils.test.ts         # ユーティリティ関数のテスト
│   └── constants.test.ts     # 定数のテスト
├── integration/      # 統合テスト
│   └── workflow.test.ts      # 全体的なワークフローのテスト
└── e2e/              # E2Eテスト
    └── browser.test.ts       # ブラウザ動作のテスト
```

### 3. テストケースの移行方法

既存のテスト関数を以下のようにJestのテストに変換します：

#### 例：既存のテスト

```typescript
// 元のコード
async function testParseFile(filePath: string): Promise<CaseData[]> {
    const fileName = path.basename(filePath);
    logTestResult(`ファイル "${fileName}" の解析を開始します`, 1);

    const content = await readTestFile(filePath);
    const parsedCases = parseEFFile(content);

    logTestResult(`ファイル "${fileName}" から ${parsedCases.length} 件の症例データを抽出しました`, 1);

    return parsedCases;
}
```

#### 変換後のJestテスト

```typescript
describe('parseEFFile関数', () => {
  it('EFファイルから症例データを正しく抽出する', async () => {
    // テストデータの準備
    const content = await fs.readFile(filePath, 'utf8');
    
    // 関数の実行
    const parsedCases = parseEFFile(content);
    
    // 結果の検証
    expect(parsedCases.length).toBeGreaterThan(0);
    // 他の検証...
  });
});
```

### 4. テストデータの扱い

テストデータは`test/fixtures`ディレクトリに配置されており、そのまま利用できます。ただし、Jestのテスト内で相対パスを使用する際は、以下のコードを使用して正しいパスを解決します：

```typescript
import * as path from 'path';
import { fileURLToPath } from 'url';

// ESモジュールでの __dirname 相当の値を取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// テストデータのパス
const testDataPath = path.join(__dirname, '../../fixtures/sampleEF/sample_file.txt');
```

### 5. アサーションの変換

既存のアサーションをJestのアサーションに変換します：

| 既存のアサーション | Jestのアサーション |
|-------------------|-------------------|
| `assert.equal(a, b)` | `expect(a).toBe(b)` |
| `assert.deepEqual(a, b)` | `expect(a).toEqual(b)` |
| `assert.ok(condition)` | `expect(condition).toBe(true)` |
| `assert.throws(fn)` | `expect(fn).toThrow()` |

### 6. 非同期テストの処理

Jestでは非同期テストを簡単に記述できます：

```typescript
it('非同期処理のテスト', async () => {
  const result = await someAsyncFunction();
  expect(result).toBe(expectedValue);
});
```

### 7. テスト実行手順

移行後のテスト実行コマンド：

- 全テストの実行: `npm test`
- テストの監視モード: `npm run test:watch`
- カバレッジレポートの生成: `npm run test:coverage`
- 従来のテスト実行: `npm run test:legacy`

## 次のステップ

1. `test/jest/unit/`以下に各モジュールのテストファイルを作成
2. 統合テストとE2Eテストの実装
3. 既存のテストケースの段階的な移行
4. テストカバレッジの向上
5. CIパイプライン向けのテスト構成の整備 