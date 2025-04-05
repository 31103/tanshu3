/**
 * 短期滞在手術等基本料３判定プログラム - コアモジュールエントリーポイント
 * このファイルは、コアモジュールの公開インターフェースを定義します。
 */

// 共通モジュールのエクスポート
export * from './common/types.ts';
export * from './common/constants.ts';
export * from './common/utils.ts';
export * from './common/parsers.ts';
export * from './common/evaluator.ts';

// 環境によって適切なアダプターをエクスポート
// Webpackなどのバンドラーで環境に応じた適切なファイルが選択されるようにする
// 実際の実装はwebpack.config.jsなどで設定

// 開発時には両方のアダプターをエクスポートしておく
// ビルド時に適切なものが選択される
export * as browserAdapter from './adapters/browser.ts';
