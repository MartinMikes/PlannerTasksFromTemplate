# Excel Template Reference

## File

`templates\PlannerTasksTemplate.xlsx`

> **Important:** The file in this repository is the **source of truth**.  
> The Flow reads from a **copy** of this file uploaded to a SharePoint document library.  
> Always update the repository version first, then upload the new version to SharePoint.

This workbook is part of the functional specification for the
`CampanulaCreateConcertPlanFromTemplate` Flow in the `CampanulaPlannerFlows`
solution. Keep the English sheet, table, and column identifiers stable because
Power Platform expressions reference them directly.

---

## Workbook structure

| Sheet | Table | Purpose |
| --- | --- | --- |
| `Návod` | _(none)_ | Human-readable instructions for maintaining task templates. |
| `TasksTemplate` | `tbTasksTemplate` | Main task definitions filtered by `TemplateType`. |
| `Groups` | `tbGroups` | Responsibility group to assignee e-mail mapping. |
| `Buckets` | `tbBuckets` | Planner bucket names and their descriptions. |
| `Progress` | `tbProgress` | Allowed initial progress values. |
| `Priority` | `tbPriority` | Allowed Planner priority values. |
| `Labels` | `tbLabels` | Planner label/category mapping. |

---

## Návod

The `Návod` sheet contains the in-workbook maintenance guide. It explains that maintainers should:

- choose a `TemplateType` for each task template row, using either a concert type
  or a location value;
- fill a short, clear `TaskName`;
- select `GroupName`, which fills `AssignedToEmails` from `Groups`;
- set `DaysFromEvent` to the relative due-date offset;
- select a `Bucket`;
- write a very detailed `Description`, including links to internal web pages or documents when useful;
- add simple checklist items to `CheckListItems` separated by semicolons;
- add one or more labels separated by semicolons to `Labels` for filtering or grouping in Planner.

---

## TasksTemplate

Excel Table: **`tbTasksTemplate`**

Only populated rows with matching `TemplateType` values are read by the current
Flow. For the Microsoft Form workflow, the Flow matches both the selected
concert type and the selected location against the same `TemplateType` column.
Blank reserved rows should remain ignored by automation.

The Microsoft Form is Czech for end users, but this sheet keeps English technical column names for Flow compatibility. Use the mapping in [FormDefinition.md](FormDefinition.md) when connecting form answers to workbook filters:

| Czech form label | Workbook / Flow identifier | Notes |
| --- | --- | --- |
| `Název koncertu` | `ConcertName` / `concertName` | Used for the Planner plan name, not stored in `tbTasksTemplate`. |
| `Typ šablony` | `TemplateType` / `templateType` | Form choices are `Velký` and `Malý`; generic concert-type task rows should use these `TemplateType` values. |
| `Místo konání` | `TemplateType` / `location` | Form choices are `Ignác`, `Jakub`, `Kříž`, `Gotika`, and `Jinde`; location-specific task rows should use these `TemplateType` values. |
| `Datum koncertu` | `ConcertDate` / `concertDate` | Used with `DaysFromEvent` to calculate task due dates. |

| Column | Type | Description | Default |
| --- | --- | --- | --- |
| `TemplateType` | Text | Template variant used by the Flow filter. For concert planning from the Microsoft Form, use either concert-type values such as `Velký` or `Malý`, or location values such as `Ignác`, `Jakub`, `Kříž`, `Gotika`, or `Jinde`, while keeping the column name `TemplateType`. Fill this for every task that should be created for that variant. | _(required)_ |
| `TaskId` | Text | Stable template-task key used in validation warnings. Treat as text because current values use hierarchical IDs such as `4.3.1`; values must be unique and must not be recycled for another task. | _(required)_ |
| `TaskName` | Text | Name of the Planner task. Keep it unique enough to distinguish the task within a plan. | _(required)_ |
| `GroupName` | Text | Responsible group. Must match a value in `tbGroups[GroupName]`. | _(required)_ |
| `AssignedToEmails` | Formula/Text result | Semicolon-separated e-mail list filled from `tbGroups[AssignedToEmails]` for the selected `GroupName`. Do **not** edit manually unless intentionally overriding the lookup. | _(formula)_ |
| `DaysFromEvent` | Integer | Number of days relative to the event date when the task is due. Negative = before the event, positive = after the event, `0` = on the event date. | _(required)_ |
| `Bucket` | Text | Planner bucket name. Must match a value in `tbBuckets[Bucket]`. | _(required)_ |
| `Progress` | Text | Initial task progress. Allowed values are listed in `tbProgress[Progress]`. | _(blank)_ |
| `Priority` | Text | Planner task priority. Allowed values are listed in `tbPriority[Priority]`. | `Medium` |
| `Description` | Text | Detailed task description. Supports plain text, line breaks, and plain URLs. | _(optional)_ |
| `CheckListItems` | Text | Semicolon-separated checklist item names. The Flow splits this value into individual checklist entries. | _(blank)_ |
| `Labels` | Text | Semicolon-separated label names. Values should match `tbLabels[Name]`. | _(blank)_ |

### Current populated template types

| TemplateType | Example tasks |
| --- | --- |
| `Dotace` | `Žádost o dotaci/e`, `Vyúčtování dotace` |
| `Dramaturgický plán` | `Dramaturgie koncertů v příštím roce` |
| `Velký v kostele` | `KOBB - Komorní orchestr Bohumila Boudy`, `Zamluvit kostel`, `Smlouva o pronájmu kostela` |

For the Microsoft Form workflow, align task-row `TemplateType` values with either
the `Typ šablony` choices (`Velký`, `Malý`) or the `Místo konání` choices
(`Ignác`, `Jakub`, `Kříž`, `Gotika`, `Jinde`). The Flow creates tasks from both
matching sets: rows for the selected concert type and rows for the selected
location. Existing or administrative template types can remain as separate values
if they are triggered by a different Flow path.

### Example row

| TemplateType | TaskId | TaskName | GroupName | AssignedToEmails | DaysFromEvent | Bucket | Progress | Priority | Description | CheckListItems | Labels |
| --- | --- | --- | --- | --- | ---: | --- | --- | --- | --- | --- | --- |
| `Velký v kostele` | `5.2.1` | `Zamluvit kostel` | `Kostel` | _(formula)_ | `-60` | `Příprava a plánování` | _(blank)_ | `Medium` | _(optional detail)_ | _(blank)_ | `Logistika` |

### Data quality notes

- Rows intended for Flow creation should have `TemplateType`, `TaskId`, `TaskName`, `GroupName`, `DaysFromEvent`, `Bucket`, and `Priority` populated, and their responsibility group must resolve to at least one valid assignee.
- The production Flow filters with `TemplateType` equal to the selected concert type or selected location; rows with blank `TemplateType` are not selected.
- Keep Czech form choice values and English workbook identifiers distinct: form users see `Typ šablony`, but automation references `TemplateType`.
- `Datum koncertu` should use the earliest considered concert date when the final date is not known yet; this keeps `DaysFromEvent` deadlines early enough.
- A calculated due date may be in the past when preparation should already have started; the Flow preserves that date and still creates the valid task.
- `TaskId` identifies a skipped task in warning e-mails independently of its mutable row position and title; it is not a persisted Planner-object identity.
- `Progress`, `AssignedToEmails`, and `Labels` are documented in the workbook, but the checked-in Flow currently creates tasks using bucket, title, due date, priority, description, and checklist data.

---

## Groups

Excel Table: **`tbGroups`**

| Column | Description |
| --- | --- |
| `GroupName` | Group name used from `tbTasksTemplate[GroupName]`. |
| `AssignedToEmails` | Semicolon-separated Microsoft 365 e-mail addresses for the group. |

Current groups:

| GroupName | AssignedToEmails |
| --- | --- |
| `Předseda` | `predseda@campanulajihlava.cz; pavla.krajickova@campanulajihlava.cz` |
| `Místopředseda` | `martina.kolarova@campanulajihlava.cz` |
| `Sbormistr` | `pavel.jirak@campanulajihlava.cz` |
| `Finance` | `finance@campanulajihlava.cz; andrea.krontoradova@campanulajihlava.cz; jolana.volakova@campanulajihlava.cz` |
| `Doprava` | `jiri.zajic@campanulajihlava.cz` |
| `Dotace` | `jolana.volakova@campanulajihlava.cz` |
| `Grafika-Podklady` | `pavel.jirak@campanulajihlava.cz` |
| `Grafika-Odeslání` | `katka.ruschkova@campanulajihlava.cz` |
| `Tisk` | _(blank)_ |
| `Kostel` | `hana.molvova@campanulajihlava.cz` |
| `Plakáty-Vyzvednutí` | `jolana.volakova@campanulajihlava.cz` |
| `Výlep-Předání` | `jolana.volakova@campanulajihlava.cz` |
| `Výlep-Objednávka` | _(blank)_ |
| `Výlep-Třešť` | `martin.mikes@campanulajihlava.cz` |
| `Výlep-Polná` | `vaclav.vacek@campanulajihlava.cz` |
| `Výlep-Jihlavsko` | `martin.mikes@campanulajihlava.cz; jiri.zajic@campanulajihlava.cz; nada.jozifkova@campanulajihlava.cz` |

Use semicolons to separate multiple assignees. Every selected task must resolve to at least one valid assignee; a task that references a blank mapping is skipped and reported as an invalid template task.

---

## Buckets

Excel Table: **`tbBuckets`**

| Bucket | Description |
| --- | --- |
| `Příprava a plánování` | První kroky, rezervace, smlouvy, oslovení sólistů |
| `Umělci a program` | Sólisté, orchestr, dramaturgie |
| `Propagace a marketing` | Plakáty, grafika, pozvánky, sociální sítě |
| `Produkce a logistika` | Doprava, technika, nástroje, pódium |
| `Finance a administrativa` | Faktury, vyúčtování dotací, smlouvy, vstupenky |
| `Den koncertu` | Harmonogram, příprava sálu, zvukovka |
| `Po koncertu` | Vyúčtování, poděkování, archivace |

> **Compatibility note:** The workbook table column is currently `Bucket`. The checked-in Flow JSON still references `BucketName` when creating Planner buckets, so update the Flow schema/reference when deploying this workbook version.

---

## Progress

Excel Table: **`tbProgress`**

| Progress |
| --- |
| `Not started` |
| `In progress` |
| `Completed` |

These values correspond to Planner completion states: `Not started` = 0 %, `In progress` = 50 %, `Completed` = 100 %.

---

## Priority

Excel Table: **`tbPriority`**

| Priority |
| --- |
| `Low` |
| `Medium` |
| `Important` |
| `Urgent` |

The checked-in Flow maps these values to the Microsoft Planner `priority` field: `Urgent` = 1, `Important` = 3, `Medium` = 5, `Low` = 9.

---

## Labels

Excel Table: **`tbLabels`**

| Label | Name | Color | Usage |
| --- | --- | --- | --- |
| `Label1` | `Organizace` | `Pink` | |
| `Label2` | `Umělci` | `Red` | |
| `Label3` | `Propagace` | `Yellow` | |
| `Label4` | `Logistika` | `Green` | |
| `Label5` | `Finance` | `Blue` | |
| `Label6` | `Administrativa` | `Purple` | |
| `Label7` | `Hudba` | `Bronze` | |
| `Label8` | `Provoz` | `Lime` | |
| `Label9` | `IT` | `Aqua` | |

Use values from the `Name` column in `tbTasksTemplate[Labels]`. Separate multiple labels with semicolons, for example `Finance;Administrativa`.

The table also reserves additional Planner colors without assigned label names. Add a `Label` and `Name` before using those colors in task rows.

---

## Adding new tasks

1. Open `templates\PlannerTasksTemplate.xlsx`.
2. In the **TasksTemplate** sheet, add a row to the `tbTasksTemplate` table.
3. Fill `TemplateType`, `TaskId`, `TaskName`, `GroupName`, `DaysFromEvent`, `Bucket`, and `Priority`.
   Use a concert type for generic tasks (`Velký` or `Malý`) or a location for
   venue-specific tasks (`Ignác`, `Jakub`, `Kříž`, `Gotika`, or `Jinde`).
4. Select lookup-backed values from the workbook lists where possible.
5. Let `AssignedToEmails` fill from the `GroupName` lookup.
6. Add detailed `Description`, optional `CheckListItems`, and optional `Labels`.
7. Save the file and upload it to the SharePoint library, replacing the old copy used by the Flow.

## Maintaining lookup lists

- To add a bucket, open **Buckets** and add a row to `tbBuckets`.
- To add or change assignees, open **Groups** and update `tbGroups[AssignedToEmails]`.
- To add a label, open **Labels**, assign a `Label` slot, and fill `Name` and `Color`.
- To change allowed progress or priority values, update **Progress** or **Priority** and update the Flow mapping if those values are used by automation.

After changing lookup column names, label mapping, priority mapping, bucket ordering, or `TemplateType` values, refresh the Flow connector schema and update any expressions that reference those columns or form choices. Do not rename English sheet, table, or column names just because the Microsoft Form labels are Czech.
