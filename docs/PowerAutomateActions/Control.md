# Control

Control actions decide **when**, **how often**, and **under which conditions**
other actions run.

## Most important control actions

| Action | Main use |
| --- | --- |
| `Condition` | Run different branches for true/false outcomes. |
| `Switch` | Branch across several known values instead of nesting many conditions. |
| `Apply to each` | Repeat actions for every item in an array. |
| `Do until` | Repeat until a condition becomes true. |
| `Scope` | Group related actions and make error handling easier. |
| `Terminate` | Stop the flow explicitly with a chosen status. |

## Important notes

- Microsoft Learn's walkthrough for this area focuses mainly on
  `Condition`, including complex conditions built with the **Add** button.
- Use expressions for advanced comparisons when a simple card comparison is not
  enough.
- If loop iterations update variables and the result must stay predictable, run
  the loop sequentially rather than in parallel.
- `Scope` is useful when you want later steps to react to success, failure, or
  skipped results from a grouped block.

## Project relevance

This project uses control actions to loop through Excel rows, branch on task
creation logic, and keep bucket/task creation steps readable.

## Source links

- <https://learn.microsoft.com/en-us/power-automate/add-condition>
- <https://learn.microsoft.com/en-us/power-automate/create-variable-store-values>
- <https://learn.microsoft.com/en-us/azure/logic-apps/workflow-definition-language-functions-reference>
