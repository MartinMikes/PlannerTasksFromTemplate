# PlannerTasksFromTemplate

Power Automate assets for creating a Microsoft Planner plan with predefined
concert-organization tasks from an Excel template. The repository is designed
for the mixed choir **Campanula**.

## Overview

Colleagues start the process from the Czech Microsoft Form documented in
[`docs/FormDefinition.md`](docs/FormDefinition.md). The production Flow
`CampanulaCreateConcertPlanFromTemplate` will map those form answers to stable
English technical identifiers, read task definitions from
`PlannerTasksTemplate.xlsx` in SharePoint, then create the Planner plan,
buckets, tasks, assignments, checklists, and notifications.

## Repository structure

```text
.
├── .github\
│   └── workflows\
│       └── deploy.yml
├── docs\
│   ├── Overview.md
│   ├── FormDefinition.md
│   ├── ExcelTemplate.md
│   └── Deployment.md
├── src\
│   ├── CampanulaCreateConcertPlanFromTemplate\
│   │   ├── [Content_Types].xml
│   │   ├── customizations.xml
│   │   ├── solution.xml
│   │   └── Workflows\
│   ├── CampanulaCreateConcertPlanFromTemplateSolution\
│   │   ├── customizations.xml
│   │   ├── solution.xml
│   │   └── Workflows\
│   ├── CampanulaCreateConcertPlanFromTemplateDemo\
│   │   ├── manifest.json
│   │   └── Microsoft.Flow\
│   └── CampanulaTasksFlow\
├── templates\
│   └── PlannerTasksTemplate.xlsx
├── .env.example
└── README.md
```

## Source folders

| Folder | Role |
| --- | --- |
| `src\CampanulaCreateConcertPlanFromTemplate` | Deployable unpacked Power Platform solution source packed by GitHub Actions. This solution can contain multiple flows later; currently it prepares the first Flow. |
| `src\CampanulaCreateConcertPlanFromTemplateSolution` | Exported and unpacked solution sample; use only as a solution folder/file structure reference. Do not copy or migrate its content into the production folder. |
| `src\CampanulaCreateConcertPlanFromTemplateDemo` | Older manually downloaded Flow package reference; useful only for package-format comparison, not for solution-based ALM. |
| `src\CampanulaTasksFlow` | Legacy Copilot-generated prototype from repository initialization; do not use it as an implementation source for the production Flow. |

## Input form

[`docs\FormDefinition.md`](docs\FormDefinition.md) is the source of truth for
the Czech Microsoft Form. Keep the form labels user-facing, and map them to the
English technical identifiers used by the Flow and Excel template.

| Czech form label | Technical concept | Purpose |
| --- | --- | --- |
| `Název koncertu` | `concertName` / `ConcertName` | Base Planner plan name. |
| `Typ šablony` | `templateType` / `TemplateType` | Selects generic concert-type task rows. |
| `Místo konání` | `location` / `TemplateType` | Selects location-specific task rows and plan naming. |
| `Datum koncertu` | `concertDate` / `ConcertDate` | Anchors `DaysFromEvent` due-date calculations. |

`Typ šablony` and `Místo konání` both filter the same Excel column,
`tbTasksTemplate[TemplateType]`. The Flow creates tasks from rows where
`TemplateType` equals the selected concert type (`Velký` or `Malý`) and from rows
where `TemplateType` equals the selected location (`Ignác`, `Jakub`, `Kříž`,
`Gotika`, or `Jinde`).

## Quick start

### Prerequisites

- [Power Platform CLI (`pac`)](https://learn.microsoft.com/power-platform/developer/cli/introduction)
- Power Platform Tools extension for VS Code
- Access to a Power Platform environment with Microsoft Forms, Excel Online,
  Planner, SharePoint, and notification connectors
- Microsoft 365 account with sufficient permissions

### 1. Configure environment

```bash
cp .env.example .env
# Edit .env with your environment values
```

### 2. Authenticate with Power Platform CLI

```bash
pac auth create \
  --environment "$PP_ENVIRONMENT_URL" \
  --applicationId "$PP_APP_ID" \
  --clientSecret "$PP_CLIENT_SECRET" \
  --tenant "$PP_TENANT_ID"
```

### 3. Review the Microsoft Form definition

Use [`docs\FormDefinition.md`](docs/FormDefinition.md) as the source of truth
for the Czech Microsoft Form used by colleagues. Its answers define the input
data that `CampanulaCreateConcertPlanFromTemplate` maps to the Flow and Excel
technical identifiers.

### 4. Prepare the production solution source

Build `CampanulaCreateConcertPlanFromTemplate` from
[`docs\Overview.md`](docs/Overview.md),
[`docs\FormDefinition.md`](docs/FormDefinition.md), and
[`docs\ExcelTemplate.md`](docs/ExcelTemplate.md). Keep the deployable unpacked
solution source in `src\CampanulaCreateConcertPlanFromTemplate`. Use
`src\CampanulaCreateConcertPlanFromTemplateSolution` only as a reference for the
unpacked solution folder structure.

Create a solution zip from the production source folder contents and import it:

```bash
mkdir -p out
(
  cd src/CampanulaCreateConcertPlanFromTemplate
  zip -r ../../out/CampanulaCreateConcertPlanFromTemplate.zip .
)

pac solution import \
  --path out/CampanulaCreateConcertPlanFromTemplate.zip \
  --environment "$PP_ENVIRONMENT_URL"
```

### 5. Upload the Excel template to SharePoint

Upload `templates\PlannerTasksTemplate.xlsx` to the SharePoint document library
configured in the Flow. The repository workbook is the source of truth; the
Flow reads the SharePoint copy at runtime.

## Excel template

The template `templates\PlannerTasksTemplate.xlsx` contains:

| Sheet | Table | Purpose |
| --- | --- | --- |
| `TasksTemplate` | `tbTasksTemplate` | Main task definitions. |
| `Groups` | `tbGroups` | Group names and assignee e-mail addresses. |
| `Buckets` | `tbBuckets` | Planner bucket names. |
| `Progress` | `tbProgress` | Progress values. |
| `Priority` | `tbPriority` | Priority values. |
| `Labels` | `tbLabels` | Label names and colors. |

See [`docs\ExcelTemplate.md`](docs/ExcelTemplate.md) for full column
descriptions.

## Documentation

- [`docs\Overview.md`](docs/Overview.md) – architecture and Flow behavior
- [`docs\FormDefinition.md`](docs/FormDefinition.md) – Czech Microsoft Form
  source definition
- [`docs\ExcelTemplate.md`](docs/ExcelTemplate.md) – Excel template reference
- [`docs\Deployment.md`](docs/Deployment.md) – package preparation and
  deployment guide

## License

See [LICENSE](LICENSE).
