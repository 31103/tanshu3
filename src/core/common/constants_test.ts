/**
 * constants.ts モジュールのテスト
 *
 * 定数定義をテストします。
 */

import {
  assert,
  assertArrayIncludes,
  assertEquals,
  assertGreater,
} from 'https://deno.land/std/assert/mod.ts';
import {
  COLONOSCOPY_SPECIAL_ADDITIONS,
  DEFAULT_RESULT_HEADER,
  MAX_HOSPITAL_DAYS,
  TARGET_PROCEDURES,
} from './constants.ts'; // 拡張子を追加

Deno.test('定数定義: TARGET_PROCEDURES: 配列として定義', () => {
  assert(Array.isArray(TARGET_PROCEDURES));
  assertGreater(TARGET_PROCEDURES.length, 0);
});

Deno.test('定数定義: TARGET_PROCEDURES: コードはすべて文字列', () => {
  TARGET_PROCEDURES.forEach((code) => {
    assertEquals(typeof code, 'string');
  });
});

Deno.test('定数定義: TARGET_PROCEDURES: 重複コードなし', () => {
  const uniqueCodes = new Set(TARGET_PROCEDURES);
  assertEquals(uniqueCodes.size, TARGET_PROCEDURES.length);
});

Deno.test('定数定義: TARGET_PROCEDURES: 特定コードを含む', () => {
  assertArrayIncludes(TARGET_PROCEDURES, ['160218510', '150011310']);
});

Deno.test('定数定義: COLONOSCOPY_SPECIAL_ADDITIONS: 配列として定義', () => {
  assert(Array.isArray(COLONOSCOPY_SPECIAL_ADDITIONS));
  assertGreater(COLONOSCOPY_SPECIAL_ADDITIONS.length, 0);
});

Deno.test('定数定義: COLONOSCOPY_SPECIAL_ADDITIONS: コードはすべて文字列', () => {
  COLONOSCOPY_SPECIAL_ADDITIONS.forEach((code) => {
    assertEquals(typeof code, 'string');
  });
});

Deno.test('定数定義: COLONOSCOPY_SPECIAL_ADDITIONS: 特定コードを含む', () => {
  assertArrayIncludes(COLONOSCOPY_SPECIAL_ADDITIONS, ['150429570', '150437170']);
});

Deno.test('定数定義: COLONOSCOPY_SPECIAL_ADDITIONS: 重複コードなし', () => {
  const uniqueCodes = new Set(COLONOSCOPY_SPECIAL_ADDITIONS);
  assertEquals(uniqueCodes.size, COLONOSCOPY_SPECIAL_ADDITIONS.length);
});

Deno.test('定数定義: DEFAULT_RESULT_HEADER: 文字列として定義', () => {
  assertEquals(typeof DEFAULT_RESULT_HEADER, 'string');
  assertGreater(DEFAULT_RESULT_HEADER.length, 0);
});

Deno.test('定数定義: DEFAULT_RESULT_HEADER: タブ区切り形式', () => {
  assert(DEFAULT_RESULT_HEADER.includes('\t'));
});

Deno.test('定数定義: DEFAULT_RESULT_HEADER: 正しいヘッダー文字列', () => {
  assertEquals(
    DEFAULT_RESULT_HEADER,
    'データ識別番号\t入院年月日\t退院年月日\t短手３対象症例\t理由',
  );
});

Deno.test('定数定義: MAX_HOSPITAL_DAYS: 数値として定義', () => {
  assertEquals(typeof MAX_HOSPITAL_DAYS, 'number');
});

Deno.test('定数定義: MAX_HOSPITAL_DAYS: 正の整数', () => {
  assert(Number.isInteger(MAX_HOSPITAL_DAYS));
  assertGreater(MAX_HOSPITAL_DAYS, 0);
});

Deno.test('定数定義: MAX_HOSPITAL_DAYS: 5日間と定義', () => {
  assertEquals(MAX_HOSPITAL_DAYS, 5);
});
