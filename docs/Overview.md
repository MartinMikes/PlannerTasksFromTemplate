# Architecture Overview

## Purpose

This repository contains Power Automate Flows that automate the creation of Microsoft Planner plans and tasks for concerts of the mixed choir **Campanula**.  
Every concert requires a consistent and repeatable set of tasks (preparation, logistics, marketing, finances, …). Instead of creating them manually, a single trigger (e.g. a Microsoft Forms submission or a manual run) starts the Flow which reads the task definitions from an Excel template stored in SharePoint and builds the whole plan automatically.

## High-Level Architecture

```
┌─────────────────────┐
│  Trigger            │  Microsoft Forms / manual / scheduled
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Power Automate     │  CampanulaTasksFlow
│  Flow               │
└────────┬────────────┘
         │  reads task definitions
         ▼
┌─────────────────────┐
│  SharePoint         │  PlannerTasksTemplate.xlsx
│  Document Library   │  (copy of templates/PlannerTasksTemplate.xlsx)
└────────┬────────────┘
         │  creates plan + tasks
         ▼
┌─────────────────────┐
│  Microsoft Planner  │  New Plan per concert
│                     │  Buckets, Tasks, Assignments, Checklists
└─────────────────────┘
```

## Flow Description

The Flow performs the following steps:

1. **Receive trigger** – collects concert name and date.
2. **Create Planner Plan** – named after the concert (e.g. `Campanula – Vánoční koncert 2025`).
3. **Create Buckets** – iterates the `tbBuckets` table from the Excel template and creates each bucket in the new plan.
4. **Create Tasks** – for each row in `tbTasksTemplate`:
   - Calculates the **due date** from `DaysFromEvent` relative to the concert date.
   - Resolves **assignees** from `AssignedToEmails` (semicolon-separated list of e-mail addresses).
   - Sets **progress**, **priority**, **bucket** and **labels**.
   - Adds **checklist items** from the semicolon-separated `CheckListItems` value.
   - Sets **description** (rich text preserved as plain text with line breaks and bullet points).
5. **Notify** – sends a summary notification (Teams message or e-mail) to the organising team.

## Multiple Flow Variants

The `src/` folder may contain multiple Flow variants:

| Folder | Description |
|---|---|
| `CampanulaTasksFlow` | Main Flow – creates a full concert plan from the Excel template |

Additional variants (e.g. a lightweight version for small events) can be added as separate solution folders under `src/`.

## Data Flow

```
Excel Template (SharePoint copy)
  └── tbTasksTemplate   ──► Task rows
  └── tbBuckets         ──► Bucket names
  └── tbGroups          ──► Group → e-mail mapping
  └── tbProgress        ──► Allowed progress values
  └── tbPriority        ──► Allowed priority values
  └── tbLabels          ──► Allowed label values
```

The `AssignedToEmails` column is computed in Excel using a FILTER/TEXTJOIN formula referencing `tbGroups`, so changing group membership in the Excel automatically updates task assignments.

## Security Considerations

- The Flow uses **Connection References** – credentials are stored in Power Platform, not in the repository.
- The SharePoint library containing the Excel template should be restricted to authorised editors only.
- Service principal credentials for CI/CD are stored as **GitHub Secrets** (see [Deployment.md](Deployment.md)).
