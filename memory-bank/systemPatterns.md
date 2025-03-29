# システムパターン (System Patterns)

_このドキュメントは、システムのアーキテクチャ、主要な技術的決定、採用されているデザインパターン、コンポーネント間の関係、および重要な実装パスを記述します。`projectbrief.md` に基づいています。_

## 1. システムアーキテクチャ概要

本システムは、サーバーサイドを持たないフロントエンド完結型のウェブアプリケーションです。ユーザーはローカルの HTML ファイル (`public/index.html`) をブラウザで直接開き (`file://` プロトコル)、操作を行います。主要な技術として TypeScript を採用し、Parcel を用いて単一の JavaScript ファイルにバンドルしています。

**主要コンポーネント:**

- **UI Layer (`public/`, `src/ui/`, `src/browser/main.ts`):** HTML、CSS、および UI 操作を管理する TypeScript コード。ユーザーインターフェースの表示、イベントハンドリング（ファイル選択、ボタンクリックなど）を担当します。`main.ts` がエントリーポイントとなり、各 UI コンポーネント (`file-manager`, `notification`, `result-viewer`) を初期化・連携させます。
- **Core Logic Layer (`src/core/`):** アプリケーションの中核となるビジネスロジック。UI や実行環境（ブラウザ）から独立しています。ファイル処理 (`file-processor`)、データ検証 (`validator`)、EF ファイル解析 (`parsers`)、短手３判定 (`evaluator`) などの機能を提供します。
- **Adapter Layer (`src/core/adapters/`):** 環境依存の処理（主にファイル読み込み）を抽象化するアダプター。現在はブラウザ用 (`browser.ts`) が主に使用され、テスト用に Node.js 用 (`node.ts`) も存在します。
- **Common Utilities (`src/core/common/`):** 型定義 (`types.ts`)、定数 (`constants.ts`)、ユーティリティ関数 (`utils.ts`) など、コアロジック全体で共有される要素。

**データフロー:**

```mermaid
graph LR
    subgraph Browser Environment
        User(ユーザー) -- 1. ファイル選択/設定 --> UI[UI Layer (index.html, main.ts, components)]
        UI -- 2. 処理要求 --> CoreFacade[Core Logic Facade (file-processor.ts)]
        CoreFacade -- 3. ファイル読み込み要求 --> Adapter[Adapter Layer (browser.ts)]
        Adapter -- 4. ファイル内容 --> CoreFacade
        CoreFacade -- 5. 検証 --> Validator[validator.ts]
        CoreFacade -- 6. 解析 --> Parser[parsers.ts]
        CoreFacade -- 7. 判定 --> Evaluator[evaluator.ts]
        CoreFacade -- 8. 結果 --> UI
        UI -- 9. 結果表示/出力 --> User
    end

    subgraph Shared Logic
        Validator --> Common[Common (types, constants, utils)]
        Parser --> Common
        Evaluator --> Common
    end

    style User fill:#f9f,stroke:#333,stroke-width:2px
```

## 2. 主要な技術的決定

- **TypeScript 採用:** 静的型付けによるコードの安全性、可読性、保守性の向上。大規模化やリファクタリング時の恩恵が大きい。
- **フロントエンド完結アーキテクチャ:** サーバーやデータベースが不要なため、ユーザーは特別なセットアップなしに `file://` プロトコルで直接利用可能。配布と利用が容易。
- **Parcel 採用:** `file://` 環境での動作に必要な設定が Webpack よりシンプルであり、迅速な開発セットアップが可能。依存関係を単一ファイルにバンドル。
- **コアロジック分離:** UI やブラウザ API 依存のコード (`src/browser`, `src/ui`) と、純粋なビジネスロジック (`src/core`) を分離。テスト容易性、再利用性、保守性を高める。
- **Adapter パターン採用:** ファイル読み込みなど環境依存の処理を抽象化し、コアロジックの独立性を維持。ブラウザ環境とテスト環境 (Node.js) での動作を両立。
- **ESLint & Prettier 導入:** コーディング規約の強制とコードフォーマットの自動化により、コードの一貫性と品質を維持。
- **Jest によるテスト:** ユニットテストと統合テストにより、コアロジックの正確性と安定性を担保。特に `validator` や `evaluator` のロジックはテストで品質を保証。
- **`navigator.clipboard.writeText()` API 採用:** 廃止予定の `document.execCommand('copy')` を避け、モダンで信頼性の高いクリップボード操作を実現。

## 3. デザインパターン

- **Module パターン:** TypeScript の標準機能として、コードを機能ごとにファイル（モジュール）に分割。関心事を分離し、管理しやすくしている。
- **Adapter パターン:** `src/core/adapters/` で実装。ファイル読み込みなどの環境依存操作を抽象化し、コアロジックが特定の環境 API に直接依存しないようにする。
- **Facade パターン (部分的):** `src/core/file-processor.ts` が、ファイル検証、解析、評価といった複数のコア機能を統合し、UI レイヤーに対してシンプルなインターフェースを提供している側面がある。
- **Observer パターン (概念的):** UI コンポーネントは DOM イベント（クリック、ファイル選択など）を監視 (Observe) し、イベント発生時に対応する処理を実行する。`main.ts` がイベントリスナーを設定し、処理をディスパッチする役割を担う。
- **Strategy パターン (潜在的):** `src/core/common/evaluator.ts` が短手３判定ロジック（戦略）をカプセル化している。将来的に異なる判定基準が追加された場合、戦略を切り替える形で拡張可能。

## 4. コンポーネント間の関係

- `main.ts` (Browser Entry Point):
  - `index.html` の DOM 要素を取得し、イベントリスナーを設定。
  - `FileManager`, `Notification`, `ResultViewer` (UI Components) をインスタンス化し、DOM に接続。
  - ユーザー操作（ファイル選択、ボタンクリック）に応じて `FileProcessor` を呼び出す。
  - `FileProcessor` からの結果や `Notification` からの通知を UI に反映させる。
- `FileManager` (UI Component):
  - ファイル選択 `<input>` やドラッグ＆ドロップエリアを管理。
  - 選択された `File` オブジェクトを `main.ts` に通知する。
  - ファイルリストの表示やクリア処理を行う。
- `ResultViewer` (UI Component):
  - 判定結果を表示するテキストエリアや関連する UI 要素（コピーボタン、ダウンロードボタンなど）を管理。
  - `main.ts` から受け取った整形済み結果を表示する。
  - コピーボタンが押されたら `navigator.clipboard.writeText()` を使用して結果をコピーする。
- `Notification` (UI Component):
  - エラーメッセージや処理状況などの通知を表示するエリアを管理。
  - `main.ts` や `FileProcessor` からの通知リクエストを受け取り、表示する。
- `FileProcessor` (Core Logic):
  - `main.ts` からファイルリストと設定を受け取る。
  - `BrowserAdapter` を使用してファイル内容を非同期に読み込む。
  - 読み込んだ内容を `Validator` に渡して検証する。検証結果（エラー/警告）を `main.ts` 経由で `Notification` に通知する。
  - 検証済みデータを `Parser` に渡して解析し、構造化データ（例: `PatientData[]`）に変換する。
  - 構造化データを `Evaluator` に渡して短手３判定を行う。
  - 判定結果を `Utils` を使って指定されたフォーマットに整形し、`main.ts` に返す。
  - 複数ファイル処理や月またぎ処理のロジックを内包する。
- `Validator`, `Parser`, `Evaluator` (Core Logic):
  - それぞれ検証、解析、判定の独立した責務を持つ。
  - `FileProcessor` から呼び出される。
  - `Constants`, `Types`, `Utils` (Common) を利用する。

## 5. 重要な実装パス (Critical Implementation Paths)

- **ファイル処理と判定のメインフロー:** `main.ts` でのユーザー操作受付から `FileProcessor` による一連の処理（読み込み -> 検証 -> 解析 -> 評価 -> 整形）を経て、`ResultViewer` に結果が表示されるまでの流れ。非同期処理（ファイル読み込み）を含む。
- **短手３判定ロジック (`evaluator.ts`):** 入院日数、実施された手術コード（特に `COLONOSCOPY_PROCEDURE_CODES` など）、その他の条件（`docs/短期滞在手術等基本料３について.md` 参照）に基づいて該当/非該当を判定するコアアルゴリズム。
- **複数ファイル・月またぎ処理 (`file-processor.ts`):** 複数の EF ファイルが入力された場合に、患者データ（データ識別番号で識別）をファイル間でマージし、特に退院年月日が `00000000` から具体的な日付に更新されるケースを正しく処理するロジック。
- **入力データ検証 (`validator.ts`):** EF ファイルの各行や必須項目（入院年月日、データ識別番号など）が仕様に適合しているかを確認するロジック。エラーと警告を区別し、ユーザーにフィードバックする。
