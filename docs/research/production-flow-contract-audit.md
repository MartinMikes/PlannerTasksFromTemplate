# Production Flow contract audit

Audit date: 2026-07-15

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
apply task assignees, initial progress, or labels. It also has no durable replay
protection, preflight validation, partial-failure recovery, or failure
notification. Environment-specific identifiers are embedded as Flow parameter
defaults rather than solution environment variables, and the deployment does
not provide connection-reference or environment-variable mappings.

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
| Duplicate protection | `responseId` is not persisted or checked before plan creation. | Missing |
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
| Partial-failure recovery | No scopes, persisted progress, compensation, resume path, or operator recovery record exists. | Missing |
| Connection references | All five Flow references match solution connection-reference definitions. | Implemented in source |
| Environment portability | Form/question IDs, Planner group, Excel locators, and recipient are hardcoded defaults. | Missing |
| First deployment | One package introduces connector, reference, and Flow together; no connector-first path exists. | At risk |
| Package construction | Power Platform CLI 2.7.4 successfully packed the source as Managed. | Verified locally |
| Automated validation | No PR/static validation checks the Flow contract, workbook, or solution pack before release. | Missing |

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

### Replay and recovery

The Flow creates the irreversible external resource before reading or
validating the workbook. Any later failure can leave an empty or partially
populated plan. Retrying the Forms event can create another plan because Graph
plan creation has no documented idempotency key.

The final design must use the Forms `responseId` as the source-event identity,
persist the created plan ID and progress, distinguish first processing from
replay, and define resume or compensation behavior. The exact storage and
recovery semantics belong to
`Choose safe replay and partial-failure recovery semantics`.

### Preflight validation

Before plan creation, the Flow must validate at least:

- nonblank concert name and a valid event date;
- allowed concert type and venue values;
- readable workbook and required tables/columns;
- nonempty, unique bucket names;
- at least one selected template task;
- required task values and a resolvable bucket;
- integer schedule offsets and recognized priority/progress/label values;
- assignee syntax and the policy for blank or unresolved assignments;
- safe task-title and plan-title lengths.

Validation failures must create no Planner plan and must send an actionable
operator e-mail.

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

The workbook-contract ticket should define the technical seed rows and repair
these validation/data-quality issues without inventing the final concert task
content.

## Documentation inconsistencies

- README and `Overview.md` describe assignments and labels as current behavior,
  while the Flow does not implement them.
- `Overview.md` says `AssignedToEmails` uses `FILTER`/`TEXTJOIN`; the workbook
  uses `INDEX`/`MATCH` and stores semicolon-separated addresses in the group
  table.
- `Overview.md` allows Teams or e-mail; the agreed production channel and the
  current Flow are e-mail only. Teams is a future extension.
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
- `AGENTS.md` does not yet record the strict read-only rule for `archive/`.

## Required production contract

The final technical implementation is acceptable only when all conditions
below are true.

### Event and identity

1. One valid Forms response is one `Concert request`, identified durably by the
   Form ID plus `responseId`.
2. Replaying the same request does not create another concert plan or duplicate
   completed work.
3. The processing record exposes the run state, created plan ID, completed work,
   last error, and safe operator action.

### Configuration and preflight

1. All environment-specific identifiers are solution environment variables or
   an equivalently explicit ALM contract.
2. All required connections, permissions, group membership, workbook tables,
   columns, values, and selected rows are validated before plan creation where
   technically possible.
3. Invalid input produces no plan and sends one actionable failure e-mail.

### Planner plan and planning scope

1. The plan is created in the configured Microsoft 365 group with title
   `<concert name> (<venue>)`.
2. The selected planning scope is the exact union of populated task rows for
   the chosen concert type and venue.
3. Every nonblank unique workbook bucket required by selected tasks exists
   exactly once in the plan.
4. Plan category descriptions match the configured workbook label slots and
   names.

### Tasks

Each selected `Template task` produces exactly one Planner task with:

- the documented title and bucket;
- due date equal to event date plus integer schedule offset;
- all valid assignees from `AssignedToEmails`;
- mapped initial progress and numeric priority;
- every recognized workbook label applied to the matching category slot;
- description text preserved as Planner-supported plain text;
- every nonblank semicolon-separated checklist item exactly once.

Invalid task data follows an explicit all-or-nothing or recoverable partial-run
policy chosen by the recovery ticket; it must never fail silently.

### Completion, notification, and operations

1. A success e-mail is sent only after all required work succeeds and includes
   request identity, plan identity/link, and created counts.
2. A failure e-mail identifies the request, run, failure stage, plan ID when
   already created, and the safe recovery action.
3. Planner throttling and connector retries cannot create duplicates.
4. The solution packs without unexplained warnings, imports using explicit
   settings, has healthy mapped connections, and can register/enable the Forms
   trigger.
5. Static checks run before release publication. A release records whether the
   exact packed artifact was imported successfully.
6. When access permits, a temporary end-to-end request verifies every field,
   replay after success, and recovery after injected failures. Otherwise the
   same cases remain an executable manual checklist with an explicit access
   blocker.

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
