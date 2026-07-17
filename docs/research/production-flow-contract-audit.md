# Production Flow contract audit

Audit date: 2026-07-15

Decision revision: 2026-07-17. The implementation evidence remains an audit of
the same source revision, while the required production contract has been
updated to the KISS failure policy in
[ADR 0002](../adr/0002-discard-failed-plans-and-resubmit.md).

## Question

Which behaviors promised by the project documentation are implemented in the
production solution source, which are missing or inconsistent, and what exact
contract must the final implementation satisfy?

## Verdict

`CampanulaCreateConcertPlanFromTemplate` has a coherent happy path and its
checked-in solution source can be packed as a managed solution. It is not yet
production-complete against the documented contract.

The Flow currently creates a plan, buckets, filtered tasks, due dates,
priorities, descriptions, checklist items, and a success e-mail. It does not
apply task assignees, initial progress, or labels. It also has no preflight
validation or actionable failure notification. Durable replay protection and
partial-failure recovery are intentionally outside the revised KISS contract.
Environment-specific identifiers are embedded as Flow parameter defaults rather
than solution environment variables, and the deployment does not provide
connection-reference or environment-variable mappings.

The workbook is structurally compatible with the Flow, but its current content
cannot exercise the documented Microsoft Form choices. This is a known
temporary content state; the final real task rows remain maintainer-owned.

## Evidence boundary

The production implementation is
[`src/CampanulaPlannerFlows`](../../src/CampanulaPlannerFlows/). Older artifacts
under `src/exported` were not treated as production truth. The audit compared:

- [README](../../README.md) and every project document it links;
- the production [Flow definition](../../src/CampanulaPlannerFlows/Workflows/CampanulaCreateConcertPlanFromTemplate.json),
  workflow metadata, connection references, and custom connector;
- the [deployment workflow](../../.github/workflows/deploy.yml) and solution
  metadata;
- [`PlannerTasksTemplate.xlsx`](../../templates/PlannerTasksTemplate.xlsx),
  including tables, formulas, validation rules, and cached formula values;
- current Microsoft platform constraints recorded in
  [Planner automation platform constraints](./planner-automation-platform-constraints.md).

No live tenant comparison was possible because this session had no FlowStudio
token. Live state remains the responsibility of the end-to-end feasibility
ticket.

## Coverage matrix

| Contract area | Current evidence | Status |
| --- | --- | --- |
| Forms trigger | Webhook trigger plus `Get response details` uses the same Form ID and trigger `responseId`. | Implemented |
| Input mapping | Concert name, type, venue, and event date map to named Compose actions. | Implemented |
| Input validation | No required-value, allowed-choice, date, or length validation exists. | Missing |
| Duplicate protection | `responseId` is not persisted or checked before plan creation. | Intentionally omitted; manual duplicate cleanup accepted |
| Plan creation | Custom connector calls Graph `POST /planner/plans` with group container URL and plan title. | Implemented |
| Plan naming | Title is `<concert name> (<venue>)`. | Implemented |
| Workbook pagination | Both list-row actions enable pagination with a 5,000-item threshold. | Implemented |
| Planning scope | Flow-side filter selects exact concert-type or venue rows and excludes blank task names. | Implemented |
| Bucket creation | Buckets are created sequentially from `tbBuckets[Bucket]` and stored in an in-run map. | Implemented |
| Task core fields | Title, bucket, due date, and mapped numeric priority are supplied at creation. | Implemented |
| Assignments | `AssignedToEmails` is never read by the Flow. | Missing |
| Initial progress | `Progress` is never read or mapped to percent complete. | Missing |
| Task labels | `Labels` and `tbLabels` are never read; no task category flags are set. | Missing |
| Label display names | No action configures Planner plan category descriptions from `tbLabels[Name]`. | Missing |
| Description | Task details are updated with workbook description text. | Implemented |
| Checklist | Nonblank semicolon-separated items are added sequentially. | Implemented |
| Success notification | Office 365 Outlook sends an e-mail containing inputs and created-task count. | Implemented |
| Failure notification | Failures stop the success-only chain; no operator e-mail or diagnostic summary is sent. | Missing |
| KISS failure handling | No catch path sends a partial-plan link and manual delete/resubmit instructions. | Missing |
| Connection references | All five Flow references match solution connection-reference definitions. | Implemented in source |
| Environment portability | Form/question IDs, Planner group, Excel locators, and recipient are hardcoded defaults. | Missing |
| First deployment | One package introduces connector, reference, and Flow together; no connector-first path exists. | At risk |
| Package construction | Power Platform CLI 2.7.4 successfully packed the source as Managed. | Verified locally |
| Automated validation | No PR/static validation parses the solution source or verifies a pack before release. Workbook business validation belongs to Flow preflight. | Missing |

## Confirmed implementation strengths

1. All production JSON and XML files parse successfully.
2. Workflow and `Customizations.xml` connection-reference sets match exactly.
3. The custom connector ID is consistent across the connector metadata,
   connection reference, and solution root component.
4. The connector exposes the `CreatePlan` operation used by the Flow, and the
   Entra application placeholder occurs exactly once before CI substitution.
5. Bucket and task loops are sequential, which protects mutable Flow variables
   and avoids uncontrolled Planner connector concurrency.
6. Workbook and Flow agree on `Bucket`; the compatibility warning in
   `ExcelTemplate.md` claiming that the Flow uses `BucketName` is stale.
7. Workbook assignment formulas have cached values and no cached formula-error
   values were found.
8. The checked-in source packs successfully. Power Platform CLI emitted a
   warning that the ECConnector root component is not represented in
   `Customizations.xml`, but still processed the sharded connector and completed
   the managed pack. A target import must determine whether the warning is
   operationally harmless.

## Blocking gaps

### Complete Planner field mapping

The documentation promises assignments, progress, labels, descriptions, and
checklists. Only the last two are complete.

- Pass semicolon-separated `AssignedToEmails` to task creation or a supported
  assignment update and reject unresolved/nonmember identities explicitly.
- Map `Not started`, `In progress`, and `Completed` to 0, 50, and 100 percent.
- Map each workbook label name to its `Label1` through `Label25` slot, apply the
  corresponding task category flag, and configure the plan's category display
  names. The standard connector cannot complete the display-name step, so the
  Graph connector or another supported mechanism must be extended.
- Preserve description and all checklist items when multiple task-detail
  updates are required.

### KISS failure handling

The Flow creates the irreversible external resource before reading or
validating the workbook. Any later failure can leave an empty or partially
populated plan. Retrying the Forms event can create another plan because Graph
plan creation has no documented idempotency key.

The final design deliberately does not persist Forms response identity or
created-object progress. It must disable retries for non-idempotent Planner
creation actions, retain the current plan ID within the run, and send an
actionable failure e-mail. If a partial plan exists, the operator deletes it,
corrects the cause, and submits a new Form response. Rare duplicate trigger
delivery is accepted and handled by manually deleting the duplicate plan.

### Preflight validation

Before plan creation, the Flow must validate at least:

- an event date strictly after the current Europe/Prague calendar date;
- readable workbook and required tables/columns;
- nonempty, unique bucket names and structurally valid populated label slots;
- each selected task atomically, including a stable `TaskId`, required values,
  unambiguous responsibility-group mapping, resolvable bucket, integer schedule
  offset, recognized values, and at least one valid assignee;
- at least one valid selected template task.

The constrained Form choices and concert title are trusted. A workbook-contract
failure or zero valid selected tasks creates no Planner plan and sends an
actionable failure e-mail. Individual invalid template tasks are skipped; their
`TaskId` value (or `(missing)`), title, and validation reason appear in the
completed-with-warnings e-mail.

### Portable configuration and deployment

The production Flow embeds the Form ID, question IDs, group ID, SharePoint
source/drive/file IDs, and notification recipient. `.env.example` contains
SharePoint URL/library variables that neither the Flow nor CI consumes.

The final solution must model environment-specific configuration as solution
environment variables, map every connection reference and environment variable
during deployment, and document who owns each authenticated connection. A
first-time target deployment must import/register the custom connector before
the connection reference and Flow, or provide evidence that the target already
contains the matching connector.

The pipeline also publishes the semantic-release release before solution pack
and import validation. A failed pack or deployment can therefore leave a
published release that was never deployed. Final CI design must separate build
validation from release publication and record deployment evidence.

## Workbook findings

The workbook contains all seven documented sheets and tables, 56 assignment
formulas, and the Flow-referenced task columns. Its present data state has these
known gaps:

- populated `TemplateType` values are `Dotace`, `Dramaturgický plán`, and
  `Velký v kostele`, not the Form choices `Velký`, `Malý`, `Ignác`, `Jakub`,
  `Kříž`, `Gotika`, and `Jinde`;
- several populated tasks omit required `DaysFromEvent`; the Flow silently maps
  a missing value to zero and schedules the task on the event date;
- one otherwise populated task has no `TemplateType` and is silently excluded;
- `tbGroups` contains three duplicate `Tisk` rows and some responsibility
  groups have no e-mail mapping;
- the bucket data validation incorrectly covers `G2:H58`, applying the bucket
  list to the `Progress` column, while no validation uses
  `tbProgress[Progress]`;
- label validation is a single-choice list although the documented cell format
  permits semicolon-separated labels;
- reserved rows contain formulas and default priority values, so a generic
  nonempty-row check is insufficient; the existing task-name filter is
  necessary.

The workbook-contract decision should preserve the maintainer-owned task
catalogue and define how Flow preflight treats these validation/data-quality
issues without adding synthetic production seed rows.

## Documentation inconsistencies

- README and `Overview.md` describe assignments and labels as current behavior,
  while the Flow does not implement them.
- `Overview.md` says `AssignedToEmails` uses `FILTER`/`TEXTJOIN`; the workbook
  uses `INDEX`/`MATCH` and stores semicolon-separated addresses in the group
  table.
- `ExcelTemplate.md` correctly admits that assignments, progress, and labels
  are missing, but incorrectly says the Flow still references `BucketName`.
- README and `Deployment.md` show root `[Content_Types].xml`, `solution.xml`, and
  `customizations.xml` files that are not present in the actual unpacked source;
  current PAC uses `Other/Solution.xml` and `Other/Customizations.xml`.
- Deployment docs say to resolve environment-specific values but provide no
  environment-variable or deployment-settings mechanism for doing so.
- The local connector-ID substitution instructions edit a tracked source file
  and rely on a later manual revert. A temp staging copy is safer.
- `src/exported` and the Copilot demo workbook are not identified clearly as
  non-production reference artifacts.

## Required production contract

The final technical implementation is acceptable only when all conditions
below are true.

### Event and identity

1. One Forms response is one `Concert request`; `responseId` is retained only
   for in-run diagnostics and e-mail context.
2. No durable response register or replay path exists. Rare duplicate delivery
   may create a duplicate plan, which the operator removes manually.

### Configuration and preflight

1. All environment-specific identifiers are solution environment variables or
   an equivalently explicit ALM contract.
2. All required connections, permissions, group membership, and the workbook
   contract are validated before plan creation where technically possible.
3. The event date must be after today in Europe/Prague. Workbook-level failure
   or zero valid tasks produces no plan and sends an actionable failure e-mail;
   invalid individual task rows are skipped and reported.

### Planner plan and planning scope

1. The plan is created in the configured Microsoft 365 group with title
   `<concert name> (<venue>)`.
2. The selected planning scope is the exact union of populated task rows for
   the chosen concert type and venue.
3. Every nonblank unique workbook bucket exists exactly once in the plan,
   whether or not a selected task uses it.
4. Every nonblank configured label name is applied to its plan category slot,
   whether or not a selected task uses it.

### Tasks

Each valid selected `Template task` produces exactly one Planner task with:

- the documented title and bucket;
- due date equal to event date plus integer schedule offset;
- all valid assignees from `AssignedToEmails`;
- mapped initial progress and numeric priority;
- every recognized workbook label applied to the matching category slot;
- description text preserved as Planner-supported plain text;
- every nonblank semicolon-separated checklist item exactly once.

Any invalid field or reference makes the whole template task invalid. Invalid
template tasks are skipped and reported; a runtime failure while creating a
valid task is a fatal generation failure.

### Completion, notification, and operations

1. A clean-success or completed-with-warnings e-mail includes request context,
   plan identity/link, created counts, and for each skipped row its `TaskId`
   value (or `(missing)`), title, and validation reason.
2. A failure e-mail identifies the request, run, failure stage, plan ID/link
   when available, and instructs the operator to delete the partial plan,
   correct the cause, and submit a new Form response.
3. Non-idempotent Planner creation actions do not retry. Read-only and e-mail
   actions may use bounded retries; no durable notification state or resend
   workflow exists.
4. The solution packs without unexplained warnings, imports using explicit
   settings, has healthy mapped connections, and can register/enable the Forms
   trigger.
5. Static checks run before release publication. A release records whether the
   exact packed artifact was imported successfully.
6. When access permits, temporary end-to-end requests verify every field, clean
   success, completion with warnings, fatal validation before plan creation,
   and injected failure after partial creation followed by manual deletion and
   a clean resubmission. Otherwise the same cases remain an executable manual
   checklist with an explicit access blocker.

## Verification performed

- Parsed every production JSON and XML file.
- Compared connector IDs, operation IDs, and connection-reference sets.
- Parsed workbook tables, formulas, cached values, and validation ranges with
  `openpyxl`; no cached formula errors were found.
- Packed the production source successfully as a Managed solution using Power
  Platform CLI 2.7.4 and removed the temporary package afterward.
- Reviewed the GitHub Actions control flow and configuration inputs.
- Cross-checked platform-dependent conclusions against the official Microsoft
  sources in the companion constraints memo.

No source implementation, workbook, `AGENTS.md`, `CONTEXT.md`, or file under
`archive/` was changed by this audit.
