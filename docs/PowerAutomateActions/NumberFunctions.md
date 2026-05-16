# Number functions

Number handling in Power Automate is mainly done with expression functions.
These functions are shared with the workflow definition language used by Azure
Logic Apps.

## Most important number functions

| Function | Main use |
| --- | --- |
| `add()` | Add two numbers. |
| `sub()` | Subtract one number from another. |
| `mul()` | Multiply numbers. |
| `div()` | Divide numbers. |
| `mod()` | Get the remainder after division. |
| `min()` / `max()` | Pick the smallest or largest value. |
| `rand()` | Generate a random integer in a range. |
| `range()` | Create an integer array from a start value. |
| `int()` / `float()` / `decimal()` | Convert text or other values into numeric types. |
| `formatNumber()` | Convert a number to a formatted string. |

## Important notes

- Use explicit conversion (`int()`, `float()`, `decimal()`) when numeric values
  arrive as strings from forms, JSON, or connector outputs.
- `div()` and `mod()` are useful for schedule math, batching, or index-based
  logic.
- `formatNumber()` is for display or output formatting, not for storing a value
  that still needs more math later.

## Project relevance

These functions are useful for due-date offsets, progress calculations, row
indexing, and any normalization that needs numeric rather than text behavior.

## Source links

- <https://learn.microsoft.com/en-us/azure/logic-apps/workflow-definition-language-functions-reference>
