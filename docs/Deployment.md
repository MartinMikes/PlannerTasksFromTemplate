# Deployment Guide

## Overview

This repository distinguishes between the deployable production solution source
and supporting Power Platform artifacts:

1. **Production solution source** –
   `src\CampanulaPlannerFlows` is the unpacked solution source
   packed and imported by GitHub Actions.
2. **Exported solution structure reference** –
   `src\exported\CampanulaCreateConcertPlanFromTemplateSolution` is an exported
   and unpacked Power Platform solution sample. Use it only to understand the
   solution folder/file layout.
3. **Downloaded Flow package reference** –
   `src\exported\CampanulaCreateConcertPlanFromTemplateDemo` was manually built
   in Power Platform and downloaded as a package. It is no longer the preferred
   ALM structure reference.

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

## Current source folders

| Folder | Origin | Notes |
| --- | --- | --- |
| `src\CampanulaPlannerFlows` | Production unpacked solution source. | GitHub Actions packs and imports this folder. It can contain multiple Flow components later; currently it contains the first Flow. |
| `src\exported\CampanulaCreateConcertPlanFromTemplateSolution` | Exported and unpacked solution sample. | Use as a structure reference only; do not migrate its content into the production folder. |
| `src\exported\CampanulaCreateConcertPlanFromTemplateDemo` | Manually created in Power Platform and downloaded as a package. | Older package-format reference, not the solution-based ALM reference. |

Unpacked solution source structure:

```text
src\CampanulaPlannerFlows
├── [Content_Types].xml
├── customizations.xml
├── solution.xml
└── Workflows\
    └── <flow-name>.json
```

Use `src\exported\CampanulaCreateConcertPlanFromTemplateSolution` as a sample of
this structure. Power Platform CLI solution commands expect unpacked solution
source, not a downloaded Flow package export.

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
   Online, Planner, and notification actions.
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

### 3. Unpack an existing solution (to edit in source control)

```bash
pac solution unpack \
  --zipfile downloads/CampanulaPlannerFlows.zip \
  --folder  src/CampanulaPlannerFlows \
  --packagetype Unmanaged
```

### 4. Create the solution zip

```bash
mkdir -p out
(
  cd src/CampanulaPlannerFlows
  pac solution pack \
    --zipFile ../../out/CampanulaPlannerFlows.zip \
    --folder . \
    --packageType Unmanaged
)
```

### 5. Import the solution

```bash
pac solution import \
  --path        out/CampanulaPlannerFlows.zip \
  --environment "$PP_ENVIRONMENT_URL" \
  --activate-plugins
```

Use `--packageType Managed` only for a clean downstream environment. Microsoft
does not allow importing a managed solution into the same environment that still
contains the originating unmanaged solution.

### 6. Check solution status

```bash
pac solution list --environment "$PP_ENVIRONMENT_URL"
```

---

## VS Code Power Platform Tools workflow

The Power Platform Tools extension for VS Code can be used instead of running
every `pac` command manually:

1. Sign in to the target Power Platform environment from VS Code.
2. Use the extension commands to select the environment and authenticate.
3. Export or unpack the solution into a source folder when you need source
   control review.
4. Pack and import the solution back to the environment when testing a branch.
5. Commit only source artifacts and documentation; do not commit local
   credentials or environment-specific secrets.

Use `src\exported\CampanulaCreateConcertPlanFromTemplateSolution` as the
structure reference for unpacked solution files while building
`CampanulaPlannerFlows`. The older
`src\exported\CampanulaCreateConcertPlanFromTemplateDemo` folder is only a
downloaded Flow-package reference.

---

## GitHub Actions CI/CD

The workflow file `.github/workflows/deploy.yml` automates creating a solution
zip from the production solution source folder and importing it:

```text
src\CampanulaPlannerFlows
```

The solution may contain multiple Flow components later. The current scope is the
first Flow, `CampanulaCreateConcertPlanFromTemplate`.

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
| Push to `main` | Automatic deploy of an **Unmanaged** package to the configured Power Platform environment |
| `workflow_dispatch` | Manual trigger from the GitHub Actions UI, with a choice of **Managed** or **Unmanaged** package type |

### Managed vs unmanaged imports

The workflow now defaults the automatic `push` deployment to **Unmanaged**
because the configured target is currently a Power Platform default environment.
Use the manual `workflow_dispatch` trigger with
`solution_package_type=Managed` only when the target environment is a clean
downstream environment.

According to Microsoft ALM guidance in
[Solution concepts with Power Platform](https://learn.microsoft.com/en-us/power-platform/alm/solution-concepts-alm),
a managed solution cannot be imported into an environment that still contains
the originating unmanaged solution. If you see the error `The solution is
already installed on this system as an unmanaged solution`, first check whether
`CampanulaPlannerFlows` already exists as unmanaged:

```bash
pac solution list --environment "$PP_ENVIRONMENT_URL"
```

You can also check in the maker portal:

1. Open <https://make.powerapps.com/>.
2. Switch to the same environment used by `PP_ENVIRONMENT_URL`.
3. Open **Solutions** and search for `CampanulaPlannerFlows`.

To remove the unmanaged solution record, either delete it in **Solutions** or
run:

```bash
pac solution delete \
  --name CampanulaPlannerFlows \
  --environment "$PP_ENVIRONMENT_URL"
```

If you previously deleted the unmanaged solution and still do not see it, note
that deleting an unmanaged solution removes only the solution container; the
customizations remain in the Default Solution. The safest path for validating a
managed import is to use a fresh downstream environment instead of the original
development/default environment.

---

## Solution and package folder structure

Production solution source folder:

```text
src\CampanulaPlannerFlows
├── [Content_Types].xml
├── customizations.xml
├── solution.xml
└── Workflows\
    └── CampanulaCreateConcertPlanFromTemplate.json
```

The production folder is zipped by GitHub Actions and imported with Power
Platform Tools. Resolve environment-specific form, Excel, Planner, and
notification values before running the Flow in a live environment.

Exported solution structure sample:

```text
src\exported\CampanulaCreateConcertPlanFromTemplateSolution
├── [Content_Types].xml
├── customizations.xml
├── solution.xml
└── Workflows\
    └── <sample-flow>.json
```

Use this folder only as a structure reference. Do not copy or migrate its sample
workflow content into the production folder.

Manually downloaded Power Platform package folder:

```text
src\exported\CampanulaCreateConcertPlanFromTemplateDemo
├── manifest.json
└── Microsoft.Flow\
    └── flows\
        ├── manifest.json
        └── <flow-package-id>\
            ├── apisMap.json
            ├── connectionsMap.json
            └── definition.json
```

When editing a Flow in the Power Platform maker portal:

1. Export the solution as **Unmanaged**.
2. Unpack with `pac solution unpack` (see step 3 above).
3. Commit the updated files to a feature branch and open a pull request.

When exporting a Flow package directly from Power Automate, keep it as a
reference package unless you intentionally convert it into a solution-based ALM
workflow.

---

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
