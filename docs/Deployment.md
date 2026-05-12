# Deployment Guide

## Overview

This repository uses two complementary deployment mechanisms:

1. **Power Platform CLI (`pac`)** – for local development and manual deployments.
2. **GitHub Actions** – for automated CI/CD deployments triggered by pushes to `main`.

---

## Prerequisites

| Tool | Version | Install |
| --- | --- | --- |
| Power Platform CLI | ≥ 1.30 | `winget install Microsoft.PowerPlatformCLI` or [download](https://aka.ms/PowerPlatformCLI) |
| Git | any | [git-scm.com](https://git-scm.com) |

---

## Local Development with Power Platform CLI

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
  --zipfile downloads/CampanulaTasksFlow.zip \
  --folder  src/CampanulaTasksFlow \
  --packagetype Unmanaged
```

### 4. Pack the solution

```bash
mkdir -p out
pac solution pack \
  --zipfile     out/CampanulaTasksFlow.zip \
  --folder      src/CampanulaTasksFlow \
  --packagetype Unmanaged
```

### 5. Import the solution

```bash
pac solution import \
  --path        out/CampanulaTasksFlow.zip \
  --environment "$PP_ENVIRONMENT_URL" \
  --activate-plugins
```

### 6. Check solution status

```bash
pac solution list --environment "$PP_ENVIRONMENT_URL"
```

---

## GitHub Actions CI/CD

The workflow file `.github/workflows/deploy.yml` automates packing and importing the solution.

### Required GitHub Secrets

Go to **Settings → Secrets and variables → Actions** in this repository and add:

| Secret | Description |
| --- | --- |
| `PP_ENVIRONMENT_URL` | Power Platform environment URL, e.g. `https://org.crm4.dynamics.com/` |
| `PP_APP_ID` | Azure AD Application (client) ID of the service principal |
| `PP_CLIENT_SECRET` | Client secret of the service principal |
| `PP_TENANT_ID` | Azure AD tenant ID |

### Service Principal Setup

1. In **Azure Portal → App registrations**, create a new app registration (e.g. `PlannerTasksFromTemplate-CI`).
2. Create a **Client secret** and copy its value → `PP_CLIENT_SECRET`.
3. In **Power Platform Admin Center → Environments → [your env] → Settings → Users + permissions → Application users**, add the app registration and assign it the **System Administrator** or **System Customizer** role.

### Trigger

| Event | Action |
| --- | --- |
| Push to `main` | Automatic deploy to the configured Power Platform environment |
| `workflow_dispatch` | Manual trigger from the GitHub Actions UI |

---

## Solution Folder Structure

```text
src/CampanulaTasksFlow/
├── solution.xml            # Solution manifest (publisher, version)
├── [Content_Types].xml     # Package content types
└── Workflows/
    └── *.json              # Flow definitions (one file per Flow)
```

When editing a Flow in the Power Platform maker portal:

1. Export the solution as **Unmanaged**.
2. Unpack with `pac solution unpack` (see step 3 above).
3. Commit the updated files to a feature branch and open a pull request.

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

`docs\FormDefinition.md` is the source of truth for the Czech Microsoft Form used by colleagues. When changing form questions or choices:

1. Keep Czech user-facing labels understandable for form users.
2. Keep English Flow and Excel identifiers unchanged where automation references them, for example `concertName`, `templateType`, `concertDate`, `TemplateType`, and `DaysFromEvent`.
3. Keep `Typ šablony` choices aligned with `TasksTemplate[TemplateType]` values.
4. Keep `Místo konání` choices aligned with the Flow/template location-filtering logic.
5. Export and unpack the updated Flow if the form schema or mappings changed in Power Automate.

---

## Versioning

The solution version is maintained in `src/CampanulaTasksFlow/solution.xml` (`<Version>`).  
Increment the version number before every release following [Semantic Versioning](https://semver.org/):

- **Patch** (x.x.x+1) – bug fixes, description corrections, task additions/removals.
- **Minor** (x.x+1.0) – new buckets, labels, or significant task structure changes.
- **Major** (x+1.0.0) – breaking changes to the Flow logic or template structure.
