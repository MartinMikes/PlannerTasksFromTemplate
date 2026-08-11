# Deployment Guide

## Overview

`src\CampanulaPlannerFlows` is the production Power Platform solution source.
GitHub Actions packs this folder as a managed solution and imports it directly
into the production environment.

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

## Current source folder

The `src\CampanulaPlannerFlows` folder is the production unpacked solution source. GitHub Actions packs and imports this folder as a managed solution. It can contain multiple Flow components later; currently it contains the first Flow.

Unpacked solution source structure:

```text
src\CampanulaPlannerFlows
├── [Content_Types].xml
├── Connectors\
├── customizations.xml
├── solution.xml
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

### 3. Inject connector app ID and create the managed solution zip

The connector source contains the placeholder `${MICROSOFT_ENTRA_APP_ID}`.
Replace it in a temporary pack folder before packing, using the connector app
registration ID from `.env`:

```bash
: "${PP_CONNECTOR_APP_ID:?PP_CONNECTOR_APP_ID is required}"
mkdir -p out
rm -rf out/CampanulaPlannerFlows
cp -R src/CampanulaPlannerFlows out/CampanulaPlannerFlows

# macOS (BSD sed): use `sed -i '' ...` or install GNU sed (`brew install gnu-sed`) and use `gsed -i ...`.
sed -i "s|\${MICROSOFT_ENTRA_APP_ID}|${PP_CONNECTOR_APP_ID}|g" \
  out/CampanulaPlannerFlows/Connectors/campa_planner_graph_connectionparameters.json

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
  --path        out/CampanulaPlannerFlows.zip \
  --environment "$PP_ENVIRONMENT_URL" \
  --activate-plugins
```

### 5. Check solution status

```bash
pac solution list --environment "$PP_ENVIRONMENT_URL"
```

### 6. Create or refresh the connector connection

After importing a version that contains the custom connector for the first time or after any auth change:

1. Open Power Platform and navigate to the `CampanulaPlannerFlows` solution.
2. Open **Connection References**.
3. For `Campanula Planner Graph - CampanulaCreateConcertPlanFromTemplate`, create a new connection using the `Campanula Planner Graph` connector.
4. Sign in with an account that is a member of the Microsoft 365 group used for Planner plan creation.
5. Confirm the connection reference shows a healthy connection.

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

The workflow file `.github/workflows/deploy.yml` automates creating a solution
zip from the production solution source folder and importing it:

```text
src\CampanulaPlannerFlows
```

The solution may contain multiple Flow components later. The current scope is the
first Flow, `CampanulaCreateConcertPlanFromTemplate`.

The solution source now also includes the `Campanula Planner Graph` custom
connector under `src\CampanulaPlannerFlows\Connectors`.

The deployment workflow automatically injects the connector OAuth app ID before
packing into a temporary staging copy of the solution source. If
`PP_CONNECTOR_APP_ID` is not set as a GitHub Actions variable, the
workflow fails with an explicit error before packing starts. The placeholder
`${MICROSOFT_ENTRA_APP_ID}` in
`src\CampanulaPlannerFlows\Connectors\campa_planner_graph_connectionparameters.json`
must never be replaced manually in source control; only the deployment pipeline
may replace it at pack time.

### Required GitHub variables and secrets

Go to **Settings → Secrets and variables → Actions** in this repository and add:

| Name | Type | Description |
| --- | --- | --- |
| `PP_ENVIRONMENT_URL` | Variable | Power Platform environment URL, e.g. `https://org.crm4.dynamics.com/` |
| `PP_APP_ID` | Variable | Microsoft Entra ID application (client) ID of the deployment service principal |
| `PP_TENANT_ID` | Variable | Microsoft Entra ID tenant ID |
| `PP_CLIENT_SECRET` | Secret | Client secret of the deployment service principal |
| `PP_CONNECTOR_APP_ID` | Variable | Application (client) ID of the Entra app registration for the `Campanula Planner Graph` custom connector OAuth (separate from the deployment service principal; requires delegated `Tasks.ReadWrite` on Microsoft Graph) |

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
| Push to `main` | Runs semantic-release. If a release is published, GitHub Actions updates the solution version, stages the source, packs one **Managed** package, attaches that exact zip to the GitHub release, and imports the same zip into production. |
| `workflow_dispatch` | Ad hoc production deploy. GitHub Actions stages the selected ref, packs one **Managed** package, and imports that same zip into production even when semantic-release does not publish a release. |

The workflow allows only one production deployment to run at a time.

### Ad hoc production deploy

Use the manual workflow when production needs the current solution source even
though the latest commit does not trigger a semantic-release release.

From GitHub:

1. Open **Actions**.
2. Select **Deploy Power Platform Solution**.
3. Click **Run workflow**.
4. Select the branch or tag to deploy, usually `main`.
5. Enter a short deployment reason and click **Run workflow**.

With GitHub CLI:

```bash
gh workflow run deploy.yml --ref main -f reason="Ad hoc production deploy"
```

Manual ad hoc deploys do not create a GitHub release or change the solution
version in source control. They use the version already present in
`src\CampanulaPlannerFlows\Other\Solution.xml`.

---

## Solution and package folder structure

Production solution source folder:

```text
src\CampanulaPlannerFlows
├── [Content_Types].xml
├── customizations.xml
├── Connectors\
│   ├── campa_planner_graph.xml
│   ├── campa_planner_graph_openapidefinition.json
│   ├── campa_planner_graph_connectionparameters.json   ← contains ${MICROSOFT_ENTRA_APP_ID} placeholder in source
│   └── campa_planner_graph_policytemplateinstances.json
├── Other\
│   ├── Customizations.xml
│   └── Solution.xml
└── Workflows\
    └── CampanulaCreateConcertPlanFromTemplate.json
```

The production folder is zipped by GitHub Actions and imported with Power
Platform Tools. The import step explicitly activates solution workflows and
publishes changes so connection references and the Forms-triggered Flow are
ready for post-deploy verification. Resolve environment-specific form, Excel, Planner, and
notification values before running the Flow in a live environment.

After importing a version that contains the custom connector, open Power
Platform and create or refresh the `Campanula Planner Graph` connection so the
Flow can call Microsoft Graph with delegated `Tasks.ReadWrite`.

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

For the `CampanulaPlannerFlows` solution, maintain the solution version in the
unpacked solution's `solution.xml` (`<Version>`).
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
