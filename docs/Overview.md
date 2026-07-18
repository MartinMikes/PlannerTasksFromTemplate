# Architecture Overview

## Purpose

This repository contains Power Automate Flows that automate the creation of Microsoft Planner plans and tasks for concerts of the mixed choir **Campanula**.  
Every concert requires a consistent and repeatable set of tasks (preparation, logistics, marketing, finances, …). Instead of creating them manually, colleagues submit the Czech Microsoft Form described in [FormDefinition.md](FormDefinition.md). The Flow uses those answers, reads task definitions from an Excel template stored in SharePoint, and builds the whole plan automatically.

## High-Level Architecture

```text
┌─────────────────────┐
│  Microsoft Form     │  Campanula - koncertní úkoly z šablony
│  response           │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Power Automate     │  CampanulaCreateConcertPlanFromTemplate
│  Flow               │
└────────┬────────────┘
         │  creates plan through Graph connector,
         │  then reads task definitions filtered by input values
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

## Form input mapping

The form is Czech for non-English-speaking colleagues, while the workbook and Flow keep English technical identifiers for reliable Power Platform references.

| Czech form label | Technical name / concept | Used for |
| --- | --- | --- |
| `Název koncertu` | `ConcertName` / `concertName` | Base Planner plan name. |
| `Typ šablony` | `TemplateType` / `templateType` | Selects generic concert-type rows, currently `Velký` or `Malý`. |
| `Místo konání` | `TemplateType` / `location` | Selects location-specific rows and is appended to the Planner plan name in parentheses. |
| `Datum koncertu` | `ConcertDate` / `concertDate` | Event date used to calculate due dates from `DaysFromEvent`. |

If the exact concert date is not known yet, use the earliest considered date in `Datum koncertu` so preparation deadlines are not missed.

Both `Typ šablony` and `Místo konání` filter the same Excel column,
`tbTasksTemplate[TemplateType]`. The Flow includes rows where `TemplateType`
equals the selected concert type and rows where `TemplateType` equals the
selected location, then creates one Planner plan containing both task sets.

## Source folder role

`src\CampanulaPlannerFlows` is the deployable unpacked Power Platform solution
source. GitHub Actions packs and imports this folder as a managed solution. It
can contain multiple flows later; currently it contains the first Flow
implementation.

## Flow description

The Flow performs the following steps:

1. **Receive Microsoft Form response** – collects `Název koncertu`, `Typ šablony`, `Místo konání`, and `Datum koncertu`.
2. **Prepare and validate inputs** – maps Czech form answers to English technical fields and requires `Datum koncertu` to be later than today in Europe/Prague.
3. **Preflight the workbook** – verifies the required tables and columns, validates the complete bucket and label catalogs, and classifies every selected task row atomically. Processing continues only when at least one selected task is valid.
4. **Create Planner Plan** – uses the `Campanula Planner Graph` custom connector to call Microsoft Graph `POST /planner/plans`, naming the plan after the concert with `Místo konání` added in parentheses.
5. **Create Buckets and labels** – creates every populated bucket and configures every populated label from the Excel template, whether or not the selected tasks use it.
6. **Create Tasks** – for each valid row in `tbTasksTemplate` whose `TemplateType` matches the selected concert type or selected location:
   - Calculates the **due date** from `DaysFromEvent` relative to the concert date and preserves a result in the past without clamping or skipping the task.
   - Resolves **assignees** from `AssignedToEmails` (semicolon-separated list of e-mail addresses).
   - Sets **progress**, **priority**, **bucket** and **labels**.
   - Adds **checklist items** from the semicolon-separated `CheckListItems` value.
   - Sets **description** (rich text preserved as plain text with line breaks and bullet points).
7. **Notify** – sends one e-mail reporting clean success, completion with warnings (including every skipped task's `TaskId`, or `(missing)`, title, and reason), or generation failure. After a generation failure, the operator manually deletes any partial plan, corrects the cause, and submits a new Form response.

## Data Flow

```text
Microsoft Form response
  └── Název koncertu    ──► concertName / ConcertName
  └── Typ šablony       ──► templateType / TemplateType filter value
  └── Místo konání      ──► location / TemplateType filter value + plan-name suffix
  └── Datum koncertu    ──► concertDate / ConcertDate
          │
          ▼
Power Automate Flow
          │
          ▼
Excel Template (SharePoint copy)
  └── tbTasksTemplate   ──► Task rows
  └── tbBuckets         ──► Bucket names
  └── tbGroups          ──► Group → e-mail mapping
  └── tbProgress        ──► Allowed progress values
  └── tbPriority        ──► Allowed priority values
  └── tbLabels          ──► Allowed label values
```

The `AssignedToEmails` column is computed in Excel using a FILTER/TEXTJOIN
formula referencing `tbGroups`, so changing group membership in the Excel
automatically updates task assignments. Keep Excel sheet, table, and column
names in English because Flow expressions reference those identifiers directly.

## Security Considerations

- The Flow uses **Connection References** – credentials are stored in Power Platform, not in the repository.
- The custom `Campanula Planner Graph` connector needs delegated Microsoft Graph permission `Tasks.ReadWrite`.
- The SharePoint library containing the Excel template should be restricted to authorised editors only.
- Service principal credentials for CI/CD are stored as **GitHub Secrets** (see [Deployment.md](Deployment.md)).
