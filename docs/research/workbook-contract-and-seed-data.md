# Workbook contract and acceptance data

Research date: 2026-07-16

Decision revision: 2026-07-17. The workbook structure findings remain valid,
but permanent seed data and replay/recovery identities are removed in favor of
the KISS failure policy in
[ADR 0002](../adr/0002-discard-failed-plans-and-resubmit.md).

## Question

What workbook structure and validation contract must
`PlannerTasksTemplate.xlsx` expose so the maintainer-owned task catalogue can
drive the concert-plan Flow safely while remaining editable work in progress?

## Decision

Keep the current seven-sheet workbook as the source of truth and require a
stable `TaskId` solely so warning e-mails can identify an invalid task
independently of row position or title. The constrained Form choices are
trusted, so do not add a duplicate planning-scope lookup table or other
recovery-only identities.

Do not replace the maintainer's real task catalogue with synthetic production
seed rows. Blank or partially authored work-in-progress rows may remain in the
table. Rows outside the selected planning scope are ignored; selected invalid
rows are skipped and reported, while structurally missing tables or columns are
fatal before plan creation.

## Required sheets and tables

The workbook has exactly these seven sheets in this order.

| Sheet | Table | Required purpose |
| --- | --- | --- |
| `Návod` | None | Czech maintainer instructions for editing and validating the task catalogue. |
| `TasksTemplate` | `tbTasksTemplate` | Template tasks selected by concert type or venue. |
| `Groups` | `tbGroups` | Responsibility-group-to-assignee mapping. |
| `Buckets` | `tbBuckets` | Bucket display name and maintainer description. |
| `Progress` | `tbProgress` | Allowed initial progress values. |
| `Priority` | `tbPriority` | Allowed Planner priority names. |
| `Labels` | `tbLabels` | Fixed Planner category slot, display name, color, and usage note. |

English sheet, table, and column identifiers are the automation contract and
must not be translated. Czech values and instructions remain user-facing.

## Planning-scope values

The Flow trusts the constrained Form choices and selects rows whose
`TemplateType` exactly matches the chosen concert type (`Velký` or `Malý`) or
venue (`Ignác`, `Jakub`, `Kříž`, `Gotika`, or `Jinde`). The workbook may retain
other administrative values for other uses; this Flow simply does not select
them. No duplicate planning-scope table or allowed-value preflight is required.

## Task-table contract

`tbTasksTemplate` retains its current 12 columns and order.

| Column | Required contract |
| --- | --- |
| `TemplateType` | Required nonblank selection value; this Flow selects exact matches for its concert type or venue and ignores other values. |
| `TaskId` | Required immutable text key for every selectable task, unique across the table. It identifies skipped rows in warning e-mails and must never be recycled for a different task; a selected row with no key is reported as `(missing)`. |
| `TaskName` | Required nonblank Planner title. Exact service-length policy remains with the preflight ticket. |
| `GroupName` | Required exact match in the unique `tbGroups[GroupName]` set. |
| `AssignedToEmails` | Required calculated-column formula result. It is never manually seeded. |
| `DaysFromEvent` | Required integer schedule offset; negative, zero, and positive values are valid. |
| `Bucket` | Required exact match in the unique `tbBuckets[Bucket]` set. |
| `Progress` | Blank or exact match in `tbProgress[Progress]`; blank is equivalent to `Not started`. |
| `Priority` | Required exact match in `tbPriority[Priority]`; no silent fallback. |
| `Description` | Optional plain text with preserved line breaks and plain URLs. |
| `CheckListItems` | Optional semicolon-delimited titles; trim tokens, reject duplicates, and allow at most 20 nonblank items. |
| `Labels` | Optional semicolon-delimited exact names from populated `tbLabels[Name]` rows; trim tokens and reject duplicates. |

The calculated-column formula for `AssignedToEmails` is:

```excel
=IF([@GroupName]="","",IFERROR(INDEX(tbGroups[AssignedToEmails],MATCH([@GroupName],tbGroups[GroupName],0)),""))
```

The formula must fill every populated task row and have a recalculated cached
value before the workbook is uploaded to SharePoint. A referenced
responsibility group must produce at least one address; the next preflight
decision owns the operator behavior for invalid or unauthorized identities.

`TaskId` is required because warning e-mails must identify a skipped template
task after workbook rows or titles are edited. It is not persisted against a
Planner task ID.

## Lookup-table contracts

### Responsibility groups

`tbGroups` has the existing columns `GroupName` and `AssignedToEmails`.

- `GroupName` is required and unique after trimming and case normalization.
- `AssignedToEmails`, when populated, contains 1 through 20 semicolon-delimited
  addresses whose tokens are trimmed, syntactically valid, and unique ignoring
  case.
- Every group referenced by a valid selected task has a nonblank mapping.
- Blank mappings may remain as work in progress when no valid selected task
  references them. A selected task that references one is skipped and reported.
- Duplicate `GroupName` rows remain invalid because they make lookup results
  ambiguous and must be collapsed before that group can produce valid tasks.

### Buckets

`tbBuckets` retains the existing `Bucket` and `Description` columns. `Bucket`
is required and unique after trimming and case normalization. Every populated
bucket row is created in every concert plan, including buckets unused by the
selected tasks. Descriptions remain required maintainer guidance but are not
sent to Planner.

### Progress and priority

`tbProgress[Progress]` contains, in order:

1. `Not started`
2. `In progress`
3. `Completed`

`tbPriority[Priority]` contains, in order:

1. `Low`
2. `Medium`
3. `Important`
4. `Urgent`

The Flow mappings remain blank/`Not started` = 0, `In progress` = 50,
`Completed` = 100 and `Urgent` = 1, `Important` = 3, `Medium` = 5,
`Low` = 9.

### Planning labels

`tbLabels` retains `Label`, `Name`, `Color`, and `Usage`.

- It has one row for each configured Planner category, currently `Label1`
  through `Label9`.
- `Label` is the immutable Planner category slot, must be within `Label1`
  through `Label25`, and is unique.
- The current nine names and colors remain the accepted mapping below.
- Unused slots do not need preallocated blank rows; add the next explicit slot
  only when maintainers intentionally configure another label.
- Populated names are unique after trimming and case normalization.
- A task may reference only a row with a nonblank `Name`.
- Every populated name is configured on every concert plan, even when no
  selected task applies that label.

| Label | Name | Color |
| --- | --- | --- |
| `Label1` | `Organizace` | `Pink` |
| `Label2` | `Umělci` | `Red` |
| `Label3` | `Propagace` | `Yellow` |
| `Label4` | `Logistika` | `Green` |
| `Label5` | `Finance` | `Blue` |
| `Label6` | `Administrativa` | `Purple` |
| `Label7` | `Hudba` | `Bronze` |
| `Label8` | `Provoz` | `Lime` |
| `Label9` | `IT` | `Aqua` |

Target-tenant E2E acceptance must explicitly exercise labels 7 through 9 so it
cannot overlook the documented uncertainty about naming and applying categories
beyond six. Production must not claim those labels work until the live check
succeeds.

## Excel data validation

Apply validations only to the data rows in `tbTasksTemplate`; do not apply them
to adjacent columns or preallocated blank ranges.

| Column | Excel validation |
| --- | --- |
| `GroupName` | List: `INDIRECT("tbGroups[GroupName]")`; blank prohibited. |
| `DaysFromEvent` | Custom whole-number rule; blank prohibited. |
| `Bucket` | List: `INDIRECT("tbBuckets[Bucket]")`; blank prohibited. |
| `Progress` | List: `INDIRECT("tbProgress[Progress]")`; blank allowed. |
| `Priority` | List: `INDIRECT("tbPriority[Priority]")`; blank prohibited. |

Do not use a single-choice Excel list validation for `Labels`; native list
validation conflicts with the documented semicolon-delimited multi-label
format. Token validation belongs in Flow preflight, which also enforces
cross-row uniqueness, semicolon-token rules, required fields, and maximum counts
that Excel validation cannot express reliably across table expansion.

The current `G2:H58` bucket validation is invalid because it applies bucket
names to `Progress`. It must be replaced by independent `Bucket` and `Progress`
rules.

## Acceptance data

The production workbook contains only maintainer-owned concert tasks. E2E
acceptance uses a temporary concert submission against the current catalogue
and verifies the actual selected rows. Coverage for optional fields and unusual
values may be exercised with temporary rows that are removed after the test;
the repository does not require a permanent synthetic seed catalogue.

## Flow preflight checks

The production Flow owns one runtime validation path; no second repository
checker is required. Preflight performs these checks before plan creation and
classifies failures according to ADR 0002.

1. Every required table and column is readable through the Excel connector.
2. The complete bucket catalog and every populated label slot are structurally
   valid because all of them are copied into every plan.
3. Each selected row is validated atomically: its required text is nonblank,
   its `TaskId` is unique, and every responsibility group, bucket, progress,
   priority, and label reference resolves exactly once.
4. Each selected row has an integer `DaysFromEvent`, 1 through 20 valid unique
   assignees, and at most 20 unique checklist items.
5. Each selected row's `AssignedToEmails` cell exposes a recalculated formula
   result.
6. Selected rows expose no cached Excel errors such as `#REF!`, `#VALUE!`,
   `#NAME?`, `#N/A`, or `#DIV/0!`.
7. At least one selected row remains valid.

Missing sheets, tables, or required columns are fatal. Invalid selected task
rows are collected as warnings; the Flow proceeds only when at least one valid
task remains.

## Current-workbook delta

The checked-in workbook already has the seven original sheets, all seven
original tables, the required 12 task columns, 56 assignment formulas, and no
cached formula errors. It needs these changes during implementation:

- make `TaskId` mandatory for every task intended for Flow selection without
  replacing the maintainer-owned task catalogue;
- treat duplicate or blank responsibility-group mappings as work-in-progress
  data that invalidates only selected tasks referencing them;
- repair the bucket/progress validation ranges;
- recalculate and verify cached formula results.

Nothing under `archive/` may be edited or regenerated. Authoring and updating
the real task catalogue remains maintainer-owned and outside this Wayfinder
destination.

## Evidence and related decisions

- [Microsoft Form definition](../FormDefinition.md)
- [Excel template reference](../ExcelTemplate.md)
- [Production Flow contract audit](./production-flow-contract-audit.md)
- [Planner task field and label mapping](./planner-task-field-mapping.md)
- [KISS discard-and-resubmit ADR](../adr/0002-discard-failed-plans-and-resubmit.md)

No workbook or production Flow file was changed while resolving this research
ticket.
