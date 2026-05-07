# PlannerTasksFromTemplate

This repository is intended for Power Automate flows triggered by Microsoft Forms that create a new Microsoft Planner plan with a predefined set of tasks based on an Excel template.

## Purpose

The initial target use case is to generate a complete task set for each concert of the mixed choir Campanula and assign tasks to specific people.

## Planned repository content

- `src/` will contain several similar Power Automate flows.
- `docs/` will contain shared documentation for the repository and the flows.
- `templates/` will contain the Excel template files. In runtime, the flow is expected to use a copy of the Excel workbook stored in a SharePoint library.

The repository is also expected to support:

- Power Platform CLI usage
- GitHub Actions based deployment of flow updates

## Excel template

The solution is based on a single Excel workbook named `PlannerTasksTemplate.xlsx`.

### Main sheet

The main worksheet is `TasksTemplate`, containing the Excel table currently named `tbTasksTemplate` with these columns:

- `TemplateType`
- `TaskId`
- `TaskName`
- `GroupName`
- `AssignedToEmails` - generated automatically by an Excel formula as a semicolon-separated list of email addresses
- `DaysFromEvent` - negative or positive count of days from the concert date when the task should be completed
- `Bucket`
- `Progress`
- `Priority`
- `Description` - detailed task description stored as text with line breaks, simple bullet markers, and hyperlinks
- `CheckListItems` - semicolon-separated list of checklist values
- `Labels` - semicolon-separated list of label values

### Lookup sheets

The workbook also contains supporting lookup sheets used by `TasksTemplate`:

- `Groups`
- `Buckets`
- `Progress`
- `Priority`
- `Labels`

#### Buckets

- Příprava a plánování (Preparation and planning)
- Umělci a program (Artists and programme)
- Propagace a marketing (Promotion and marketing)
- Produkce a logistika (Production and logistics)
- Finance a administrativa (Finance and administration)
- Den koncertu (Concert day)
- Po koncertu (After the concert)

#### Progress

- Not started
- In progress
- Completed

#### Priority

- Low
- Medium
- Important
- Urgent

#### Labels

- Organizace (Organisation)
- Umělci (Artists)
- Propagace (Promotion)
- Logistika (Logistics)
- Finance (Finance)
- Administrativa (Administration)
- Hudba (Music)
- Provoz (Operations)
- IT (IT)
