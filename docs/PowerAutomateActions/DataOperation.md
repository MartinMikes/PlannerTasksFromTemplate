# Data operation

Data operations reshape, filter, and format data inside a cloud flow before it
is passed to another action or connector.

## Most important data operation actions

| Action | Main use | Important note |
| --- | --- | --- |
| `Compose` | Save an intermediate value, array, or expression result. | Good for readability and reuse. |
| `Join` | Turn an array into one string with a delimiter. | Useful for semicolon-separated e-mails or checklist text. |
| `Select` | Project an array into a new shape. | Changes object shape, not item count. |
| `Filter array` | Keep only items that match a condition. | Text matching is case-sensitive. |
| `Create CSV table` | Convert a JSON array into CSV output. | Useful for export or attachments. |
| `Create HTML table` | Convert a JSON array into HTML. | Useful for formatted e-mails. |
| `Parse JSON` | Expose JSON fields as dynamic content. | Best when the input is raw JSON text or loosely typed output. |

## Practical guidance

- Use `Compose` when the same expression would otherwise be repeated in several
  later actions.
- Use `Select` before `Join` when you need to extract one field from an array of
  objects.
- Use `Filter array` to reduce items before looping so the flow stays cheaper
  and easier to debug.
- Use `Create HTML table` only when the next step can really render HTML.

## Project relevance

These actions are a good fit for reshaping Excel rows, building assignment
lists, preparing notification bodies, and cleaning connector outputs before
Planner updates.

## Source links

- <https://learn.microsoft.com/en-us/power-automate/data-operations>
- <https://learn.microsoft.com/en-us/azure/logic-apps/workflow-definition-language-functions-reference>
