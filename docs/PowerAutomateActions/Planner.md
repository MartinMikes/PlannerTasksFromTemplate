# Planner

The Planner connector handles bucket and task work inside Microsoft Planner. It
is the standard connector used after a plan already exists.

## Most important actions

| Action | Main use |
| --- | --- |
| `Create a bucket` | Create a bucket inside a plan. |
| `List buckets` | Read the buckets in a plan. |
| `Create a task` | Create a task with title, dates, assignees, priority, bucket, and category flags. |
| `Get a task` / `Get task details` | Read task metadata and detailed content. |
| `List tasks` / `List my tasks` | Read plan tasks or user-assigned tasks. |
| `Add assignees to a task` / `Remove assignees from a task` | Maintain task assignments. |
| `Update a task` / `Update a task (V2)` | Update dates, progress, bucket, assignees, and categories. |
| `Update task details` | Update description, checklist items, and references. |
| `Get plan details (Preview)` | Retrieve plan-level detail when needed. |
| `Delete a task (Preview)` | Remove an existing task. |

## Important limitations and notes

- Microsoft documents that the connector currently supports **basic plans only**.
- Some actions ask for `Group Id` mainly to populate dependent dropdowns. After
  a valid `Plan Id` is chosen, the action can still work even if the `Group Id`
  field warning looks misleading.
- Connector throttling is **100 API calls per connection per 60 seconds**.
- Task titles are limited to **255 characters**.
- Priority uses numeric values: Planner interprets `1` as urgent, `3` as
  important, `5` as medium, and `9` as low.
- Category labels are exposed as `category1` through `category25`.
- Avoid deprecated action variants unless you are maintaining an old flow.

## Project relevance

This project uses Planner to create buckets and tasks from Excel data after the
plan itself is created through the custom Microsoft Graph connector.

## Source links

- <https://learn.microsoft.com/en-us/connectors/planner/>
- <https://learn.microsoft.com/en-us/graph/api/resources/plannerplan?view=graph-rest-1.0>
- <https://learn.microsoft.com/en-us/graph/api/planner-post-plans?view=graph-rest-1.0&tabs=http>
