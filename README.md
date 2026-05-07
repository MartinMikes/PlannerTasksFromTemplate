# PlannerTasksFromTemplate

Power Automate Flows to create a new Microsoft Planner Plan with a predefined set of tasks taken from an Excel template.  
Designed for the mixed choir **Campanula** to generate and assign tasks for every concert.

## Overview

Each time a new concert is planned, a Power Automate Flow is triggered (e.g. from Microsoft Forms or manually).  
The flow reads task definitions from `PlannerTasksTemplate.xlsx` stored in a SharePoint document library, creates a new Planner Plan, adds all buckets, tasks, assignments and checklists automatically.

## Repository Structure

```
.
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions – CI/CD for Power Platform solution
├── docs/
│   ├── Overview.md             # Architecture and flow description
│   ├── ExcelTemplate.md        # Excel template structure documentation
│   └── Deployment.md           # Deployment guide (pac CLI + GitHub Actions)
├── src/
│   └── CampanulaTasksFlow/     # Power Platform solution (unmanaged, pac-unpacked)
│       ├── solution.xml
│       ├── [Content_Types].xml
│       └── Workflows/          # Flow definitions (JSON)
├── templates/
│   └── PlannerTasksTemplate.xlsx  # Excel task template (source of truth)
├── .env.example                # Environment variables template for pac CLI
└── README.md
```

## Quick Start

### Prerequisites

- [Power Platform CLI (`pac`)](https://learn.microsoft.com/power-platform/developer/cli/introduction)
- Access to a Power Platform environment with Microsoft Planner and SharePoint connectors
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

### 3. Pack and import the solution

```bash
pac solution pack \
  --zipfile out/CampanulaTasksFlow.zip \
  --folder src/CampanulaTasksFlow \
  --packagetype Unmanaged

pac solution import \
  --path out/CampanulaTasksFlow.zip \
  --environment "$PP_ENVIRONMENT_URL"
```

### 4. Upload the Excel template to SharePoint

Upload `templates/PlannerTasksTemplate.xlsx` to your SharePoint document library.  
Update the SharePoint site URL and library path in the Flow connection references.

## Excel Template

The template `templates/PlannerTasksTemplate.xlsx` contains:

| Sheet | Table | Purpose |
|---|---|---|
| TasksTemplate | tbTasksTemplate | Main task definitions |
| Buckets | tbBuckets | Bucket names |
| Progress | tbProgress | Progress values |
| Priority | tbPriority | Priority values |
| Labels | tbLabels | Label names |
| Groups | tbGroups | Group names and member e-mails |

See [docs/ExcelTemplate.md](docs/ExcelTemplate.md) for full column descriptions.

## Deployment

See [docs/Deployment.md](docs/Deployment.md) for the full CI/CD pipeline description using **GitHub Actions** and **Power Platform CLI**.

## Documentation

- [docs/Overview.md](docs/Overview.md) – Architecture overview
- [docs/ExcelTemplate.md](docs/ExcelTemplate.md) – Excel template reference
- [docs/Deployment.md](docs/Deployment.md) – Deployment guide

## License

See [LICENSE](LICENSE).
