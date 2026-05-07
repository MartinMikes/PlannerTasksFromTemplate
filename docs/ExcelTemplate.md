# Excel Template Reference

## File

`templates/PlannerTasksTemplate.xlsx`

> **Important:** The file in this repository is the **source of truth**.  
> The Flow reads from a **copy** of this file uploaded to a SharePoint document library.  
> Always update the repository version first, then upload the new version to SharePoint.

---

## Sheets

### TasksTemplate (main sheet)

Excel Table: **`tbTasksTemplate`**

| Column | Type | Description |
|---|---|---|
| `TemplateType` | Text | Type of template – used to filter tasks when a plan has multiple variants (e.g. `Concert`, `Rehearsal`). |
| `TaskId` | Integer | Unique task identifier within the template. |
| `TaskName` | Text | Name of the Planner task. |
| `GroupName` | Text | Name of the group responsible for the task. Must match a value in `tbGroups[GroupName]`. Validated by drop-down list. |
| `AssignedToEmails` | Formula | Computed automatically by Excel – semicolon-separated list of e-mail addresses from `tbGroups` for the selected `GroupName`. Do **not** edit manually. |
| `DaysFromEvent` | Integer | Number of days relative to the event date when the task is due. Negative = before the event (e.g. `-30`), positive = after (e.g. `7`), `0` = on the day of the event. |
| `Bucket` | Text | Planner bucket name. Must match a value in `tbBuckets[BucketName]`. Validated by drop-down list. |
| `Progress` | Text | Initial task progress. Must match a value in `tbProgress[ProgressName]`. Validated by drop-down list. |
| `Priority` | Text | Task priority. Must match a value in `tbPriority[PriorityName]`. Validated by drop-down list. |
| `Description` | Text | Detailed task description. Supports plain text with line breaks (`\n`), simple bullet points (prefix `-`), and hyperlinks (plain URL). |
| `CheckListItems` | Text | Semicolon-separated list of checklist item names. The Flow splits this value and creates individual checklist items on the task. |
| `Labels` | Text | Semicolon-separated list of label names. Must match values in `tbLabels[LabelName]`. The Flow assigns the corresponding Planner labels (colour tags). |

#### Example row

| TemplateType | TaskId | TaskName | GroupName | AssignedToEmails | DaysFromEvent | Bucket | Progress | Priority | Description | CheckListItems | Labels |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Concert | 1 | Potvrdit datum a místo koncertu | Organizační tým | _(formula)_ | -90 | Příprava a plánování | Not started | Urgent | Zajistit potvrzení termínu… | Odeslat poptávku;Podepsat smlouvu;Uhradit zálohu | Organizace;Logistika |

---

### Buckets

Excel Table: **`tbBuckets`**

| BucketName |
|---|
| Příprava a plánování |
| Umělci a program |
| Propagace a marketing |
| Produkce a logistika |
| Finance a administrativa |
| Den koncertu |
| Po koncertu |

---

### Progress

Excel Table: **`tbProgress`**

| ProgressName |
|---|
| Not started |
| In progress |
| Completed |

These values map directly to the Microsoft Planner `percentComplete` field:  
`Not started` = 0 %, `In progress` = 50 %, `Completed` = 100 %.

---

### Priority

Excel Table: **`tbPriority`**

| PriorityName |
|---|
| Low |
| Medium |
| Important |
| Urgent |

These values map to the Microsoft Planner `priority` field (0–10 scale):  
`Urgent` = 1, `Important` = 3, `Medium` = 5, `Low` = 9.

---

### Labels

Excel Table: **`tbLabels`**

| LabelName |
|---|
| Organizace |
| Umělci |
| Propagace |
| Logistika |
| Finance |
| Administrativa |
| Hudba |
| Provoz |
| IT |

Labels correspond to the colour-coded category tags in Microsoft Planner.  
The Flow maps label names to the `appliedCategories` field.

---

### Groups

Excel Table: **`tbGroups`**

| GroupName | MemberEmails |
|---|---|
| Dirigent | dirigent@campanula.cz |
| Organizační tým | organizace@campanula.cz |
| Propagační tým | propagace@campanula.cz |
| Produkční tým | produkce@campanula.cz |
| Finanční tým | finance@campanula.cz |
| Zpěváci – Soprán | sopran@campanula.cz |
| Zpěváci – Alt | alt@campanula.cz |
| Zpěváci – Tenor | tenor@campanula.cz |
| Zpěváci – Bas | bas@campanula.cz |
| IT správce | it@campanula.cz |

> Update `MemberEmails` with real Microsoft 365 e-mail addresses.  
> Multiple assignees per group can be entered as a semicolon-separated list in `MemberEmails`.

---

## Adding New Tasks

1. Open `templates/PlannerTasksTemplate.xlsx`.
2. In the **TasksTemplate** sheet, add a new row to the `tbTasksTemplate` table.
3. Fill in all columns. Select `GroupName`, `Bucket`, `Progress`, `Priority` from the drop-down lists.
4. The `AssignedToEmails` column is filled automatically by the Excel formula – do not edit it.
5. Save the file and upload it to the SharePoint library replacing the old version.

## Maintaining Lookup Lists

- To add a new bucket, open the **Buckets** sheet and add a row to the `tbBuckets` table.
- To add a new label, open the **Labels** sheet and add a row to the `tbLabels` table.
- To add a new group, open the **Groups** sheet and add a row to the `tbGroups` table with a valid e-mail address.

After updating lookup lists, update the Flow connector configuration if label mapping or bucket ordering has changed.
