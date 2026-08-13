# Deployment Guide

## Overview

The repository ships two production Power Platform solutions. The
`CampanulaPlannerGraphConnector` solution installs the custom connector as a
prerequisite. The `CampanulaPlannerFlows` solution contains the Flow and its
connection references. GitHub Actions packs both folders as managed solutions
and imports them in that order.

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

The `src\CampanulaPlannerGraphConnector` folder is the production unpacked
source for the prerequisite custom connector. The
`src\CampanulaPlannerFlows` folder contains the first Flow and its connection
references. The Flow solution intentionally does not own the connector root
component; this lets the connector be installed before a delegated connection
is created.

Unpacked solution source structure:

```text
src\CampanulaPlannerGraphConnector
├── Connectors\
└── Other\
   ├── Customizations.xml
   └── Solution.xml

src\CampanulaPlannerFlows
├── [Content_Types].xml
├── customizations.xml
├── Other\
│   ├── Customizations.xml
│   └── Solution.xml
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

### 3. Inject connector app ID and create the managed solution zips

The connector source contains the placeholder `${MICROSOFT_ENTRA_APP_ID}`.
Replace it in a temporary pack folder before packing, using the connector app
registration ID from `.env`. Keep the connector and Flow packages separate:

```bash
: "${PP_CONNECTOR_APP_ID:?PP_CONNECTOR_APP_ID is required}"
mkdir -p out
rm -rf out/CampanulaPlannerGraphConnector out/CampanulaPlannerFlows
cp -R src/CampanulaPlannerGraphConnector out/CampanulaPlannerGraphConnector
cp -R src/CampanulaPlannerFlows out/CampanulaPlannerFlows

# macOS (BSD sed): use `sed -i '' ...` or install GNU sed (`brew install gnu-sed`) and use `gsed -i ...`.
sed -i "s|\${MICROSOFT_ENTRA_APP_ID}|${PP_CONNECTOR_APP_ID}|g" \
   out/CampanulaPlannerGraphConnector/Connectors/campa_planner_graph_connectionparameters.json

pac solution pack \
   --zipFile out/CampanulaPlannerGraphConnector.zip \
   --folder out/CampanulaPlannerGraphConnector \
   --packageType Managed
pac solution pack \
  --zipFile out/CampanulaPlannerFlows.zip \
  --folder out/CampanulaPlannerFlows \
  --packageType Managed
```

> Keep `${MICROSOFT_ENTRA_APP_ID}` in the tracked source file. Substitute only
> in the temporary pack folder so the checked-in connector contract stays
> environment-neutral.

### 4. Import the solution

```bash
pac solution import \
   --path        out/CampanulaPlannerGraphConnector.zip \
   --environment "$PP_ENVIRONMENT_URL"
pac solution import \
  --path        out/CampanulaPlannerFlows.zip \
  --environment "$PP_ENVIRONMENT_URL" \
  --activate-plugins
```

### 5. Check solution status

```bash
pac solution list --environment "$PP_ENVIRONMENT_URL"
```

### 6. Create or refresh the connector connection

The connector solution must be imported before the Flow solution can bind its
Graph connection reference. After importing the connector for the first time
or after any auth change:

1. Open Power Platform and navigate to the `CampanulaPlannerGraphConnector`
   solution or the environment's **Custom connectors** list.
2. Create a connection using the `Campanula Planner Graph` connector.
3. Sign in with an account that is a member of the Microsoft 365 group used
   for Planner plan creation and grant the requested delegated Graph consent.
4. Test the connection and confirm it is healthy.
5. If the deployment service principal is not the connection owner, share the
   connection with its Power Platform application user and grant **Can use**.
6. Open the `CampanulaPlannerFlows` solution and verify that
   `Campanula Planner Graph - CampanulaCreateConcertPlanFromTemplate` points to
   the healthy connection reference.
7. Copy the connection resource ID from the connection details URL and save it
   as `PP_GRAPH_CONNECTION_ID` in GitHub Actions repository variables. This is
   the connection resource ID, not the connector ID, app ID, or connection
   reference logical name.

### 7. Validate with a temporary test plan

1. Submit a test response from the Microsoft Form with a plan title clearly marked as temporary (e.g. `[TEST DELETE] <ConcertName>`).
2. Verify:
   - The Planner plan is created in the expected group.
   - Buckets are created in the new plan.
   - Tasks reference the new plan ID and contain correct assignees, due dates, and checklists.
   - The notification reports the expected task count.
3. Delete the temporary test plan manually from Microsoft Planner after successful validation.

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

The workflow file `.github/workflows/deploy.yml` stages and packs two managed
solution assets:

```text
src\CampanulaPlannerGraphConnector
src\CampanulaPlannerFlows
```

It attaches both zips to a release, imports the connector prerequisite first,
then maps the five existing connection resources and imports the Flow solution.
The separate `.github/workflows/deploy-connector.yml` workflow is a manual
bootstrap path for an environment that does not yet have the custom connector.
It installs only `CampanulaPlannerGraphConnector` and does not require
`PP_GRAPH_CONNECTION_ID`.

Both workflows inject the connector OAuth app ID before packing into a temporary
staging copy. If `PP_CONNECTOR_APP_ID` is not set as a GitHub Actions variable,
the workflow fails before packing starts. The placeholder
`${MICROSOFT_ENTRA_APP_ID}` in
`src\CampanulaPlannerGraphConnector\Connectors\campa_planner_graph_connectionparameters.json`
must never be replaced manually in source control; only a deployment workflow
may replace it at pack time.

### First-time target setup

Complete these steps once per target Power Platform environment:

1. Add the deployment and connector app settings listed below.
2. Run **Actions → Bootstrap Graph Connector → Run workflow** and provide a
   short reason. This workflow does not need a Graph connection ID because it
   only installs the connector definition.
3. In the target environment, create and authenticate the delegated
   `Campanula Planner Graph` connection as described in the local setup above.
4. Test the connection, then copy its connection resource ID into the
   `PP_GRAPH_CONNECTION_ID` repository variable.
5. Publish a release or run **Actions → Deploy Power Platform Solution → Run
   workflow** to import the Flow solution with all five connection mappings.

The normal deployment workflow also includes the connector package in every new
release, so subsequent releases keep the prerequisite solution updated before
the Flow import.

### Required GitHub variables and secrets

Go to **Settings → Secrets and variables → Actions** in this repository and add:

| Name | Type | Description |
| --- | --- | --- |
| `PP_ENVIRONMENT_URL` | Variable | Power Platform environment URL, e.g. `https://org.crm4.dynamics.com/` |
| `PP_APP_ID` | Variable | Microsoft Entra ID application (client) ID of the deployment service principal |
| `PP_TENANT_ID` | Variable | Microsoft Entra ID tenant ID |
| `PP_CLIENT_SECRET` | Secret | Client secret of the deployment service principal |
| `PP_CONNECTOR_APP_ID` | Variable | Application (client) ID of the Entra app registration for the `Campanula Planner Graph` custom connector OAuth (separate from the deployment service principal; requires delegated `Tasks.ReadWrite` on Microsoft Graph) |
| `PP_FORMS_CONNECTION_ID` | Variable | ID of the existing Microsoft Forms connection in the target environment |
| `PP_EXCEL_CONNECTION_ID` | Variable | ID of the existing Excel Online Business connection in the target environment |
| `PP_PLANNER_CONNECTION_ID` | Variable | ID of the existing Planner connection in the target environment |
| `PP_GRAPH_CONNECTION_ID` | Variable | ID of the existing authenticated `Campanula Planner Graph` connection in the target environment; required by `deploy.yml`, not by `deploy-connector.yml` |
| `PP_OUTLOOK_CONNECTION_ID` | Variable | ID of the existing Office 365 Outlook connection in the target environment |

The five connection IDs are connection resource IDs, not connection-reference
logical names, connector IDs, or Entra application IDs. They can be read from
the target connection URL in Power Apps. The connections must already exist and
be usable by the connection-reference owner; `deploy.yml` maps them during
import but does not create delegated OAuth connections or grant consent on a
user's behalf.

### Obtain `PP_GRAPH_CONNECTION_ID`

`PP_GRAPH_CONNECTION_ID` is the ID of a **connection resource** in the target
Power Platform environment. It is created after the `Campanula Planner Graph`
custom connector has been installed and a user has completed its delegated
Microsoft Graph sign-in. Follow this sequence before running `deploy.yml`:

1. Confirm the target environment. Open the environment whose URL is stored in
   `PP_ENVIRONMENT_URL`; do not create the connection in a development or
   default environment by mistake.
2. If `Campanula Planner Graph` is not available, run **Actions → Bootstrap
   Graph Connector** first. That workflow installs the prerequisite connector
   and deliberately does not require `PP_GRAPH_CONNECTION_ID`.
3. In [Power Apps](https://make.powerapps.com), select the same target
   environment, open **Connections**, and choose **New connection**. Search for
   `Campanula Planner Graph` and create it.
4. Complete the Microsoft sign-in and delegated consent using the account that
   will own the connection. The account must be able to create Planner plans in
   the target Microsoft 365 group. Test the connection and confirm it is
   connected or healthy.
5. If the deployment service principal is not the connection owner, share the
   connection with its Power Platform application user and grant **Can use**.
   Otherwise the solution import can map the ID but the Flow may not be able to
   use the connection.
6. Open the connection's **Details** page. Copy the GUID shown as **Connection
   ID**, or copy the GUID segment from the browser URL. It commonly appears in
   a URL shaped like:

   ```text
   https://make.powerapps.com/environments/<environment-id>/connections/<connection-id>/details
   ```

   Copy only `<connection-id>`, for example
   `01234567-89ab-cdef-0123-456789abcdef`. Do not copy the whole URL or the
   `<environment-id>` segment.
7. In this repository, open **Settings → Secrets and variables → Actions →
   Variables**, create or edit the repository variable named exactly
   `PP_GRAPH_CONNECTION_ID`, and paste only that connection GUID as its value.
   It is an Actions variable, not `PP_CONNECTOR_APP_ID`, `PP_APP_ID`, or a
   GitHub secret. The workflow reads `${{ vars.PP_GRAPH_CONNECTION_ID }}`; it
   does not read the local `.env` file.
8. Run **Actions → Deploy Power Platform Solution**. The validation step should
   accept the value and the deployment-settings file should map it to
   `campa_sharedcampanulaplannergraph_createconcertplan`.

The following values are different and must not be used for
`PP_GRAPH_CONNECTION_ID`:

| Value | Why it is wrong |
| --- | --- |
| `PP_CONNECTOR_APP_ID` | Entra client ID used to configure connector OAuth; it identifies an app, not a Power Platform connection. |
| `aa5c469a-b5dd-4963-917c-66bf35639bb3` | Custom connector component ID stored in the solution metadata. |
| `campa_sharedcampanulaplannergraph_createconcertplan` | Flow connection-reference logical name. |
| `<environment-id>` | Power Platform environment ID, not the connection resource ID. |
| `ToDo`, a blank value, or the full URL | Placeholder or wrong format; the workflow rejects it before release/import. |

If the connection is deleted or recreated, repeat steps 6 and 7. A recreated
connection receives a new resource ID even when it uses the same connector and
the same delegated account.

The deploy workflow now rejects placeholder values such as `ToDo` and any
non-GUID connection or app IDs before `semantic-release` publishes a release.
If deployment fails at configuration validation, replace the GitHub Actions
variable with the real target-environment ID and re-run the workflow.

### Repair an existing imported version

If the target environment already contains `CampanulaPlannerFlows` version
`1.3.2` with the Flow turned off, do not use **Redeploy the last published
release** as the repair. That workflow intentionally reuses the exact package
attached to the latest release, so importing the same `1.3.2` asset does not
add the active Flow metadata or the connection-reference mappings introduced
after that release.

To repair the environment:

1. Create and authenticate the five target connections listed above. The
   `Campanula Planner Graph` connection requires delegated Graph consent and a
   connection owner who can create Planner plans in the target group.
2. Store each connection resource ID in the corresponding GitHub Actions
   variable.
3. Publish a new patch release, such as `1.3.3`, containing the active Flow
   metadata and deployment-settings changes.
4. Let the push deployment import that new managed package, or run the manual
   workflow only after the new release is published.
5. In the target environment, open the `CampanulaPlannerFlows` solution and
   verify that the Flow is enabled and all five connection references are
   healthy before submitting a real Form response.

The deployment service principal can perform the package import and bind
existing connections. It cannot replace the one-time delegated OAuth sign-in
or user consent required by the custom connector connection.

### Service Principal Setup

There are two separate Entra app registrations for this project.

#### Deployment service principal (`PP_APP_ID`)

1. In **Azure Portal → App registrations**, create a new app registration (e.g. `PlannerTasksFromTemplate-CI`).
2. Create a **Client secret** and copy its value → `PP_CLIENT_SECRET`.
3. In **Power Platform Admin Center → Environments → [your env] → Settings → Users + permissions → Application users**, add the app registration and assign it the **System Administrator** or **System Customizer** role.

#### Connector OAuth app registration (`PP_CONNECTOR_APP_ID`)

1. In **Azure Portal → App registrations**, create a separate app registration for the custom connector (e.g. `CampanulaGraphConnector`).
2. Under **API permissions**, add delegated permission **Microsoft Graph → Tasks.ReadWrite**. Grant admin consent if required by your tenant policy.
3. Under **Authentication**, allow public client flows or configure a redirect URI depending on how Power Platform authenticates; the connector's `redirectUrl` is already set to `https://global.consent.azure-apim.net/redirect/campa-campanula-planner-graph-5f2d765a9c3b99d87d`.
4. Copy the application (client) ID → `PP_CONNECTOR_APP_ID` (GitHub Actions variable, not a secret).
5. There is no client secret needed for this registration; the connector uses delegated OAuth on behalf of the connecting user.

> The deployment service principal (`PP_APP_ID`) is used only by PAC CLI and GitHub Actions to pack and import the solution.  
> The connector app registration (`PP_CONNECTOR_APP_ID`) is used only by the `Campanula Planner Graph` Power Platform connection when the Flow signs in to Microsoft Graph on behalf of the connected user.  
> These two applications have different roles and should not be merged.

### Trigger

| Event | Action |
| --- | --- |
| Push to `main` | Runs semantic-release. If a release is published, GitHub Actions updates both solution versions, stages both sources, packs two **Managed** packages, attaches the exact zips to the GitHub release, and imports the connector before the Flow solution. |
| `deploy.yml` `workflow_dispatch` | Redeploys the latest split release. GitHub Actions downloads both managed packages, or rebuilds them from the matching solution-version commit when the release has no attached package, and imports them in prerequisite order. |
| `deploy-connector.yml` `workflow_dispatch` | Bootstraps or refreshes only the Graph connector prerequisite. It does not read or require `PP_GRAPH_CONNECTION_ID`. |

The workflow allows only one production deployment to run at a time.

### Redeploy the last published release

Use the manual workflow when production needs the last published solution
deployed again, for example after a transient Power Platform import failure.
The workflow resolves the latest published GitHub release automatically; you do
not enter an `X.Y.Z` version.

From GitHub:

1. Open **Actions**.
2. Select **Deploy Power Platform Solution**.
3. Click **Run workflow**.
4. Enter a short deployment reason and click **Run workflow**.

With GitHub CLI:

```bash
gh workflow run deploy.yml --ref main -f reason="Redeploy the last published solution"
```

Manual redeploys do not create a new GitHub release, change either solution
version, or deploy the current unreleased contents of `main`. The latest
published release must contain both `CampanulaPlannerGraphConnector.zip` and
`CampanulaPlannerFlows.zip`; otherwise the workflow rebuilds from the matching
solution-version commit only when that commit contains the split prerequisite
solution.

---

## Solution and package folder structure

Production solution source folders:

```text
src\CampanulaPlannerGraphConnector
├── Connectors\
│   ├── campa_planner_graph.xml
│   ├── campa_planner_graph_openapidefinition.json
│   ├── campa_planner_graph_connectionparameters.json   ← contains ${MICROSOFT_ENTRA_APP_ID} placeholder in source
│   └── campa_planner_graph_policytemplateinstances.json
└── Other\
   ├── Customizations.xml
   └── Solution.xml

src\CampanulaPlannerFlows
├── [Content_Types].xml
├── customizations.xml
├── Other\
│   ├── Customizations.xml
│   └── Solution.xml
└── Workflows\
    └── CampanulaCreateConcertPlanFromTemplate.json
```

The two production folders are packed by GitHub Actions and imported with Power
Platform Tools. Before the Flow import, the workflow creates a
deployment-settings file from the exact managed Flow zip and fills all five
connection references from the target-environment GitHub variables. The
connector package is imported first, then the Flow package uses those existing
connections. The import step activates solution workflows and publishes
changes. The checked-in workflow metadata marks the Forms-triggered Flow
active, so a successful import with healthy connections leaves it available to
run. Resolve environment-specific form, Excel, Planner, and notification
values before running the Flow in a live environment.

After importing the connector prerequisite, create or refresh the
`Campanula Planner Graph` connection so the Flow can call Microsoft Graph with
delegated `Tasks.ReadWrite`. Store the resulting connection resource ID as
`PP_GRAPH_CONNECTION_ID` before running `deploy.yml`.

Managed production imports are solution-aware cloud flows. In the target
environment, expect to find them primarily under **Solutions**. A managed flow
imported this way might not appear under **My Flows** unless you are also its
owner or co-owner in that environment.

## Target-Tenant Black-Box Acceptance

Run this procedure only against the imported managed solution in the target
tenant. The supported seam is one temporary Microsoft Forms response per case,
followed by verification in Planner, outcome e-mail, and Power Automate run
history.

### Preconditions

1. Identify and retain the exact managed solution artifact imported for the
   test, including the workflow run or release record that produced it.
2. Confirm the imported Flow is enabled inside the `CampanulaPlannerFlows`
   solution and the `Campanula Planner Graph` connection reference is healthy.
3. Confirm the SharePoint workbook copy matches the intended workbook version.
4. Prepare reversible temporary workbook rows or a safe temporary
   configuration for negative cases. Never modify archive material.

### Required coverage

Execute and capture evidence for these black-box cases:

1. Clean success with small and large concert scopes.
2. Coverage across both concert types.
3. A live check that labels 7 through 9 are named and applied successfully.
4. Completed-with-warnings with valid tasks still created.
5. Zero-valid-task with no unintended plan created.
6. Today and past date rejection before plan creation.
7. Structural workbook failure using a safe temporary workbook change.
8. Runtime failure after partial creation, then manual deletion, correction,
   and a successful new submission.

### Verify in each successful plan

For the created plan, verify the visible outcome includes:

1. Expected plan title.
2. Every configured bucket.
3. Every configured label name, including labels 7 through 9.
4. Selected task count for the submitted scope.
5. Assignments, due dates including a past calculated date, progress, and
   priority.
6. Applied labels, descriptions, and checklists.
7. The outcome e-mail plan link and task counts.

### Run-history evidence

Capture Power Automate run history evidence that:

1. Non-idempotent create actions do not retry for plan, bucket, or task
   creation.
2. Bounded e-mail retries remain enabled and their final result is visible in
   run history.
3. The runtime failure after partial creation records the failure stage and the
   partial-plan link.

### Cleanup rules

After evidence is captured:

1. Delete every temporary plan created for acceptance.
2. Remove every temporary workbook row or temporary workbook configuration.
3. Keep the retained managed artifact and evidence set.
4. Do not edit, regenerate, move, or delete archive material.

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

Maintain the solution version in each unpacked solution's `Solution.xml`
(`<Version>`). GitHub Actions keeps the connector prerequisite and Flow
solution on the same release version.
Increment the version number before every release following
[Semantic Versioning](https://semver.org/):

- **Patch** (x.x.x+1) – bug fixes, description corrections, task additions/removals.
- **Minor** (x.x+1.0) – new buckets, labels, or significant task structure changes.
- **Major** (x+1.0.0) – breaking changes to the Flow logic or template structure.

---

## Operational Guardrails — Connector Credentials

The `Campanula Planner Graph` connector uses an OAuth connection on behalf of a real
user. That connection and its backing Entra app registration require occasional maintenance.

### What can break silently

| Failure mode | Symptom | Recovery |
| --- | --- | --- |
| Connector app registration deleted | Flow fails at `Create_Planner_Plan` with an auth error | Re-create the app registration, update `PP_CONNECTOR_APP_ID`, redeploy, and refresh the connection |
| Connector connection expires or is deleted | Flow fails at `Create_Planner_Plan` | Re-create the `Campanula Planner Graph` connection in Power Platform and link it to the connection reference |
| Connection user removed from the target Microsoft 365 group | Graph returns HTTP 403 on plan creation | Re-add the user to the group, or re-create the connection under a user who is a group member |
| `PP_CONNECTOR_APP_ID` variable cleared in GitHub | Next deployment fails at the "Inject connector app ID" step before packing | Restore the variable value and re-run the workflow |

### Connector connection ownership

- The `Campanula Planner Graph` Power Platform connection is associated with one specific user account.
- That account must remain a member of the Microsoft 365 group used for Planner plan creation.
- If the account leaves the organization or the group, the connection must be re-created under a new account that is a group member.

### Reviewing connector auth health

After any change to the Entra tenant, the connector app registration, or the Power Platform environment:

1. Open the `CampanulaPlannerFlows` solution in Power Platform.
2. Navigate to **Connection References** and verify `Campanula Planner Graph - CampanulaCreateConcertPlanFromTemplate` shows a healthy connection.
3. If the connection is missing or shows an error, create a new connection for the `Campanula Planner Graph` connector and update the connection reference.
