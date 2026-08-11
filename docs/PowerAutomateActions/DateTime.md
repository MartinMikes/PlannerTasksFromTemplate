# Date Time

Date and time handling in Power Automate is mostly expression-based. Flows
default to UTC, so explicit formatting and time-zone conversion matter.

## Most important actions and functions

| Action / function | Main use |
| --- | --- |
| `Convert time zone` | Convert a datetime value between source and destination time zones. |
| `formatDateTime()` | Format a timestamp for display or storage. |
| `utcNow()` | Get the current UTC timestamp. |
| `addDays()`, `addHours()`, `addMinutes()`, `addSeconds()` | Move a timestamp forward. |
| `subtractFromTime()` | Move a timestamp backward. |
| `convertTimeZone()`, `convertFromUtc()`, `convertToUtc()` | Explicit timezone conversion in expressions. |
| `parseDateTime()` | Parse a timestamp from text. |
| `dayOfWeek()`, `dayOfMonth()`, `dayOfYear()` | Extract date components. |
| `startOfDay()`, `startOfHour()`, `startOfMonth()` | Normalize a timestamp to a boundary. |
| `dateDifference()` / `ticks()` | Compare timestamps and calculate elapsed time. |

## Important notes

- `formatDateTime()` expects ISO 8601 input when you enter timestamps manually.
- `MM` means month and `mm` means minutes; mixing them is a common source of
  wrong output.
- Use UTC internally when possible, and convert only at system boundaries or
  for user-facing output.
- `Convert time zone` is the clearest option when the flow designer action is
  enough; use the expression functions when conversion must happen inline.

## Project relevance

This project uses date/time logic to calculate due dates relative to the concert
date and to normalize values before sending them into Planner and notifications.

## Source links

- <https://learn.microsoft.com/en-us/power-automate/date-time-values>
- <https://learn.microsoft.com/en-us/power-automate/convert-time-zone>
- <https://learn.microsoft.com/en-us/azure/logic-apps/workflow-definition-language-functions-reference>
