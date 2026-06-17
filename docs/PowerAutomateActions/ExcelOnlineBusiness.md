# Excel Online (Business)

The Excel Online (Business) connector works with Excel files stored in
OneDrive for Business, SharePoint, and Microsoft 365 Groups through Microsoft
Graph-backed document libraries.

## Most important actions

| Action | Main use |
| --- | --- |
| `List rows present in a table` | Read table rows, optionally with filter, sort, select, skip, and top options. |
| `Get a row` | Read one row by key column and key value. |
| `Add a row into a table` | Insert one row. |
| `Update a row` | Update one row by key column and key value. |
| `Delete a row` | Delete one row by key column and key value. |
| `Add a key column to a table` | Add a lookup-friendly key column to an existing table. |
| `Get tables` / `Get worksheets` | Discover workbook structure. |
| `Create table` / `Create worksheet` | Prepare workbook structure. |
| `Run script` / `Run script from SharePoint library` | Execute Office Scripts against a workbook. |
| `For a selected row` | Trigger a flow from a selected Excel table row. |

## Important limitations and notes

- The connector supports Excel files up to **25 MB**.
- A workbook can stay locked for update/delete for up to **6 minutes** after the
  last connector use.
- Avoid concurrent edits from Excel desktop/web and other connectors against the
  same workbook.
- `List rows present in a table` returns **256 rows by default**; enable
  pagination for more.
- Filtering and sorting in `List rows present in a table` are limited: only one
  filter function on one column, and one sort column.
- `List rows present in a table` returns only the first **500 columns** by
  default unless you use `Select Query`.
- Key column matching is case-sensitive.
- Update/delete actions affect only the **first** matching row.
- Write operations can take effect with delay; Microsoft documents delays of up
  to **30 seconds**.
- `Run script` is limited to **3 calls per 10 seconds** and **1600 calls per
  day**.

## Project relevance

This connector is central to this repository. The flow reads the SharePoint copy
of `PlannerTasksTemplate.xlsx`, especially `tbTasksTemplate` and `tbBuckets`,
before creating Planner work items.

## Source links

- <https://learn.microsoft.com/en-us/connectors/excelonlinebusiness/>
