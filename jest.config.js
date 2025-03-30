// Jest設定ファイル
export default {
  // TypeScriptのサポート設定
  preset: 'ts-jest',

  // テスト環境 (UIコンポーネントのテストには 'jsdom' が必要)
  testEnvironment: 'jsdom',

  // TypeScript設定ファイルの指定
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json',
      useESM: true,
    },
  },

  // ソースディレクトリとテストディレクトリの設定
  roots: ['<rootDir>/src', '<rootDir>/test'],

  // テストファイルのパターン設定
  testMatch: ['**/test/**/*.spec.ts', '**/test/**/*.test.ts'],

  // トランスフォーメーション設定
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },

  // モジュール解決設定
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  // ESMサポート設定
  extensionsToTreatAsEsm: ['.ts'],

  // コードカバレッジ設定
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/browser/**/*.ts', // ブラウザ固有のコードは除外
  ],

  // 詳細な出力設定
  verbose: true,

  // @jest/globalsを明示的に設定
  injectGlobals: true,
};
