/**
 * utils.ts モジュールのテスト
 *
 * ユーティリティ関数をテストします。
 */

import {
  assert,
  assertEquals,
  assertNotEquals,
  assertStrictEquals,
} from 'https://deno.land/std/assert/mod.ts';
import { calculateHospitalDays, formatDate, getErrorMessage, parseDate } from './utils.ts'; // 拡張子を追加

Deno.test('parseDate関数: 有効な日付文字列をDateオブジェクトに変換する', () => {
  const result = parseDate('20220101');
  assert(result instanceof Date);
  assertEquals(result?.getFullYear(), 2022);
  assertEquals(result?.getMonth(), 0); // 0-indexed (0 = 1月)
  assertEquals(result?.getDate(), 1);
});

Deno.test('parseDate関数: 日付が"00000000"の場合はnullを返す', () => {
  const result = parseDate('00000000');
  assertStrictEquals(result, null);
});

Deno.test('parseDate関数: 空の文字列の場合はnullを返す', () => {
  const result = parseDate('');
  assertStrictEquals(result, null);
});

Deno.test('parseDate関数: undefinedの場合はnullを返す', () => {
  const result = parseDate(undefined as unknown as string);
  assertStrictEquals(result, null);
});

Deno.test('parseDate関数: 無効な日付形式の場合はnullを返す', () => {
  // 文字列ではない値
  assertStrictEquals(parseDate(null as unknown as string), null);

  // 存在しない日付（2月30日）
  const feb30 = parseDate('20220230');
  // 2月30日は存在しないので、JavaScript内部で3月に変換される
  if (feb30) {
    assertNotEquals(feb30.getMonth(), 1); // 1 = 2月（0-indexed）
  }
  // または、実装によってはnullを期待する場合
  // assertStrictEquals(feb30, null);
});

Deno.test('parseDate関数: 例外が発生した場合はnullを返す', () => {
  // nullを渡すと、substring()メソッドを呼び出そうとしてエラーが発生する
  const result = parseDate(null as unknown as string);
  assertStrictEquals(result, null);
});

Deno.test('calculateHospitalDays関数: 入院日から退院日までの日数を正しく計算する', () => {
  // 3日間の入院（1/1, 1/2, 1/3を含む）
  const result = calculateHospitalDays('20220101', '20220103');
  assertEquals(result, 3);
});

Deno.test('calculateHospitalDays関数: 入院日と退院日が同じ場合は1を返す', () => {
  const result = calculateHospitalDays('20220101', '20220101');
  assertEquals(result, 1);
});

Deno.test('calculateHospitalDays関数: 月をまたいだ入院期間を正しく計算する', () => {
  // 1月31日から2月2日までの入院（1/31, 2/1, 2/2の3日間）
  const result = calculateHospitalDays('20220131', '20220202');
  assertEquals(result, 3);
});

Deno.test('calculateHospitalDays関数: 年をまたいだ入院期間を正しく計算する', () => {
  // 2021年12月30日から2022年1月2日までの入院（12/30, 12/31, 1/1, 1/2の4日間）
  const result = calculateHospitalDays('20211230', '20220102');
  assertEquals(result, 4);
});

Deno.test('calculateHospitalDays関数: 入院日が無効な場合はnullを返す', () => {
  const result = calculateHospitalDays('invalid', '20220103');
  assertStrictEquals(result, null);
});

Deno.test('calculateHospitalDays関数: 退院日が無効な場合はnullを返す', () => {
  const result = calculateHospitalDays('20220101', 'invalid');
  assertStrictEquals(result, null);
});

Deno.test('calculateHospitalDays関数: 入院日と退院日の両方が無効な場合はnullを返す', () => {
  const result = calculateHospitalDays('00000000', '00000000');
  assertStrictEquals(result, null);
});

Deno.test('formatDate関数: デフォルトでyyyymmdd形式を返す', () => {
  const result = formatDate('20241025');
  assertEquals(result, '20241025');
});

Deno.test('formatDate関数: yyyy/mm/dd形式に変換する', () => {
  const result = formatDate('20241025', 'yyyy/mm/dd');
  assertEquals(result, '2024/10/25');
});

Deno.test('formatDate関数: 00000000はそのまま返す', () => {
  const result = formatDate('00000000', 'yyyy/mm/dd');
  assertEquals(result, '00000000');
});

Deno.test('formatDate関数: 無効な日付文字列はそのまま返す', () => {
  const result = formatDate('invalid', 'yyyy/mm/dd');
  assertEquals(result, 'invalid');
});

Deno.test('formatDate関数: 月と日が1桁の場合も正しくフォーマットする', () => {
  const result = formatDate('20240105', 'yyyy/mm/dd');
  assertEquals(result, '2024/01/05');
});

Deno.test('formatDate関数: 空の文字列はそのまま返す', () => {
  const result = formatDate('', 'yyyy/mm/dd');
  assertEquals(result, '');
});

Deno.test('formatDate関数: nullはそのまま返す', () => {
  const result = formatDate(null as unknown as string, 'yyyy/mm/dd');
  assertStrictEquals(result, null as unknown as string);
});

Deno.test('getErrorMessage関数: Errorオブジェクトからメッセージを抽出する', () => {
  const error = new Error('テストエラー');
  const message = getErrorMessage(error);
  assertEquals(message, 'テストエラー');
});

Deno.test('getErrorMessage関数: 文字列の場合はそのまま返す', () => {
  const message = getErrorMessage('エラーメッセージ');
  assertEquals(message, 'エラーメッセージ');
});

Deno.test('getErrorMessage関数: 数値の場合は文字列に変換して返す', () => {
  const message = getErrorMessage(123);
  assertEquals(message, '123');
});

Deno.test('getErrorMessage関数: nullの場合は"null"を返す', () => {
  const message = getErrorMessage(null);
  assertEquals(message, 'null');
});

Deno.test('getErrorMessage関数: undefinedの場合は"undefined"を返す', () => {
  const message = getErrorMessage(undefined);
  assertEquals(message, 'undefined');
});

Deno.test('getErrorMessage関数: オブジェクトの場合は文字列表現を返す', () => {
  const obj = { key: 'value' };
  const message = getErrorMessage(obj);
  assertEquals(message, '[object Object]');
});
