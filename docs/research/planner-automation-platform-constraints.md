# Planner automation platform constraints

Research date: 2026-07-15

Decision revision: 2026-07-17. Platform facts remain valid, but the earlier
replay-and-recovery recommendations are superseded by
[ADR 0002](../adr/0002-discard-failed-plans-and-resubmit.md). The production
design intentionally uses one generation attempt, manual deletion of a partial
plan, and a new Form submission instead of durable idempotency or recovery.

## Scope

This memo records the Microsoft platform constraints that affect the production
Flow `CampanulaCreateConcertPlanFromTemplate`. It uses only current, official
Microsoft documentation. Repository files were inspected only to connect the
platform facts to the implementation audit; this memo does not treat the
checked-in implementation or existing project documentation as evidence of
platform behavior.

## Microsoft Forms

- The Microsoft Forms connector works only with organizational accounts. Group
  forms do not appear in the form picker; their `Form Id` must be copied from
  the form URL and entered manually. This makes the form identifier an
  environment-specific deployment value that must be verified after import.
- `When a new response is submitted` is a webhook trigger whose payload exposes
  a numeric `responseId`. The trigger payload does not contain the complete
  answer set. `Get response details` requires both `Form Id` and `Response Id`,
  and returns dynamic output. The trigger's `responseId` is available for
  diagnostics and correlation. This project deliberately does not persist it
  for duplicate protection; rare duplicate delivery is an accepted manual
  cleanup case under ADR 0002.
- The connector documents 300 API calls per connection per 60 seconds.
- Microsoft documents a Forms-specific deployment trap: after trigger
  concurrency control has been enabled and disabled, a
  `CannotDisableTriggerConcurrency` error can require exporting the Flow,
  removing the concurrency setting from JSON, and reimporting it. Independently,
  Power Automate trigger concurrency is off by default and permits simultaneous
  runs; when enabled it can serialize runs, but has finite waiting-run capacity.
  Serialization can reduce races, but it is not a durable idempotency mechanism.

Sources: [Microsoft Forms connector](https://learn.microsoft.com/en-us/connectors/microsoftforms/),
[Power Automate limits and concurrency](https://learn.microsoft.com/en-us/power-automate/limits-and-config),
[trigger concurrency guidance](https://learn.microsoft.com/en-us/power-automate/guidance/coding-guidelines/optimize-power-automate-triggers).

## Excel Online (Business)

- The connector supports workbooks in OneDrive for Business, SharePoint Sites,
  and Microsoft 365 Groups, with a maximum supported workbook size of 25 MB.
- `List rows present in a table` returns at most 256 rows by default. Pagination
  must be enabled wherever a table can exceed that count. Pagination and retry
  requests also consume Power Platform requests.
- Server-side filtering supports only `eq`, `ne`, `contains`, `startswith`, and
  `endswith`; only one filter function can be applied to a column, and only one
  column can be used for sorting. Data returned when filtering or sorting may be
  temporarily stale. `Filter Query`, `Order By`, and `Select Query` support only
  alphanumeric column names. The project's `TemplateType` column is compatible,
  but a compound "concert type OR location" selection should not assume richer
  server-side query support; reading with pagination and filtering in the Flow
  is the safer portable design.
- Existing filters in the workbook are ignored when the action has no filter
  query. Blank reserved rows therefore need an explicit Flow-side validity
  filter and cannot be hidden reliably with an Excel view filter.
- The connector retrieves only the first 500 columns by default. This is not a
  present risk for the template, but a `Select Query` is available when a narrow
  stable contract is desired.
- Simultaneous modifications of one workbook by Excel desktop/web, Power
  Automate, Logic Apps, Power Apps, or other connectors are unsupported and can
  cause merge conflicts or inconsistent data. A file can remain locked for
  update or deletion for up to six minutes after connector use. Even read-only
  connector operations can create a new file version because of backend save
  behavior.
- Writes may become visible up to 30 seconds after a successful response.
  Formula-heavy workbooks can time out during recalculation, and retry behavior
  can duplicate inserts. The production Flow currently needs only table reads;
  maintainers should avoid editing/replacing the SharePoint workbook during a
  run and should validate that formula-derived `AssignedToEmails` values are
  populated before release.

Source: [Excel Online (Business) connector](https://learn.microsoft.com/en-us/connectors/excelonlinebusiness/).

## Planner connector

- The standard Planner connector supports basic plans only and is throttled at
  100 API calls per connection per 60 seconds. A concert with many tasks can
  consume several calls per task (create, update, details/checklist), so loops
  must be kept sequential or deliberately bounded. Read-only operations may
  use bounded retries, but non-idempotent Planner creation actions fail fast so
  ambiguous outcomes lead to manual deletion instead of duplicate content.
  Connector limits are likely to be reached before the broader Flow limits.
- The current `Create a bucket` action accepts a name, plan ID, and group ID.
  `Create a task` accepts a plan ID, title, optional bucket, start/due dates,
  semicolon-separated user IDs or email addresses, category flags, and numeric
  priority. Titles are limited to 255 characters.
- The stable create action exposes category booleans `category1` through
  `category25` and a priority integer from 0 through 10. Planner currently maps
  0-1 to Urgent, 2-4 to Important, 5-7 to Medium, and 8-10 to Low, while setting
  1, 3, 5, and 9 respectively in its UI. The workbook's documented mapping to
  1/3/5/9 is therefore valid.
- Initial progress is not a parameter of the documented stable create action.
  `Update a task` exposes progress/percent complete and assignments; the newer
  V2 preview also exposes bucket and categories. A complete implementation must
  create the task and then update progress when the workbook value is not the
  create-time default.
- Description and checklist belong to task details. `Update task details`
  exposes description plus checklist item ID, title, and checked state. They are
  not create-task parameters. The KISS implementation should write the complete
  intended details once per task; E2E tests must verify the resulting
  description and checklist instead of relying only on action status.
- The create action accepts assignee email addresses directly, so the workbook's
  semicolon-separated `AssignedToEmails` representation fits the connector.
  At the Graph model level, assignments are user IDs and Planner is intended to
  assign users in the Microsoft 365 group. Invalid/unresolvable addresses and
  nonmembers must therefore be exercised as explicit validation/error cases.
- Task categories and plan category descriptions are separate concerns. The
  standard connector can apply category flags to tasks, and currently exposes
  only `Get plan details (Preview)` for plan details. It does not document an
  action for changing the plan's category display names. If the names in
  `tbLabels[Name]` must appear in Planner, setting plan category descriptions
  requires an additional supported mechanism, such as Microsoft Graph, before
  or alongside applying category flags.
- Some connector actions require `Group Id` only to populate dependent designer
  dropdowns; after a valid plan ID is supplied, Microsoft says any group-ID
  value can work despite designer warnings. For maintainability, the actual
  target group should still be supplied consistently.
- The standard connector action catalog does not provide plan creation. Using a
  Microsoft Graph custom connector for `POST /planner/plans` is therefore a
  justified boundary rather than a duplication of a standard action.

Sources: [Planner connector](https://learn.microsoft.com/en-us/connectors/planner/),
[Planner REST API overview](https://learn.microsoft.com/en-us/graph/api/resources/planner-overview?view=graph-rest-1.0),
[planner task creation](https://learn.microsoft.com/en-us/graph/api/planner-post-tasks?view=graph-rest-1.0).

## Microsoft Graph plan creation

- `POST /planner/plans` requires `container` and `title`. For a Microsoft 365
  group, the canonical container URL is
  `https://graph.microsoft.com/v1.0/groups/{id}`. A plan container controls
  authorization and lifecycle, and cannot be changed after creation through the
  normal plan resource.
- For delegated work/school access, the least-privileged permission is
  `Tasks.ReadWrite`; `Group.ReadWrite.All` is the documented higher-privileged
  alternative. Application access uses `Tasks.ReadWrite.All`. Personal accounts
  are unsupported. The repository custom connector uses delegated OAuth, so its
  `Tasks.ReadWrite` scope is sufficient in principle and should not be widened
  without a demonstrated need.
- When the container is a Microsoft 365 group, the signed-in user creating the
  plan must be a member of that group. The same identity behind the production
  custom-connector connection therefore needs confirmed membership.
- A successful create returns `201 Created` and the new plan object/ID. Microsoft
  calls out 400, 403, and 404 as common errors to handle. The ID is required by
  all subsequent bucket and task actions and must remain available within the
  run so a failure e-mail can identify the partial plan.
- The request contract has no documented client-supplied idempotency key. This
  supports the inference that automatic retries or repeated Forms processing
  can create another plan. The project accepts the rare duplicate-delivery risk
  and does not add external deduplication; non-idempotent create retries are
  disabled and any duplicate plan is removed manually. Plan title alone must
  not be treated as a unique key.
- Graph Planner APIs, like the standard connector, expose basic plans rather
  than premium plans.

Sources: [create plannerPlan](https://learn.microsoft.com/en-us/graph/api/planner-post-plans?view=graph-rest-1.0),
[plannerPlanContainer](https://learn.microsoft.com/en-us/graph/api/resources/plannerplancontainer?view=graph-rest-1.0),
[Planner REST API overview](https://learn.microsoft.com/en-us/graph/api/resources/planner-overview?view=graph-rest-1.0).

## Solution deployment, connections, and configuration

- A connection stores authentication credentials. A connection reference is a
  solution component that points to a connection; solution-aware flows bind to
  references rather than directly to credentials. On target import, every
  connection reference must be mapped to a usable target connection. The user
  enabling the Flow must own or be allowed to use every underlying connection.
- Connection-reference and environment-variable mappings can be supplied
  noninteractively with a deployment settings JSON file. Import-time validation
  checks that mapped connections are usable by the connection-reference owner.
  The production pipeline should use such settings or explicitly document the
  mandatory manual mapping step; packaging connection references alone does not
  package authenticated connections.
- Environment variables are solution components intended for values that differ
  by environment, and their target values can be supplied during import without
  editing Flow logic. At minimum the audit should check whether Form ID, Planner
  group/container ID, SharePoint site/library/workbook locator, and notification
  recipient are environment variables rather than hardcoded production values.
- A custom connector must be created in or added to a solution before export to
  be solution-aware for connection-reference portability. Role assignments for
  solution custom connectors are not preserved during import/export and must be
  configured in the target environment.
- Microsoft documents a critical first-deployment ordering limitation: custom
  connectors must be imported and registered before connection references and
  flows that use them. If a target environment does not already contain the
  connector, Microsoft recommends importing a separate connector-only solution
  first. Importing one solution that simultaneously introduces the custom
  connector, its connection reference, and its Flow can fail or be unable to
  start because registration has not completed.
- A custom connector requires a Power Automate Premium or trial license to run.
  License and target-environment DLP policy checks are therefore part of E2E
  feasibility, even if solution import succeeds.
- Correct connection mappings can allow a Flow to be turned on automatically
  after import, but activation is not equivalent to readiness: the custom
  connector must be registered/shared, its OAuth connection signed in and
  consented, all standard connections healthy, and the Forms webhook trigger
  successfully registered.

Sources: [connection references](https://learn.microsoft.com/en-us/power-apps/maker/data-platform/create-connection-reference),
[environment variables in Power Automate](https://learn.microsoft.com/en-us/power-automate/environment-variables),
[deployment settings](https://learn.microsoft.com/en-us/power-platform/alm/conn-ref-env-variables-build-tools),
[custom connectors in solutions](https://learn.microsoft.com/en-us/connectors/custom-connectors/customconnectorssolutions),
[Power Automate limits](https://learn.microsoft.com/en-us/power-automate/limits-and-config).

## Required audit and E2E gates

The platform facts above imply these concrete acceptance gates for this project:

1. Verify that both Excel list-row actions have pagination enabled with a
   threshold above the supported template size, and that Flow-side filtering
   excludes blank rows and selects both the concert-type and location rows.
2. Verify bounded/sequential Planner loops and explicit failure handling. Count
   calls for a representative maximum template against 100 calls per minute.
3. Verify all documented fields independently in Planner: bucket, title, due
   date, priority, every assignee, progress, applied category flags/category
   names, description, and every checklist item.
4. Exercise the KISS failure path immediately after plan creation and midway
   through task creation. Verify that non-idempotent creates do not retry, the
   failure e-mail identifies the partial plan and corrective step, the operator
   can delete it manually, and a new Form submission starts cleanly. Document
   rather than prevent the accepted duplicate-delivery risk.
5. Make first deployment connector-first, or prove the target already has the
   matching registered connector. Map every connection reference and
   environment variable; verify connector role assignment, delegated consent,
   premium licensing, DLP allowance, and group membership.
6. Only then turn on the Flow and perform an optional live test submission using
   a clearly temporary concert. Capture the Forms response ID, Power Automate
   run ID, created Planner plan ID, task counts, notification result, and manual
   cleanup outcome as the E2E evidence.
