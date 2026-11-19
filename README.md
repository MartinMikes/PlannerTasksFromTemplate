# PlannerTasksFromTemplate

Power Automate assets for creating a Microsoft Planner plan with predefined
concert-organization tasks from an Excel template. The repository is designed
for the mixed choir **Campanula**.

## Overview

Colleagues start the process from the Czech Microsoft Form documented in
[Form definition](docs/FormDefinition.md). The first production Flow,
`CampanulaCreateConcertPlanFromTemplate`, is stored in the
`CampanulaPlannerFlows` solution. The `Campanula Planner Graph` custom
connector is maintained in the separate `CampanulaPlannerGraphConnector`
prerequisite solution. The Flow maps those form answers to stable English
technical identifiers, reads task definitions from `PlannerTasksTemplate.xlsx`
in SharePoint, creates the Planner plan through the connector, then creates
buckets, tasks, assignments, checklists, and notifications.

## Repository structure

```text
.
├── .github\
│   └── workflows\
│       ├── deploy-connector.yml
│       └── deploy.yml
├── docs\
│   ├── Overview.md
│   ├── FormDefinition.md
│   ├── ExcelTemplate.md
│   ├── Deployment.md
│   ├── DeploymentReference.md
│   ├── References.md
│   └── PowerAutomateActions\
├── src\
│   ├── CampanulaPlannerFlows\
│   │   ├── Other\
│   │   └── Workflows\
│   └── CampanulaPlannerGraphConnector\
│       ├── Connectors\
│       └── Other\
├── templates\
│   └── PlannerTasksTemplate.xlsx
├── .env.example
└── README.md
```

## Source folder

| Folder | Role |
| --- | --- |
| `src\CampanulaPlannerFlows` | Deployable unpacked Flow solution source. GitHub Actions packs it as the managed solution containing the Flow and its five connection references. |
| `src\CampanulaPlannerGraphConnector` | Deployable unpacked prerequisite solution source. It contains the solution-aware custom connector and must be imported before the Flow solution in a new environment. |

## Input form

[Form definition](docs/FormDefinition.md) is the source of truth for
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

## Quick start: deploy with GitHub Actions

### First deployment

1. Prepare the target Microsoft 365 group, [Microsoft Form](docs/FormDefinition.md),
   and SharePoint copy of the [Excel template](templates/PlannerTasksTemplate.xlsx).
   Neither solution creates these resources.
2. Set the [repository variables and secret](docs/Deployment.md#github-configuration)
   under **Settings → Secrets and variables → Actions**. The workflows do not
   read a local `.env`. `PP_APP_ID` identifies the Dataverse deployment app;
   `PP_CONNECTOR_APP_ID` identifies the separate Entra app for delegated Graph
   access. The workflow inserts the latter into a staged copy, not the tracked source.
3. In an empty environment, run **Actions → Bootstrap Graph Connector**. Then
   configure the installed connector's [OAuth settings](docs/Deployment.md#graph-connector-oauth-setup),
   including its own client secret. Create the Graph connection by signing in
   as a member of the Planner group with delegated `Tasks.ReadWrite` consent.
4. Verify all five target connections: **Microsoft Forms, Excel Online Business,
   Planner, Office 365 Outlook, and Campanula Planner Graph**. The deployment
   app must be able to use them. Put each connection's resource ID in its
   matching `PP_*_CONNECTION_ID` variable; do not use a connector or app ID.
5. Run **Actions → Deploy Power Platform Solution** with **Rebuild both managed
   solutions from current main** enabled. It imports the connector first, then
   `CampanulaPlannerFlows` with the five connections bound.

**A successful import does not mean the flow is on.** Check that **Activate
and Share Flow** also succeeds. It finds the flow by its stable solution
workflow ID in Dataverse, activates it, and verifies the configured user or
group team's direct record access (`CanView` or `CanEdit`). This does not grant
access to the underlying connections. See the [deployment guide](docs/Deployment.md)
for an end-to-end check with a test Form response.

### Redeployment and recovery

- **Clean uninstall:** preview the two managed solutions and optionally their
  dedicated Graph connection with the [cleanup workflow](.github/workflows/cleanup.yml).
  Follow the [cleanup checklist](docs/Deployment.md#clean-uninstall-before-reinstalling)
  before confirming deletion; do not remove the four standard connections.

- **Published release:** eligible pushes to `main` deploy only when
  semantic-release publishes a release. To redeploy the latest release
  manually, leave the rebuild option off. Turn it on when the fix is on
  `main` but not in the release, or when `PP_CONNECTOR_APP_ID` has changed.
- **Graph activation failure:** if `ConnectionAuthorizationFailed` names the
  Graph reference, compare the flow's API ID with the **installed connector's
  API ID**, not its OAuth redirect URI. If the bound connection reports
  `Error`, have its owner [repair or recreate it](docs/DeploymentReference.md#refresh-the-graph-connection).
  Update `PP_GRAPH_CONNECTION_ID` if the ID changed. Deploy the corrected
  package; retrying only the activation job leaves the old definition in place.
- **Manual PAC recovery:** follow the [staging and packaging instructions](docs/DeploymentReference.md#stage-and-pack-managed-solutions)
  rather than packing the connector directly from its tracked placeholder.

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
