# Workbook contract and technical seed data

Research date: 2026-07-16

## Question

What exact workbook structure and minimum representative data must
`PlannerTasksTemplate.xlsx` contain so every Microsoft Form concert type and
venue can exercise the complete concert-plan Flow contract without treating
the technical seed as the maintainers' final task catalogue?

## Decision

Keep the current workbook as the source of truth, add one lookup sheet for the
seven Form planning-scope values, and strengthen the existing tables with the
stable identities required by replay and recovery.

The minimum technical seed is seven task rows: one for each concert type and
one for each venue. Those rows deliberately cover every supported progress and
priority value, all nine current Planning labels, blank and populated optional
details, single and multiple checklist items, single and multiple assignees,
negative/zero/positive schedule offsets, and all seven buckets. Their names and
identifiers must make their technical purpose unmistakable. They are runnable
acceptance data, not approved real-world concert tasks.

Do not keep prefilled blank rows inside `tbTasksTemplate`. Maintainers should
add rows by extending the Excel table. This removes the current ambiguity where
blank reserved rows still contain assignment formulas and a default priority.

## Required sheets and tables

The workbook has exactly these eight sheets in this order.

| Sheet | Table | Required purpose |
| --- | --- | --- |
| `Návod` | None | Czech maintainer instructions and an explicit warning that `seed-` rows are technical acceptance data. |
| `PlanningScopes` | `tbPlanningScopes` | Canonical Form values and their dimension. |
| `TasksTemplate` | `tbTasksTemplate` | Template tasks selected by concert type or venue. |
| `Groups` | `tbGroups` | Responsibility-group-to-assignee mapping. |
| `Buckets` | `tbBuckets` | Stable bucket identity, display name, and description. |
| `Progress` | `tbProgress` | Allowed initial progress values. |
| `Priority` | `tbPriority` | Allowed Planner priority names. |
| `Labels` | `tbLabels` | Fixed Planner category slot, display name, color, and usage note. |

English sheet, table, and column identifiers are the automation contract and
must not be translated. Czech values and instructions remain user-facing.

## Planning-scope contract

`tbPlanningScopes` has two required text columns.

| Column | Rule |
| --- | --- |
| `TemplateType` | Unique, nonblank, case-sensitive value used by the Form and `tbTasksTemplate`. |
| `ScopeKind` | Exactly `ConcertType` or `Venue`. |

It contains exactly these rows for the concert-request Flow.

| TemplateType | ScopeKind |
| --- | --- |
| `Velký` | `ConcertType` |
| `Malý` | `ConcertType` |
| `Ignác` | `Venue` |
| `Jakub` | `Venue` |
| `Kříž` | `Venue` |
| `Gotika` | `Venue` |
| `Jinde` | `Venue` |

Any future value must be added to the Form, `tbPlanningScopes`, documentation,
static contract checks, and the Flow's allowed-input validation in one change.
Administrative task scopes such as the current `Dotace` and
`Dramaturgický plán` values do not belong in this table unless a separate Flow
contract is introduced for them.

## Task-table contract

`tbTasksTemplate` retains its current 12 columns and order.

| Column | Required contract |
| --- | --- |
| `TemplateType` | Required exact match in `tbPlanningScopes[TemplateType]`. |
| `TaskId` | Required immutable text key, unique across the entire table. It is the processing-item identity and must never be recycled for a different task. |
| `TaskName` | Required nonblank Planner title. Exact service-length policy remains with the preflight ticket. |
| `GroupName` | Required exact match in the unique `tbGroups[GroupName]` set. |
| `AssignedToEmails` | Required calculated-column formula result. It is never manually seeded. |
| `DaysFromEvent` | Required integer schedule offset; negative, zero, and positive values are valid. |
| `Bucket` | Required exact match in the unique `tbBuckets[Bucket]` set. Preflight resolves the matching stable `BucketId`. |
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

`TaskId` becomes required because the accepted replay design persists each
template task against its Planner task ID. A title is not an identity and may
be edited by users.

## Lookup-table contracts

### Responsibility groups

`tbGroups` has the existing columns `GroupName` and `AssignedToEmails`.

- `GroupName` is required and unique after trimming and case normalization.
- `AssignedToEmails` contains 1 through 20 semicolon-delimited addresses.
- Tokens are trimmed, nonblank, syntactically valid, and unique ignoring case.
- Every group referenced by a technical seed row has a nonblank mapping.
- The three current `Tisk` rows must collapse to one row; blank mappings must
  be completed or the unused rows removed.

### Buckets

`tbBuckets` adds a required first column, `BucketId`, before the existing
`Bucket` and `Description` columns.

| BucketId | Bucket |
| --- | --- |
| `planning` | `Příprava a plánování` |
| `artists-program` | `Umělci a program` |
| `promotion-marketing` | `Propagace a marketing` |
| `production-logistics` | `Produkce a logistika` |
| `finance-administration` | `Finance a administrativa` |
| `concert-day` | `Den koncertu` |
| `post-concert` | `Po koncertu` |

Both `BucketId` and `Bucket` are required and unique. `BucketId` is immutable
processing identity; `Bucket` remains the Planner display name selected by task
rows. Descriptions remain required maintainer guidance but are not sent to
Planner.

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

- It has exactly 25 rows for `Label1` through `Label25`, in numeric order.
- `Label` is the immutable Planner category slot and is unique.
- The first nine names and colors remain the accepted mapping below.
- `Label10` through `Label25` retain their fixed colors but have blank `Name`
  and `Usage` until maintainers intentionally activate them.
- Populated names are unique after trimming and case normalization.
- A task may reference only a row with a nonblank `Name`.

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

The technical seed intentionally references labels 7 through 9 so target-tenant
acceptance cannot overlook the documented uncertainty about naming and applying
categories beyond six. Production must not claim those labels work until the
live check succeeds.

## Excel data validation

Apply validations only to the data rows in `tbTasksTemplate`; do not apply them
to adjacent columns or preallocated blank ranges.

| Column | Excel validation |
| --- | --- |
| `TemplateType` | List: `INDIRECT("tbPlanningScopes[TemplateType]")`; blank prohibited. |
| `GroupName` | List: `INDIRECT("tbGroups[GroupName]")`; blank prohibited. |
| `DaysFromEvent` | Custom whole-number rule; blank prohibited. |
| `Bucket` | List: `INDIRECT("tbBuckets[Bucket]")`; blank prohibited. |
| `Progress` | List: `INDIRECT("tbProgress[Progress]")`; blank allowed. |
| `Priority` | List: `INDIRECT("tbPriority[Priority]")`; blank prohibited. |

Do not use a single-choice Excel list validation for `Labels`; native list
validation conflicts with the documented semicolon-delimited multi-label
format. Token validation belongs in the repository workbook checker and Flow
preflight. The same checker enforces cross-row uniqueness, semicolon-token
rules, required fields, and maximum counts that Excel validation cannot express
reliably across table expansion.

The current `G2:H58` bucket validation is invalid because it applies bucket
names to `Progress`. It must be replaced by independent `Bucket` and `Progress`
rules.

## Exact seven-row technical seed

The seed uses existing responsibility groups with populated mappings. The
`AssignedToEmails` value in every row is the calculated-column formula, not a
hardcoded address.

| TemplateType | TaskId | TaskName | GroupName | DaysFromEvent | Bucket | Progress | Priority | Labels |
| --- | --- | --- | --- | ---: | --- | --- | --- | --- |
| `Velký` | `seed-type-large-001` | `TECHNICKÝ VZOR – typ Velký` | `Finance` | -30 | `Příprava a plánování` | `In progress` | `Urgent` | `Organizace;Hudba` |
| `Malý` | `seed-type-small-001` | `TECHNICKÝ VZOR – typ Malý` | `Sbormistr` | -14 | `Umělci a program` | `Completed` | `Important` | `Umělci;Propagace` |
| `Ignác` | `seed-venue-ignac-001` | `TECHNICKÝ VZOR – místo Ignác` | `Kostel` | -7 | `Propagace a marketing` | `Not started` | `Medium` | `Logistika` |
| `Jakub` | `seed-venue-jakub-001` | `TECHNICKÝ VZOR – místo Jakub` | `Předseda` | 0 | `Produkce a logistika` | _(blank)_ | `Low` | `Finance;Administrativa` |
| `Kříž` | `seed-venue-kriz-001` | `TECHNICKÝ VZOR – místo Kříž` | `Doprava` | 1 | `Finance a administrativa` | `Not started` | `Urgent` | `Provoz` |
| `Gotika` | `seed-venue-gotika-001` | `TECHNICKÝ VZOR – místo Gotika` | `Místopředseda` | 7 | `Den koncertu` | `In progress` | `Medium` | `IT` |
| `Jinde` | `seed-venue-other-001` | `TECHNICKÝ VZOR – místo Jinde` | `Dotace` | 14 | `Po koncertu` | `Completed` | `Low` | _(blank)_ |

Optional-field coverage is exact:

- `seed-type-large-001` has a two-line description whose second line is
  `https://example.invalid/campanula-seed`, and checklist
  `První krok;Druhý krok`.
- `seed-type-small-001` has a one-line description and checklist
  `Jediný krok`.
- `seed-venue-ignac-001` has blank description and checklist values.
- The remaining rows may use short technical descriptions but do not introduce
  new behavioral variants.

This is the irreducible coverage set: removing a row leaves one Form choice
without a selected venue/type task, while the seven rows collectively exercise
all buckets, the four priority names, the three progress names plus blank, all
nine active labels plus blank, formula-derived assignments, each schedule
offset sign, and optional-detail branches.

## Static workbook acceptance checks

The later implementation ticket must add an automated checker that fails when
any of these conditions is false.

1. The workbook opens as OOXML and contains the exact required sheets, tables,
   and columns.
2. `tbPlanningScopes` matches the seven documented Form choices and dimensions.
3. Required text values are nonblank after trimming; technical keys and display
   names are unique under their stated comparison rules.
4. Every task scope, responsibility group, bucket, progress value, priority,
   and Planning label resolves exactly once.
5. Every populated task has a unique `TaskId`, integer `DaysFromEvent`, valid
   assignee tokens, at most 20 assignees, and at most 20 unique checklist items.
6. Every task's `AssignedToEmails` cell contains the required calculated-column
   formula and a recalculated cached result.
7. Data-validation ranges target the intended columns and use the required
   lookup tables.
8. The seven technical seed rows provide the coverage matrix defined above.
9. The workbook contains zero cached Excel errors such as `#REF!`, `#VALUE!`,
   `#NAME?`, `#N/A`, or `#DIV/0!`.
10. Formula recalculation succeeds before delivery and the workbook remains
    readable by both Excel and the Excel Online (Business) connector.

The checker must inspect semantic table content rather than worksheet cell
positions so normal table growth does not invalidate it.

## Current-workbook delta

The checked-in workbook already has the seven original sheets, all seven
original tables, the required 12 task columns, 56 assignment formulas, and no
cached formula errors. It needs these changes during implementation:

- add `PlanningScopes` and `tbPlanningScopes`;
- make `TaskId` mandatory and replace current non-Form task data with the seven
  clearly marked technical seed rows;
- add stable `BucketId` values;
- collapse duplicate responsibility groups and remove or complete blank
  mappings;
- populate explicit `Label10` through `Label25` slot keys while keeping their
  names reserved;
- remove prefilled blank task rows;
- repair the bucket/progress validation ranges and add scope validation;
- recalculate and verify cached formula results.

The existing detailed task content should be preserved outside the production
table for maintainer review before replacement, but nothing under `archive/`
may be edited or regenerated. Authoring the final real task catalogue remains
outside this Wayfinder destination.

## Evidence and related decisions

- [Microsoft Form definition](../FormDefinition.md)
- [Excel template reference](../ExcelTemplate.md)
- [Production Flow contract audit](./production-flow-contract-audit.md)
- [Planner task field and label mapping](./planner-task-field-mapping.md)
- [Replay and recovery ADR](../adr/0001-safe-replay-and-recovery.md)

No workbook or production Flow file was changed while resolving this research
ticket.
