# Built-in tools

Power Automate built-in tools are native actions and expression features that
do not require a separate business connector. In practice, they are the glue
between triggers and connectors such as Excel, Planner, and Outlook.

## What to use them for

- Branching and loop control
- Reshaping arrays and JSON
- Date, time, and number calculations
- Temporary state inside a flow

## Most useful built-in actions and tools

| Tool | Use it for |
| --- | --- |
| `Condition` | Branch when a value is true or false. |
| `Apply to each` / `Do until` / `Scope` | Repeat work, group actions, or control retries and failure handling. |
| `Compose` | Store an intermediate value or expression result once and reuse it later. |
| `Select` / `Filter array` / `Join` / `Create HTML/CSV table` | Reshape arrays and prepare payloads for mail, tables, or connector calls. |
| `Parse JSON` | Turn raw JSON into named dynamic content. |
| `Convert time zone` / `formatDateTime()` | Normalize timestamps before writing them to other systems. |
| Variables | Keep counters, arrays, strings, and object state across the flow. |
| Expression functions | Handle math, date/time, string, collection, and JSON logic inline. |

## Practical guidance

- Prefer built-in tools before adding extra connector actions for simple
  transformations.
- Use `Compose` to keep long expressions readable and reusable.
- Use `Parse JSON` only when the input is really untyped JSON; many connector
  outputs are already structured.
- Keep transformation steps separate from connector calls so debugging is
  easier in run history.

## Source links

- <https://learn.microsoft.com/en-us/power-automate/add-condition>
- <https://learn.microsoft.com/en-us/power-automate/data-operations>
- <https://learn.microsoft.com/en-us/power-automate/create-variable-store-values>
- <https://learn.microsoft.com/en-us/power-automate/date-time-values>
- <https://learn.microsoft.com/en-us/power-automate/convert-time-zone>
- <https://learn.microsoft.com/en-us/azure/logic-apps/workflow-definition-language-functions-reference>
