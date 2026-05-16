# Deployment Guide

## Overview

`src\CampanulaPlannerFlows` is the production Power Platform solution source.
GitHub Actions packs this folder as a managed solution and imports it directly
into the production environment.

The docs, Microsoft Form definition, and Excel template are the source
specification for the first Flow,
`CampanulaCreateConcertPlanFromTemplate`, in the `CampanulaPlannerFlows`
solution.

---

## Prerequisites

| Tool | Version | Install |
| --- | --- | --- |
| Power Platform CLI | ≥ 1.30 | `winget install Microsoft.PowerPlatformCLI` or [download](https://aka.ms/PowerPlatformCLI) |
| Power Platform Tools for VS Code | latest | Install from the VS Code Extensions view. |
| Git | any | [git-scm.com](https://git-scm.com) |

---

## Current source folder

The `src\CampanulaPlannerFlows` folder is the production unpacked solution source. GitHub Actions packs and imports this folder as a managed solution. It can contain multiple Flow components later; currently it contains the first Flow.

Unpacked solution source structure:

```text
src\CampanulaPlannerFlows
├── [Content_Types].xml
├── Connectors\
├── customizations.xml
├── solution.xml
└── Workflows\
    └── <flow-name>.json
```

Power Platform CLI solution commands expect this unpacked solution source
structure.

---

## Build the first Flow in Power Platform

Recommended workflow for creating `CampanulaCreateConcertPlanFromTemplate` in
the `CampanulaPlannerFlows` solution:

1. Use [FormDefinition.md](FormDefinition.md) for Microsoft Form questions and
   answer choices.
2. Use [ExcelTemplate.md](ExcelTemplate.md) for the Excel table names, column
   names, and lookup values.
3. Use [Overview.md](Overview.md) for the intended end-to-end Flow behavior.
4. Build the Flow manually in Power Platform, wiring Microsoft Forms, Excel
   Online, the `Campanula Planner Graph` custom connector for plan creation,
   Planner for bucket and task actions, and notifications.
5. Add the Flow to the production solution source under
   `src\CampanulaPlannerFlows`.
6. Commit the updated solution files on a feature branch.

Keep the Czech form labels user-facing, but keep workbook and Flow identifiers
such as `TemplateType`, `DaysFromEvent`, `concertName`, and `templateType`
stable for automation.

---

## Local development with Power Platform CLI

### 1. Configure environment variables

```bash
cp .env.example .env
# Edit .env and fill in your values
```

### 2. Create an authentication profile

```bash
# Interactive login (browser)
pac auth create --name dev --environment "$PP_ENVIRONMENT_URL"

# Or using a service principal (recommended for automation)
pac auth create \
  --name ci \
  --environment   "$PP_ENVIRONMENT_URL" \
  --applicationId "$PP_APP_ID" \
  --clientSecret  "$PP_CLIENT_SECRET" \
  --tenant        "$PP_TENANT_ID"
```

### 3. Create the managed solution zip

```bash
mkdir -p out
(
  cd src/CampanulaPlannerFlows
  pac solution pack \
    --zipFile ../../out/CampanulaPlannerFlows.zip \
    --folder . \
    --packageType Managed
)
```

### 4. Import the solution

```bash
pac solution import \
  --path        out/CampanulaPlannerFlows.zip \
  --environment "$PP_ENVIRONMENT_URL" \
  --activate-plugins
```

### 5. Check solution status

```bash
pac solution list --environment "$PP_ENVIRONMENT_URL"
```

---

## VS Code Power Platform Tools workflow

The Power Platform Tools extension for VS Code can be used instead of running
every `pac` command manually:

1. Sign in to the target Power Platform environment from VS Code.
2. Use the extension commands to select the environment and authenticate.
3. Pack and import the solution when testing a branch.
4. Commit only source artifacts and documentation; do not commit local
   credentials or environment-specific secrets.

---

## GitHub Actions CI/CD

The workflow file `.github/workflows/deploy.yml` automates creating a solution
zip from the production solution source folder and importing it:

```text
src\CampanulaPlannerFlows
```

The solution may contain multiple Flow components later. The current scope is the
first Flow, `CampanulaCreateConcertPlanFromTemplate`.

The solution source now also includes the `Campanula Planner Graph` custom
connector under `src\CampanulaPlannerFlows\Connectors`.

### Required GitHub variables and secrets

Go to **Settings → Secrets and variables → Actions** in this repository and add:

| Name | Type | Description |
| --- | --- | --- |
| `PP_ENVIRONMENT_URL` | Variable | Power Platform environment URL, e.g. `https://org.crm4.dynamics.com/` |
| `PP_APP_ID` | Variable | Microsoft Entra ID application (client) ID of the service principal |
| `PP_TENANT_ID` | Variable | Microsoft Entra ID tenant ID |
| `PP_CLIENT_SECRET` | Secret | Client secret of the service principal |

### Service Principal Setup

1. In **Azure Portal → App registrations**, create a new app registration (e.g. `PlannerTasksFromTemplate-CI`).
2. Create a **Client secret** and copy its value → `PP_CLIENT_SECRET`.
3. In **Power Platform Admin Center → Environments → [your env] → Settings → Users + permissions → Application users**, add the app registration and assign it the **System Administrator** or **System Customizer** role.

### Trigger

| Event | Action |
| --- | --- |
| Push to `main` | Runs semantic-release. If a release is published, GitHub Actions updates the solution version, packs a **Managed** package, attaches it to the GitHub release, and imports it into production. |
| `workflow_dispatch` | Ad hoc production deploy. GitHub Actions packs the selected ref as a **Managed** package and imports it into production even when semantic-release does not publish a release. |

The workflow allows only one production deployment to run at a time.

### Ad hoc production deploy

Use the manual workflow when production needs the current solution source even
though the latest commit does not trigger a semantic-release release.

From GitHub:

1. Open **Actions**.
2. Select **Deploy Power Platform Solution**.
3. Click **Run workflow**.
4. Select the branch or tag to deploy, usually `main`.
5. Enter a short deployment reason and click **Run workflow**.

With GitHub CLI:

```bash
gh workflow run deploy.yml --ref main -f reason="Ad hoc production deploy"
```

Manual ad hoc deploys do not create a GitHub release or change the solution
version in source control. They use the version already present in
`src\CampanulaPlannerFlows\Other\Solution.xml`.

---

## Solution and package folder structure

Production solution source folder:

```text
src\CampanulaPlannerFlows
├── [Content_Types].xml
├── customizations.xml
├── Connectors\
│   ├── campa_planner_graph_apiDefinition.swagger.json
│   └── campa_planner_graph_connectionparameters.json
├── solution.xml
└── Workflows\
    └── CampanulaCreateConcertPlanFromTemplate.json
```

The production folder is zipped by GitHub Actions and imported with Power
Platform Tools. Resolve environment-specific form, Excel, Planner, and
notification values before running the Flow in a live environment.

After importing a version that contains the custom connector, open Power
Platform and create or refresh the `Campanula Planner Graph` connection so the
Flow can call Microsoft Graph with delegated `Tasks.ReadWrite`.

Managed production imports are solution-aware cloud flows. In the target
environment, expect to find them primarily under **Solutions**. A managed flow
imported this way might not appear under **My Flows** unless you are also its
owner or co-owner in that environment.

## SharePoint Template Update

After changing `templates/PlannerTasksTemplate.xlsx`:

1. Open the SharePoint document library configured in the Flow connection references.
2. Upload the new version of `PlannerTasksTemplate.xlsx`, replacing the existing file.
3. Verify the Flow runs correctly with the updated template.

> The Flow reads the **SharePoint copy** at runtime, not the file in this repository.  
> Keeping both in sync is the responsibility of the maintainer.

---

## Microsoft Form Update

`docs/FormDefinition.md` is the source of truth for the Czech Microsoft Form used by colleagues. When changing form questions or choices:

1. Keep Czech user-facing labels understandable for form users.
2. Keep English Flow and Excel identifiers unchanged where automation references them, for example `concertName`, `templateType`, `concertDate`, `TemplateType`, and `DaysFromEvent`.
3. Keep `Typ šablony` choices aligned with `tbTasksTemplate[TemplateType]`
   values used for generic concert-type task rows.
4. Keep `Místo konání` choices aligned with `tbTasksTemplate[TemplateType]`
   values used for location-specific task rows.
5. Export and unpack the updated Flow if the form schema or mappings changed in Power Automate.

---

## Versioning

For the `CampanulaPlannerFlows` solution, maintain the solution version in the
unpacked solution's `solution.xml` (`<Version>`).
Increment the version number before every release following
[Semantic Versioning](https://semver.org/):

- **Patch** (x.x.x+1) – bug fixes, description corrections, task additions/removals.
- **Minor** (x.x+1.0) – new buckets, labels, or significant task structure changes.
- **Major** (x+1.0.0) – breaking changes to the Flow logic or template structure.
