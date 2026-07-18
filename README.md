# PlannerTasksFromTemplate

Power Automate assets for creating a Microsoft Planner plan with predefined
concert-organization tasks from an Excel template. The repository is designed
for the mixed choir **Campanula**.

## Overview

Colleagues start the process from the Czech Microsoft Form documented in
[`docs\FormDefinition.md`](docs\FormDefinition.md). The first production Flow,
`CampanulaCreateConcertPlanFromTemplate`, is stored in the
`CampanulaPlannerFlows` solution. It maps those form answers to stable English
technical identifiers, reads task definitions from `PlannerTasksTemplate.xlsx`
in SharePoint, creates the Planner plan through a Microsoft Graph custom
connector, then creates buckets, tasks, assignments, checklists, and
notifications.

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
│   ├── Deployment.md
│   ├── References.md
│   └── PowerAutomateActions\
├── src\
│   └── CampanulaPlannerFlows\
│       ├── [Content_Types].xml
│       ├── Connectors\
│       ├── customizations.xml
│       ├── solution.xml
│       └── Workflows\
├── templates\
│   └── PlannerTasksTemplate.xlsx
├── .env.example
└── README.md
```

## Source folder

| Folder | Role |
| --- | --- |
| `src\CampanulaPlannerFlows` | Deployable unpacked Power Platform solution source packed by GitHub Actions as a managed solution. This solution can contain multiple flows later; currently it prepares the first Flow. |

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

Use [`docs\FormDefinition.md`](docs\FormDefinition.md) as the source of truth
for the Czech Microsoft Form used by colleagues. Its answers define the input
data that `CampanulaCreateConcertPlanFromTemplate` maps to the Flow and Excel
technical identifiers.

### 4. Prepare the production solution source

Build the `CampanulaCreateConcertPlanFromTemplate` Flow and its
`Campanula Planner Graph` custom connector in the `CampanulaPlannerFlows`
solution from
[`docs\Overview.md`](docs/Overview.md),
[`docs\FormDefinition.md`](docs/FormDefinition.md), and
[`docs\ExcelTemplate.md`](docs/ExcelTemplate.md). Keep the deployable unpacked
solution source in `src\CampanulaPlannerFlows`.

Create a solution zip from the production source folder contents and import it:

```bash
pac solution pack \
  --zipFile out/CampanulaPlannerFlows.zip \
  --folder src/CampanulaPlannerFlows \
  --packageType Managed

pac solution import \
  --path out/CampanulaPlannerFlows.zip \
  --environment "$PP_ENVIRONMENT_URL"
```

GitHub Actions uses the same managed package type when importing the solution
directly into production. If a push to `main` does not publish a semantic-release
release, use the workflow's manual **Run workflow** button for an ad hoc
production deploy.

The deployment workflow automatically injects the custom connector OAuth app ID
into the connector source before packing, so the placeholder value
`${MICROSOFT_ENTRA_APP_ID}` in
`src\CampanulaPlannerFlows\Connectors\campa_planner_graph_connectionparameters.json`
is replaced at deploy time with the value from the `PP_CONNECTOR_APP_ID`
GitHub Actions variable. Set `PP_CONNECTOR_APP_ID` to the application (client)
ID of the Entra app registration dedicated to the `Campanula Planner Graph`
connector. This registration is separate from `PP_APP_ID`, which is used by
the PAC CLI service principal.

After the first import, create or refresh the `Campanula Planner Graph`
connection in Power Platform. Ensure the Entra app registration used by the
connector has delegated Microsoft Graph permission `Tasks.ReadWrite`
configured, and grant consent in the appropriate place: permission setup and
any admin consent are performed on the app registration, while the Power
Platform connection creation/refresh flow performs the connection sign-in and
user consent for that configured app.

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
- [`docs\References.md`](docs/References.md) – Microsoft source links used for
  action and connector research
- [`docs\PowerAutomateActions\`](docs/PowerAutomateActions) – concise Power
  Automate action references grouped by area

## License

See [LICENSE](LICENSE).
