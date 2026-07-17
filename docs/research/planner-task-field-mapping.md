# Planner task field and label mapping

Research date: 2026-07-15

Decision revision: 2026-07-17. The field and API findings remain valid, but
the persisted replay/recovery sequence is superseded by
[ADR 0002](../adr/0002-discard-failed-plans-and-resubmit.md). This revision
uses a single-pass write sequence and manual deletion after generation failure.

## Question

How should `AssignedToEmails`, `Progress`, `Priority`, `Labels`,
`Description`, and `CheckListItems` from `tbTasksTemplate` be validated and
written to a basic Microsoft Planner plan in one generation attempt without
depending on deprecated or undocumented connector behavior?

## Recommendation

Keep the standard Planner connector for task creation. Its current stable
`Create a task` operation (`CreateTask_V3`) accepts semicolon-separated user
IDs or e-mail addresses, category flags `category1` through `category25`, and
numeric priority in the same request. Use Microsoft Graph through the existing
custom connector for the gaps the standard connector does not cover with a
fully documented, single-pass contract:

1. get and patch plan details to set category display names;
2. get and patch tasks to set exact numeric progress; and
3. get and patch task-details resources once to set descriptions and checklist
   items with independent ETag protection.

Do not use the checked-in Flow's undocumented `CreateChecklistItem` operation
or the stable connector's undocumented progress wire enum as the final
contract. Extend the existing Graph custom connector with the required GET and
PATCH operations instead.

Validate the shared workbook contract and classify every selected row before
plan creation. If at least one row is valid, configure all nonblank label names
once after plan creation and create only the valid tasks; collect each invalid
row's `TaskId` value (or `(missing)`), title, and reason for the warning e-mail. Create each valid task
with all create-time fields in one call, retain its returned Planner task ID
only within the current run, then apply progress and task details.

## Workbook-to-Planner mapping

| Workbook field | Validation and normalization | Planner target | Write strategy |
| --- | --- | --- | --- |
| `AssignedToEmails` | Split on `;`, trim, drop empty entries, compare case-insensitively, and reject blanks, duplicates, or more than 20 assignees. Every task requires at least one valid assignee. | Connector `assignments`; Graph `plannerTask.assignments` | Pass the normalized semicolon-separated addresses to `CreateTask_V3`. The connector explicitly accepts IDs or e-mail addresses. If Graph is used instead, resolve every address to a Microsoft Entra user ID first and use that ID as the open-property name with a `plannerAssignment` value and `orderHint`. |
| `Progress` | Allow blank, `Not started`, `In progress`, or `Completed` only. Blank has the same initial result as `Not started`. | `plannerTask.percentComplete` | Project mapping: blank/`Not started` = `0`, `In progress` = `50`, `Completed` = `100`. Creation defaults to not started. Skip the follow-up write for blank/`Not started`; otherwise use Graph GET/PATCH with the task ID returned by creation. |
| `Priority` | Require one of `Urgent`, `Important`, `Medium`, or `Low`. Do not silently turn an unknown value into Medium. | `plannerTask.priority` | Set at creation: `Urgent` = `1`, `Important` = `3`, `Medium` = `5`, `Low` = `9`. Graph and the connector accept `0` through `10`; these four values are Planner's canonical UI values. |
| `Labels` | Split on `;`, trim, drop empty values, reject duplicates, and require an exact name in `tbLabels[Name]`. Require every referenced label row to have a valid `Label1`-`Label25` slot. | Task `appliedCategories.categoryN`; plan-details `categoryDescriptions.categoryN` | Build all 25 Boolean flags and supply the true flags to `CreateTask_V3`. Separately set each populated plan category description from `tbLabels[Name]` through Graph before task creation. |
| `Description` | Preserve line breaks and plain URLs. Blank is allowed. | `plannerTaskDetails.description` | After task creation, GET task details and PATCH the intended description together with any missing checklist items, using the details ETag. Omitted detail properties remain unchanged. |
| `CheckListItems` | Split on `;`, trim, drop empty entries, require no more than 20 items, and reject duplicate titles after normalization. | `plannerTaskDetails.checklist` | Generate each checklist GUID in memory, GET the new task details once, and PATCH the complete intended description and checklist once with the details ETag. Set every new item to `isChecked: false`; any write failure is a generation failure. |

The workbook currently uses `Label1` through `Label9` for these names and
colors:

| Slot | Name | Connector color |
| --- | --- | --- |
| `category1` | `Organizace` | Pink |
| `category2` | `Umělci` | Red |
| `category3` | `Propagace` | Yellow |
| `category4` | `Logistika` | Green |
| `category5` | `Finance` | Blue |
| `category6` | `Administrativa` | Purple |
| `category7` | `Hudba` | Bronze |
| `category8` | `Provoz` | Lime |
| `category9` | `IT` | Aqua |

Slots 10 through 25 remain available for future labels but need no preallocated
blank workbook rows. A slot becomes usable only when maintainers add a unique
`Label` value and nonblank `Name`. The connector color is fixed by the category
number; `tbLabels[Color]` is therefore validation/documentation, not a value
sent to Planner. For the current nine mappings it must equal the colors shown
above.

## Assignment identity and membership

At Graph level, assignments are keyed by Microsoft Entra user object IDs, not
by display name or task title. Graph describes Planner assignment as assigning
users in the Microsoft 365 group, and group membership also controls access to
the group-contained plan. The standard connector resolves its documented
semicolon-separated IDs or e-mail addresses internally, which avoids adding
directory-read permissions solely for this mapping.

Consequently, the minimum implementation is:

- normalize and validate the address syntax before plan creation;
- pass addresses to `CreateTask_V3` with the real target group ID;
- treat an unresolvable address or unauthorized/nonmember assignment as a hard
  validation or creation failure, never as a reason to create an unassigned
  task silently;
- verify resolution and membership behavior in the target tenant during E2E
  acceptance.

The KISS design does not add directory or group-membership lookups. Preflight
validates the formula result and address syntax; the standard Planner connector
resolves addresses during task creation. An unresolvable address or nonmember
response is a fatal generation failure. This avoids broadening the custom
connector beyond its delegated `Tasks.ReadWrite` scope.

## Safe call sequence

### Plan-level labels

1. Validate the shared workbook contract, classify selected rows atomically,
   and require at least one valid task before creating the plan.
2. Create the plan once and retain its ID for the remainder of the run and for
   any failure e-mail.
3. `GET /planner/plans/{plan-id}/details` and capture that resource's
   `@odata.etag`.
4. `PATCH /planner/plans/{plan-id}/details` with `If-Match` and only the
   intended `categoryDescriptions` properties. Treat a write conflict or
   ambiguous outcome as a generation failure; do not build a recovery merge
   loop for a newly created plan.
5. Only then create tasks with matching `categoryN` flags.

Category display names and task category flags are different resources. A true
`category7` flag does not itself name category 7 `Hudba`.

### Each task

1. Resolve the bucket ID from the in-run bucket map.
2. Normalize assignments, map priority, and convert requested label names to
   `categoryN` flags.
3. Call stable connector `CreateTask_V3` once with plan ID, actual group ID,
   bucket ID, title, due date, assignments, priority, and all true category
   flags.
4. Retain the returned task ID in the current loop iteration for secondary
   writes; do not persist a template-to-Planner identity map.
5. For `In progress` or `Completed`, use Graph to get the task ETag, then patch
   numeric `percentComplete` (`50` or `100`) with `If-Match`.
6. Generate checklist GUIDs in memory. Use Graph to get task details, retain
   the details ETag, and patch the complete intended description and checklist
   once. Any secondary-write failure is fatal for the run.
7. In E2E acceptance, read back the task and its details: assignments,
   progress, priority, applied categories, description, and every checklist
   item must match the valid template row.

This sequence intentionally carries no durable per-task state. After any
runtime write failure, the operator deletes the partial plan and submits a new
concert request.

## ETags and single-pass write behavior

Planner versions each resource independently. A task ETag cannot be used for
task details or plan details. Graph `PATCH` and `DELETE` require the last known
ETag in `If-Match`. A stale/conflicting write can return `409` or `412`. Because
the plan and tasks are new and the workflow does not resume, the KISS response
is a generation failure followed by manual deletion, not a read/merge/retry
state machine. Do not use `If-Match: *` because it would hide ambiguity.

For task and task-details PATCH requests, properties omitted from the request
retain their existing values. Open collections require a finer distinction:

- assignment keys are user IDs; set a user ID to a `plannerAssignment` object
  to add/update it and to `null` to remove it;
- applied category properties set to `true` are applied and properties set to
  `false` are removed;
- checklist keys are client-provided GUIDs; set a GUID to a checklist-item
  object to add/update it and to `null` to remove it.

Each single-pass details update must use the ETag from its immediately preceding
read and send the complete intended open collection for the new resource.

## Limits and throttling

- Planner supports at most 20 assignees and 20 checklist items per task.
- The standard Planner connector supports basic plans only and is limited to
  100 API calls per connection per 60 seconds.
- Microsoft publishes no Planner-specific Microsoft Graph rate numbers. Graph
  can return `429 Too Many Requests`; honor `Retry-After`, or use exponential
  backoff if it is absent.
- Keep task and checklist loops sequential. For a task with progress,
  description, and checklist, the create plus follow-up calls accumulate
  quickly. A single task-details patch is preferable to one detail update per
  checklist item.
- Planner service-defined object limits can also surface as `403` errors, not
  only throttling errors. Preserve the error code in the failure e-mail when
  possible and always in Power Automate run history.

## Repository impact

The checked-in production Flow already uses stable `CreateTask_V3` for title,
bucket, due date, and priority, and stable `UpdateTaskDetails_V2` for
description. It currently omits assignments, progress, task category flags,
and plan category names. It invokes the old `CreateBucket` operation and an
operation named `CreateChecklistItem` that is not listed in the current
connector action reference. Those two operations should not be carried forward
without live schema verification; use current `CreateBucket_V2` and the
documented task-details model when rebuilding the final Flow.

## Documentation gaps and required live checks

The following points are not fully resolvable from the current public primary
documentation and must be explicit E2E acceptance checks:

1. The v1.0 `plannerCategoryDescriptions` resource documents 25 categories,
   while the v1.0 update-plan-details page still says the update object
   specifies six. The connector exposes task flags 1 through 25, while the
   v1.0 `plannerAppliedCategories` resource page still describes at most six.
   Confirm in the target tenant that category 7 through category 9 can both be
   named through Graph v1.0 and applied through `CreateTask_V3` before relying
   on the current workbook mapping.
2. Stable connector `UpdateTask_V2` documents `percentComplete` only as a
   string and does not publish its accepted wire enum. The selected design uses
   the documented Graph integer property with ETag handling; capture the
   connector value only if a later implementation deliberately revisits that
   choice.
3. The connector reference documents `Update task details`, but its flattened
   single checklist inputs do not state whether repeated calls preserve every
   previous checklist item. The selected design uses one Graph read followed by
   one complete details patch; verify the resulting collection.
4. The connector accepts e-mail addresses but does not document all failure
   semantics for unresolved users and group nonmembers. Test valid member,
   unknown address, duplicate address, and nonmember cases.
5. No FlowStudio token was available during this research, so the deployed
   connector schema and current live Flow could not be compared with the
   checked-in definitions.
6. The cited resource and connector pages do not publish maximum lengths for
   task descriptions, checklist titles, or category display names. Do not
   invent a limit in preflight; test the project's intended maximum-sized
   values and retain the service error if Microsoft rejects one.

Until check 1 succeeds, a conservative fallback is to use only categories 1
through 6 in production or to leave category display names 7 through 9 at
their Planner defaults; silently claiming that all nine custom names were set
is not acceptable.

## Primary sources

- [Planner connector reference](https://learn.microsoft.com/en-us/connectors/planner/)
- [Planner REST API overview and resource versioning](https://learn.microsoft.com/en-us/graph/api/resources/planner-overview?view=graph-rest-1.0)
- [plannerTask resource](https://learn.microsoft.com/en-us/graph/api/resources/plannertask?view=graph-rest-1.0)
- [Create plannerTask](https://learn.microsoft.com/en-us/graph/api/planner-post-tasks?view=graph-rest-1.0)
- [Update plannerTask](https://learn.microsoft.com/en-us/graph/api/plannertask-update?view=graph-rest-1.0)
- [plannerAssignments resource](https://learn.microsoft.com/en-us/graph/api/resources/plannerassignments?view=graph-rest-1.0)
- [plannerTaskDetails resource](https://learn.microsoft.com/en-us/graph/api/resources/plannertaskdetails?view=graph-rest-1.0)
- [Update plannerTaskDetails](https://learn.microsoft.com/en-us/graph/api/plannertaskdetails-update?view=graph-rest-1.0)
- [plannerChecklistItems resource](https://learn.microsoft.com/en-us/graph/api/resources/plannerchecklistitems?view=graph-rest-1.0)
- [plannerCategoryDescriptions resource](https://learn.microsoft.com/en-us/graph/api/resources/plannercategorydescriptions?view=graph-rest-1.0)
- [Update plannerPlanDetails](https://learn.microsoft.com/en-us/graph/api/plannerplandetails-update?view=graph-rest-1.0)
- [Microsoft Planner limits](https://learn.microsoft.com/en-us/planner/planner-limits)
- [Microsoft Graph throttling guidance](https://learn.microsoft.com/en-us/graph/throttling)
- [Microsoft Graph service-specific throttling limits](https://learn.microsoft.com/en-us/graph/throttling-limits)
- [Get a Microsoft Entra user](https://learn.microsoft.com/en-us/graph/api/user-get?view=graph-rest-1.0)
