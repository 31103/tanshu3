import {
  assert,
  assertArrayIncludes,
  assertEquals,
  assertFalse,
  assertGreater,
  assertGreaterOrEqual,
  assertInstanceOf,
  assertRejects,
  assertStrictEquals,
  assertStringIncludes,
} from 'https://deno.land/std/assert/mod.ts';
import { readFileAsText, validateFileContent, validateFiles } from './validator.ts';
import { FileValidationResult } from './file-processor.ts';

// Deno環境用のブラウザAPIのポリフィル/モック
class MockProgressEvent {
  readonly type: string;
  readonly target: any;

  constructor(type: string, init?: { target?: any }) {
    this.type = type;
    this.target = init?.target || null;
  }
}

// FileReaderのモック化のための準備
let originalFileReader: typeof FileReader;
const mockFileReader = function (this: any) {
  this.error = null;
  this.readyState = 0; // EMPTY
  this.result = null;

  this.onabort = null;
  this.onerror = null;
  this.onload = null;
  this.onloadend = null;
  this.onloadstart = null;
  this.onprogress = null;

  this.abort = function (): void {};
  this.readAsArrayBuffer = function (): void {};
  this.readAsBinaryString = function (): void {};
  this.readAsDataURL = function (): void {};

  this.readAsText = function (blob: Blob) {
    this.readyState = 1; // LOADING;

    // ファイル名で挙動を切り替え
    const fileName = (blob as File).name;

    if (fileName === 'error.txt') {
      setTimeout((): void => {
        this.readyState = 2; // DONE;
        this.error = new DOMException('Read error', 'NotReadableError');
        const errorEvent = new MockProgressEvent('error', { target: this });
        if (this.onerror) this.onerror(errorEvent);
        if (this.onloadend) this.onloadend(new MockProgressEvent('loadend', { target: this }));
      }, 10);
    } else if (fileName === 'read_fail.txt') {
      // readAsText自体が失敗するケースをシミュレート
      throw new Error('Cannot start reading file');
    } else {
      // 通常の読み込み成功ケース
      blob.text().then((text) => {
        setTimeout((): void => {
          this.readyState = 2; // DONE;
          this.result = text; // Blobから実際のテキストを取得
          const loadEvent = new MockProgressEvent('load', { target: this });
          if (this.onload) this.onload(loadEvent);
          if (this.onloadend) this.onloadend(new MockProgressEvent('loadend', { target: this }));
        }, 10);
      }).catch((err) => {
        // Blob.text() が失敗した場合
        setTimeout((): void => {
          this.readyState = 2; // DONE;
          this.error = err;
          const errorEvent = new MockProgressEvent('error', { target: this });
          if (this.onerror) this.onerror(errorEvent);
          if (this.onloadend) this.onloadend(new MockProgressEvent('loadend', { target: this }));
        }, 10);
      });
    }
  };

  this.addEventListener = function (): void {};
  this.removeEventListener = function (): void {};
  this.dispatchEvent = function (): boolean {
    return false;
  };
};
(mockFileReader as any).EMPTY = 0;
(mockFileReader as any).LOADING = 1;
(mockFileReader as any).DONE = 2;

// モック化とリストアを行うラッパーテスト関数
async function withMockFileReader(fn: () => Promise<void> | void): Promise<void> {
  originalFileReader = globalThis.FileReader;
  (globalThis as any).FileReader = mockFileReader;
  (globalThis as any).ProgressEvent = MockProgressEvent; // ProgressEventもモック
  try {
    await fn();
  } finally {
    (globalThis as any).FileReader = originalFileReader;
    delete (globalThis as any).ProgressEvent; // クリーンアップ
  }
}

// --- テストケース ---

Deno.test('validator.ts: validateFiles: 空の配列の場合はエラーをスロー', async () => {
  await assertRejects(
    () => validateFiles([]),
    Error,
    'ファイルが選択されていません',
  );
});

Deno.test('validator.ts: validateFiles: 未定義の場合はエラーをスロー', async () => {
  await assertRejects(
    () => validateFiles(undefined as any),
    Error,
    'ファイルが選択されていません',
  );
});

Deno.test('validator.ts: validateFiles: 複数のファイルを正常に検証', async () => {
  await withMockFileReader(async () => {
    const files = [
      new File(['header1\theader2\ndata1\tdata2'], 'test1.txt', { type: 'text/plain' }),
      new File(['header1\theader2\ndata1\tdata2'], 'test2.txt', { type: 'text/plain' }),
    ];
    const results = await validateFiles(files);
    assertEquals(results.length, 2);
    assert(results.every((r) => r.file instanceof File));
    // より詳細な検証を追加（例：両方ともisValidであること）
    assert(results.every((r) => r.isValid));
  });
});

Deno.test('validator.ts: validateFiles: ファイル読み込みエラーを適切に処理', async () => {
  await withMockFileReader(async () => {
    const files = [new File([''], 'error.txt', { type: 'text/plain' })]; // error.txt を渡す
    const results = await validateFiles(files);
    assertEquals(results.length, 1);
    assertFalse(results[0].isValid);
    assertGreaterOrEqual(results[0].errors.length, 1);
    assertEquals(results[0].errors[0], '不明なエラーが発生しました');
  });
});

Deno.test('validator.ts: validateFiles: 非テキストファイルを適切に処理', async () => {
  await withMockFileReader(async () => {
    // readFileAsText が reject するケース
    const mockBinaryFile = new File([new Uint8Array([0, 1, 2])], 'binary.bin', {
      type: 'application/octet-stream',
    });
    const results = await validateFiles([mockBinaryFile]);
    assertEquals(results.length, 1);
    assertFalse(results[0].isValid);
    assertGreaterOrEqual(results[0].errors.length, 1);
    assertEquals(results[0].errors[0], '不明なエラーが発生しました'); // readFileAsTextのrejectをcatchする
  });
});

Deno.test('validator.ts: readFileAsText: 正常なファイルを読み込む', async () => {
  await withMockFileReader(async () => {
    const fileContent = 'テストデータ';
    const file = new File([fileContent], 'test.txt', { type: 'text/plain' });
    const content = await readFileAsText(file);
    assertEquals(content, fileContent); // モックではなく実際のBlob内容を読むように修正
  });
});

Deno.test('validator.ts: readFileAsText: 読み込みエラーを適切に処理', async () => {
  await withMockFileReader(async () => {
    const file = new File([''], 'error.txt', { type: 'text/plain' });
    await assertRejects(
      () => readFileAsText(file),
      Error,
      'Read error: File read failed', // モックのエラーメッセージに合わせる
    );
  });
});

Deno.test('validator.ts: readFileAsText: readAsTextの呼び出しに失敗した場合', async () => {
  await withMockFileReader(async () => {
    const mockFailedFile = new File(['test content'], 'read_fail.txt', { type: 'text/plain' });
    // モックFileReaderがエラーをスローする
    await assertRejects(
      () => readFileAsText(mockFailedFile),
      Error,
      'Read error: Cannot start reading file', // モックのエラーメッセージに合わせる
    );
  });
});

// --- validateFileContent関数のテスト ---
// ヘルパー関数：Fileオブジェクトを模倣 (Denoではnew FileでOK)
const createMockFileForContentTest = (name: string): File => {
  // validateFileContentはFileオブジェクトのcontentを直接読まないので、Blobは空で良い
  return new File([''], name, { type: 'text/plain' });
};

Deno.test('validator.ts: validateFileContent: 空のコンテンツを検証', () => {
  const result = validateFileContent(createMockFileForContentTest('test.txt'), '');
  assertFalse(result.isValid);
  assertArrayIncludes(result.errors, ['ファイルが空です']);
});

Deno.test('validator.ts: validateFileContent: 最低2行（ヘッダー + データ）の要件を検証', () => {
  const content = '施設コード\tデータ識別番号\n';
  const result = validateFileContent(createMockFileForContentTest('test.txt'), content);
  assertFalse(result.isValid);
  assertArrayIncludes(result.errors, ['ファイルが空か、ヘッダー行またはデータ行が不足しています']);
});

Deno.test('validator.ts: validateFileContent: 退院未定（00000000）の症例を許容', () => {
  const content =
    `施設コード\tデータ識別番号\t退院年月日\t入院年月日\tデータ区分\t順序番号\t行為明細番号\t病院点数マスタコード\tレセプト電算コード\t解釈番号
111111111\t0000000001\t00000000\t20240701\t60\t0001\t000\t641300\t160098110\tD4132`;
  const result = validateFileContent(createMockFileForContentTest('test.txt'), content);
  assert(result.isValid);
  assertEquals(result.warnings.filter((w) => w.includes('退院年月日')).length, 0);
});

Deno.test('validator.ts: validateFileContent: 不正な入院日付をエラーとして検出', () => {
  const content =
    `施設コード\tデータ識別番号\t退院年月日\t入院年月日\tデータ区分\t順序番号\t行為明細番号\t病院点数マスタコード\tレセプト電算コード\t解釈番号
111111111\t0000000001\t20240706\tINVALID\t60\t0001\t000\t641300\t160098110\tD4132`;
  const result = validateFileContent(createMockFileForContentTest('test.txt'), content);
  assertFalse(result.isValid);
  assert(result.errors.some((e) => e.includes('入院年月日(4列目)の形式が不正です')));
});

Deno.test('validator.ts: validateFileContent: 列数不足を警告として検出', () => {
  const content = `施設コード\tデータ識別番号\t退院年月日
111111111\t0000000001\t20240706`;
  const result = validateFileContent(createMockFileForContentTest('test.txt'), content);
  // isValid は true のままかもしれないが、警告は出るはず
  assert(
    result.warnings.some((w) => w.includes('一部のデータ行で入院年月日(4列目)が確認できません')),
  );
});

Deno.test('validator.ts: validateFileContent: 不正なデータ区分は警告なし', () => {
  const content =
    `施設コード\tデータ識別番号\t退院年月日\t入院年月日\tデータ区分\t順序番号\t行為明細番号\t病院点数マスタコード\tレセプト電算コード\t解釈番号
111111111\t0000000001\t20240706\t20240704\tXX\t0001\t000\t641300\t160098110\tD4132`;
  const result = validateFileContent(createMockFileForContentTest('test.txt'), content);
  assert(result.isValid); // データ区分はエラーにならない
  assertEquals(result.warnings.length, 0);
});

Deno.test('validator.ts: validateFileContent: 実際のEFファイルデータを検証', () => {
  // 相対パスでフィクスチャファイルを読む
  const samplePath = '../../test/fixtures/sampleEF/sample_EFn_XXXXXXXXX_2407.txt';
  const content = Deno.readTextFileSync(new URL(samplePath, import.meta.url));
  const result = validateFileContent(
    createMockFileForContentTest('sample_EFn_XXXXXXXXX_2407.txt'),
    content,
  );
  assert(result.isValid);
  assertEquals(result.errors.length, 0);
  assertEquals(result.warnings.length, 0);
});

Deno.test('validator.ts: validateFileContent: 特殊なケース：30列以上のデータを検証', () => {
  const content = `施設コード\tデータ識別番号\t退院年月日\t入院年月日\tデータ区分\t${
    Array(25).fill('その他').join('\t')
  }
111111111\t0000000001\t20240706\t20240704\t60\t${Array(25).fill('データ').join('\t')}`;
  const result = validateFileContent(createMockFileForContentTest('test.txt'), content);
  assert(result.isValid);
  assertEquals(result.errors.length, 0);
});

Deno.test('validator.ts: validateFileContent: 複数の警告を持つケースを検証', () => {
  const content =
    `施設コード\tデータ識別番号\t退院年月日\t入院年月日\tデータ区分\t順序番号\t行為明細番号\t病院点数マスタコード\tレセプト電算コード\t解釈番号
111111111\t0000000001\t20240706\tINVALID\t60\t0001\tABC\t641300\t160098110\tD4132
111111111\t0000000002\t20240707
111111111,0000000003,20240708,20240705,60,0001,000,641300,160098110,D4132`;
  const result = validateFileContent(createMockFileForContentTest('test.txt'), content);
  assertFalse(result.isValid); // 不正な入院日があるので invalid
  assertEquals(result.errors.length, 1);
  assert(result.errors.some((e) => e.includes('入院年月日(4列目)の形式が不正です')));
  assertGreaterOrEqual(result.warnings.length, 3);
  assert(result.warnings.some((w) => w.includes('行為明細番号(7列目)の形式が不正のようです')));
  assert(
    result.warnings.some((w) => w.includes('一部のデータ行で入院年月日(4列目)が確認できません')),
  );
  assert(result.warnings.some((w) => w.includes('一部のデータ行にタブ区切りが見られません')));
});

Deno.test('validator.ts: validateFileContent: コードをチェック（番号形式）', () => {
  const content =
    `施設コード\tデータ識別番号\t退院年月日\t入院年月日\tデータ区分\t順序番号\t行為明細番号\t病院点数マスタコード\tレセプト電算コード\t解釈番号
111111111\t0000000001\t20240706\t20240704\t60\t0001\t000\t641300\t160098110\tD4132`;
  const result = validateFileContent(createMockFileForContentTest('test.txt'), content);
  assert(result.isValid);
  assertEquals(result.warnings.length, 0);
});

Deno.test('validator.ts: validateFileContent: 異なる区切り文字が混在している場合を検証', () => {
  const content =
    `施設コード\tデータ識別番号\t退院年月日\t入院年月日\tデータ区分\t順序番号\t行為明細番号\t病院点数マスタコード\tレセプト電算コード\t解釈番号
111111111\t0000000001\t20240706\t20240704\t60\t0001\t000\t641300\t160098110\tD4132
111111111,0000000002,20240706,20240704,60,0001,000,641300,160098110,D4132`;
  const result = validateFileContent(createMockFileForContentTest('test.txt'), content);
  assert(result.warnings.some((w) => w.includes('一部のデータ行にタブ区切りが見られません')));
});

Deno.test('validator.ts: validateFileContent: 退院日未定を示すゼロ埋めの日付を許容', () => {
  const content =
    `施設コード\tデータ識別番号\t退院年月日\t入院年月日\tデータ区分\t順序番号\t行為明細番号\t病院点数マスタコード\tレセプト電算コード\t解釈番号
111111111\t0000000001\t00000000\t20240704\t60\t0001\t000\t641300\t160098110\tD4132`;
  const result = validateFileContent(createMockFileForContentTest('test.txt'), content);
  assert(result.isValid);
  assertEquals(result.warnings.filter((w) => w.includes('退院年月日')).length, 0);
});

Deno.test('validator.ts: validateFileContent: 大量の空行を含むファイルを検証', () => {
  const lines = [
    '施設コード\tデータ識別番号\t退院年月日\t入院年月日\tデータ区分\t順序番号\t行為明細番号\t病院点数マスタコード\tレセプト電算コード\t解釈番号',
  ];
  for (let i = 0; i < 5; i++) {
    lines.push('');
    lines.push(
      '111111111\t0000000001\t20240706\t20240704\t60\t0001\t000\t641300\t160098110\tD4132',
    );
    lines.push('');
  }
  const content = lines.join('\n');
  const result = validateFileContent(createMockFileForContentTest('test.txt'), content);
  assert(result.isValid);
  assertEquals(result.warnings.length, 0);
});
