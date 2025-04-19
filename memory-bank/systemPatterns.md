# システムパターン (System Patterns)

_このドキュメントは、システムのアーキテクチャ、主要な技術的決定、採用されているデザインパターン、コンポーネント間の関係、および重要な実装パスを記述します。`projectbrief.md` に基づいています。_

## 1. システムアーキテクチャ概要

本システムは、サーバーサイドを持たないフロントエンド完結型のウェブアプリケーションです。ユーザーはローカルの HTML ファイル (`public/index.html`) をブラウザで直接開き (`file://` プロトコル)、操作を行います。主要な技術として TypeScript (Deno ランタイム) を採用し、**esbuild** を用いて単一の JavaScript ファイル (`public/js/main.js`) にバンドルしています。

**主要コンポーネント:**

- **UI Layer (`public/`, `src/ui/`, `src/browser/main.ts`):** HTML、CSS、および UI 操作を管理する TypeScript コード。ユーザーインターフェースの表示、イベントハンドリング（ファイル選択、ボタンクリックなど）を担当します。`main.ts` がエントリーポイントとなり、各 UI コンポーネント (`file-manager`, `notification`, `result-viewer`) を初期化・連携させます。
- **Core Logic Layer (`src/core/`):** アプリケーションの中核となるビジネスロジック。UI や実行環境（ブラウザ）から独立しています。ファイル処理 (`file-processor`)、データ検証 (`validator`)、EF ファイル解析 (`parsers`)、短手３判定 (`evaluator`) などの機能を提供します。
- **Adapter Layer (`src/core/adapters/`):** 環境依存の処理（主にファイル読み込み）を抽象化するアダプター。現在はブラウザ用 (`browser.ts`) が主に使用されます。（注: 現在のファイル読み込みは `validator.ts` 内で直接 `FileReader` を使用しています）
- **Common Utilities (`src/core/common/`):** 型定義 (`types.ts`)、定数 (`constants.ts`)、ユーティリティ関数 (`utils.ts`) など、コアロジック全体で共有される要素。

**データフロー:**

```mermaid
graph LR
    subgraph Browser Environment
        User(ユーザー) -- 1. ファイル選択/設定 --> UI[UI Layer (index.html, main.ts, components)]
        UI -- 2. 処理要求 --> CoreFacade[Core Logic Facade (file-processor.ts)]
        CoreFacade -- 3. ファイル読み込み & 検証要求 --> Validator[validator.ts (Shift_JIS対応)]
        Validator -- 4. ファイル内容 (検証済み) --> CoreFacade
        CoreFacade -- 5. 解析 --> Parser[parsers.ts]
        CoreFacade -- 6. 判定 --> Evaluator[evaluator.ts]
        CoreFacade -- 7. 結果 --> UI
        UI -- 8. 結果表示/出力 --> User
    end

    subgraph Shared Logic
        Validator --> Common[Common (types, constants, utils)]
        Parser --> Common
        Evaluator --> Common
    end

     style User fill:#f9f,stroke:#333,stroke-width:2px
```

_(注: 上記フローでは簡略化のため Adapter Layer を省略し、`validator.ts` がファイル読み込みと検証を行う形に修正)_

**データ構造:**

- **`CaseData`:** 患者の入院症例全体を表す。`データ識別番号` + `入院年月日` で一意に識別される。`procedureDetails` (後述の `ProcedureDetail` オブジェクト配列) を持つ。
- **`ProcedureDetail`:** 個々の診療行為（手術、検査など）の詳細情報を表す型。`code` (レセプト電算コード), `name` (診療明細名称), `date` (実施年月日), `sequenceNumber` (順序番号), `dataCategory` (データ区分) を含む。

## 2. 主要な技術的決定

- **TypeScript (Deno) 採用:** 静的型付けによるコードの安全性、可読性、保守性の向上。
- **フロントエンド完結アーキテクチャ:** サーバー不要で `file://` プロトコルで動作。配布と利用が容易。
- **esbuild 採用:** 高速なビルドとバンドル。`deno task bundle` で実行。
- **コアロジック分離:** UI (`src/browser`, `src/ui`) とビジネスロジック (`src/core`) を分離し、テスト容易性、再利用性、保守性を向上。
- **Shift_JIS エンコーディング対応:** EF ファイルが Shift_JIS であることを考慮し、`FileReader` で文字コードを指定して読み込む (`src/core/validator.ts`)。
- **Deno 標準ツール活用:** Deno Lint, Deno Format, Deno Test を利用し、コード品質と一貫性を維持。
- **`navigator.clipboard.writeText()` API 採用:** モダンで信頼性の高いクリップボード操作。
- **GitHub Actions による CI/CD:** Lint/Format/Test/Build の自動実行 (CI) と、リリースノート自動生成・成果物公開 (CD)。

## 3. デザインパターン

- **Module パターン:** TypeScript の標準機能。コードを機能ごとにモジュール分割。
- **Facade パターン (部分的):** `src/core/file-processor.ts` がコア機能を統合し、UI レイヤーにシンプルなインターフェースを提供。
- **Observer パターン (概念的):** UI コンポーネントが DOM イベントを監視し、`main.ts` が処理をディスパッチ。
- **Strategy パターン (潜在的):** `src/core/common/evaluator.ts` が判定ロジック（戦略）をカプセル化。
- **Singleton パターン (部分的):** `FileManager`, `NotificationSystem` はモジュールレベルで共有。`ResultViewer` は `main.ts` でインスタンス化。

## 4. コンポーネント間の関係

- `main.ts` (Browser Entry Point): UI イベントを処理し、`FileProcessor` を呼び出し、結果を `ResultViewer` や `NotificationSystem` に渡す。
- `FileManager` (UI Component): ファイル選択、リスト表示、削除、クリアを管理。
- `ResultViewer` (UI Component): 判定結果の表示、コピー、ダウンロード（要確認）を管理。
- `Notification` (UI Component): エラーや通知メッセージを表示。
- `FileProcessor` (Core Logic Facade): ファイル読み込み要求 (`Validator`)、解析 (`Parser`)、評価 (`Evaluator`)、結果整形 (`Utils`) の一連の処理を統括。
- `Validator` (Core Logic): ファイル読み込み (**Shift_JIS エンコーディング指定**)、形式、必須項目、データ型などの検証を行う。
- `Parser`, `Evaluator` (Core Logic): それぞれ解析、判定の独立した責務を持つ。`Common` モジュールを利用。

## 5. 重要な実装パス (Critical Implementation Paths)

- **ファイル処理と判定のメインフロー:** `main.ts` -> `FileProcessor` -> (`Validator` -> `Parser` -> `Evaluator` -> `Utils`) -> `ResultViewer`/`Notification`。
- **短手３判定ロジック (`evaluator.ts`):** `CaseData` と `ProcedureDetail` に基づく判定アルゴリズム。データ区分、コード、診療明細名称（加算除外）などを考慮。
- **複数ファイル・月またぎ処理 (`parsers.ts` の `mergeCases`):** 複数ファイルの `CaseData` を `データ識別番号` + `入院年月日` でマージし、退院日更新や `ProcedureDetail` 重複排除を行う。
- **入力データ検証 (`validator.ts`):** EF ファイルの読み込み (**Shift_JIS 対応**)、形式、必須項目、データ型などを検証。
