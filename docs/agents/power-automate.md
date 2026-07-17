# Power Automate conventions

## Reference POC

`archive/unpack/ExcelFlowTest02_20260515223533/` contains a manually created, working Flow export from the production environment targeted by this repository. Treat the entire `archive/` tree as read-only reference material.

The POC demonstrates basic platform and connector behavior but is not a complete production contract. Reuse verified environment-specific shapes and patterns where helpful; do not assume every POC behavior or field is a requirement.

## Action and variable names

- Prefer authored action and variable names containing ASCII characters only.
- Prefer PascalCase without spaces, hyphens, underscores, or diacritics wherever Power Automate permits it.
- Preserve platform-required or generated identifiers when renaming would make the exported Flow invalid or create needless source churn.
- The POC variables `ConcertName`, `ConcertDate`, `TemplateType`, `ConcertLocation`, and `PlanId` illustrate the preferred variable style.
