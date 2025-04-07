# 短手３過剰判定修正計画 (fix-over-evaluation)

## 1. 背景

現状の短手３判定ロジックでは、症例内に短手３対象外の手術が1つでも含まれていると、その手術が対象手術と「同日・一連行為」で行われたか、「別日」で行われたかに関わらず、症例全体が対象外と判定されてしまう。これにより、本来対象外とすべきでないケースが過剰に判定されている。

**課題:**

- 同日に短手３対象手術等と対象外の手術を一連の行為内（同一順序番号）で行っているケースが対象外と判定されるべきではないのに、されている。
- 同一症例中に短手３対象手術等と対象外の手術を別日に実施しているケースが対象外と判定されるべきではないのに、されている。

## 2. 修正方針

判定ロジックにおいて、個々の手術が行われた「実施年月日」と「順序番号」を考慮するように修正する。

## 3. 作業計画

1. **[完了] ブランチ作成:**
   - `git checkout -b feature/fix-over-evaluation` を実行し、作業用ブランチを作成した。
2. **[完了] データ構造の拡張 (`src/core/common/types.ts`):**
   - 個々の診療行為の詳細情報（コード、名称、実施年月日、順序番号）を保持する `ProcedureDetail` 型を定義した。
   - `CaseData` 型を修正し、`procedures: string[]` と `procedureNames?: string[]` を `procedureDetails: ProcedureDetail[]` に置き換えた。
3. **[完了] パーサーの修正 (`src/core/common/parsers.ts`):**
   - `extractLineData` 関数を修正し、各行から `実施年月日` (列24) と `順序番号` (列6) を抽出するようにした。
   - `parseEFFile` 関数を修正し、抽出した情報から `ProcedureDetail` オブジェクトを作成し、`CaseData` の `procedureDetails` 配列に格納するように変更した。
4. **[完了] 評価ロジックの修正 (`src/core/common/evaluator.ts`):**
   - `evaluateCases` 関数を修正し、「他の手術の有無チェック」ロジックで実施年月日と順序番号を考慮するように変更した。
5. **[完了] テストの拡充:**
   - `src/core/common/parsers_test.ts`: 新しいデータ構造に対応するようにテストを修正・拡充した。
   - `src/core/common/evaluator_test.ts`: 新しい評価ロジックに対応するようにテストを修正・拡充した。
6. **[完了] 関連箇所の修正:**
   - 統合テスト (`test/integration/`) 内の `CaseData` 参照箇所を修正した。
7. **[完了] Memory Bank 更新:**
   - 修正内容を反映し、`activeContext.md`, `progress.md`, `systemPatterns.md` を更新した。

## 4. 成果物

- 修正されたソースコード (`types.ts`, `parsers.ts`, `evaluator.ts`)
- 追加・修正されたテストコード (`parsers_test.ts`, `evaluator_test.ts`, `data-flow_test.ts`, `module-integration_test.ts`)
- 更新された Memory Bank ファイル (`activeContext.md`, `progress.md`, `systemPatterns.md`)
- 修正計画ドキュメント (`docs/fix-over-evaluation-plan.md`)

## 5. 確認事項

- **[未完了]** 修正後のロジックで、意図しない副作用が発生していないか、十分なテストケースで確認する。 **(現在、`parsers_test.ts` の一部テストが失敗しており、原因調査が必要)**
- パフォーマンスへの影響を考慮する（大きな影響はない見込み）。

## 6. 現状と次のステップ

コード修正と関連ドキュメントの更新は完了したが、`parsers_test.ts` 内の3つのテストケースが依然として失敗している。原因の特定と修正が必要なため、このTaskは一旦ここで終了する。

**次のステップ:**

- 失敗しているテストケース (`parsers_test.ts` 内の `同一患者・同一入院日`, `同一患者・異なる入院日`, `空白のみの行`) の原因を特定し、修正する。
- すべてのテストがパスすることを確認する。
