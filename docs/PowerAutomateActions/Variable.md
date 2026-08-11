# Variable

Variables store state inside one cloud flow run. They are useful for counters,
temporary arrays, text accumulation, and object-based working state.

## Most important variable actions

| Action / function | Main use |
| --- | --- |
| `Initialize variable` | Create a variable with a type and optional start value. |
| `Set variable` | Replace the current value. |
| `Increment variable` | Increase an integer or float variable. |
| `Decrement variable` | Decrease an integer or float variable. |
| `Append to string variable` | Add text to the end of a string variable. |
| `Append to array variable` | Add an item to the end of an array variable. |
| `variables()` | Read a variable value inside an expression. |

## Important notes

- Variable types include integer, float, boolean, string, array, and object.
- Variables are global only within the current flow run.
- Variables must be initialized at the global flow level, not inside scopes,
  conditions, or loops.
- If an `Apply to each` loop updates variables and you need deterministic
  results, keep the loop sequential.
- Use a start value even when optional so later readers know the intended
  baseline.

## Project relevance

Variables are useful for counters, checklist accumulation, prepared assignee
lists, and carrying intermediate values across several Planner or Outlook steps.

## Source links

- <https://learn.microsoft.com/en-us/power-automate/create-variable-store-values>
- <https://learn.microsoft.com/en-us/azure/logic-apps/workflow-definition-language-functions-reference>
