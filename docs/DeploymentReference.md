# Deployment Reference

This document supplements [Deployment Guide](Deployment.md). Use the guide for
an ordinary first deployment or redeployment. Use this reference when a manual
PAC CLI recovery, a detailed acceptance run, or ongoing maintenance is needed.

Never put client secrets, connection IDs, access tokens, or other environment
values in this document or in the repository.

## Manual PAC CLI recovery

The GitHub workflows are the supported deployment path. PAC CLI is a fallback
for investigating or repairing a target environment. Run these commands from
the repository root with PowerShell on Windows.

### Authenticate

Use an interactive profile for a user-driven connection check:

```powershell
pac auth create --name dev --environment $env:PP_ENVIRONMENT_URL
```

Use the deployment service principal for solution operations:

```powershell
pac auth create `
  --name ci `
  --environment $env:PP_ENVIRONMENT_URL `
  --applicationId $env:PP_APP_ID `
  --clientSecret $env:PP_CLIENT_SECRET `
  --tenant $env:PP_TENANT_ID
```

The service principal must be an application user in the target environment
with enough privileges to import solutions and update the connector.
For the post-deployment Flow operation, also set `PP_ENVIRONMENT_ID` to the
target environment GUID. It is not interchangeable with `PP_ENVIRONMENT_URL`.

### Stage and pack managed solutions

The tracked connector source intentionally contains the placeholder
`${MICROSOFT_ENTRA_APP_ID}`. Replace it only in a temporary staging folder;
never commit the connector app ID into
`src/CampanulaPlannerGraphConnector/Connectors/campa_planner_graph_connectionparameters.json`.

```powershell
$stage = Join-Path $PWD 'out'
$connectorStage = Join-Path $stage 'CampanulaPlannerGraphConnector'
$flowsStage = Join-Path $stage 'CampanulaPlannerFlows'

Remove-Item -Recurse -Force $stage -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $stage | Out-Null
Copy-Item -Recurse 'src/CampanulaPlannerGraphConnector' $connectorStage
Copy-Item -Recurse 'src/CampanulaPlannerFlows' $flowsStage

$parameters = Join-Path $connectorStage 'Connectors/campa_planner_graph_connectionparameters.json'
(Get-Content -Raw $parameters).Replace(
  '${MICROSOFT_ENTRA_APP_ID}',
  $env:PP_CONNECTOR_APP_ID
) | Set-Content $parameters -NoNewline

pac solution pack `
  --zipFile (Join-Path $stage 'CampanulaPlannerGraphConnector.zip') `
  --folder $connectorStage `
  --packageType Managed

pac solution pack `
  --zipFile (Join-Path $stage 'CampanulaPlannerFlows.zip') `
  --folder $flowsStage `
  --packageType Managed
```

Keep the two packages separate. Import the connector before the Flow because
the Flow connection reference depends on the connector.

### Import and apply the connector icon

```powershell
pac solution import `
  --path out/CampanulaPlannerGraphConnector.zip `
  --environment $env:PP_ENVIRONMENT_URL

pac connector update `
  --environment $env:PP_ENVIRONMENT_URL `
  --connector-id aa5c469a-b5dd-4963-917c-66bf35639bb3 `
  --api-definition-file src/CampanulaPlannerGraphConnector/Connectors/campa_planner_graph_openapidefinition.json `
  --icon-file src/CampanulaPlannerGraphConnector/Connectors/campa_planner_graph_icon.png

pac solution import `
  --path out/CampanulaPlannerFlows.zip `
  --environment $env:PP_ENVIRONMENT_URL `
  --activate-plugins

pac solution list --environment $env:PP_ENVIRONMENT_URL
```

The connector component ID is valid for `pac connector update`; it is not an
OAuth application ID and must never be assigned to `PP_CONNECTOR_APP_ID`.
PAC CLI requires an API definition or settings file for `connector update`, even
when the requested change is only the icon.

### Enable and share the modern Flow

PAC CLI does not provide the required modern Flow activation and owner-sharing
commands. Use the documented Power Platform administration module from Windows
PowerShell 5.1. The deployment application must be authorized for Power
Platform administration, and a service-principal-owned premium Flow may need a
Process license or a designated licensed owner.

```powershell
Install-Module `
  -Name Microsoft.PowerApps.Administration.PowerShell `
  -Repository PSGallery `
  -Scope CurrentUser `
  -Force `
  -AllowClobber
Import-Module Microsoft.PowerApps.Administration.PowerShell

Add-PowerAppsAccount `
  -Endpoint prod `
  -TenantID $env:PP_TENANT_ID `
  -ApplicationId $env:PP_APP_ID `
  -ClientSecret $env:PP_CLIENT_SECRET

$flowId = '7b7d1d61-5ad2-4a81-9ee8-3e6e7c829018'
$flowName = 'CampanulaCreateConcertPlanFromTemplate'
$principalType = $env:FLOW_SHARE_PRINCIPAL_TYPE
$principalObjectId = $env:FLOW_SHARE_PRINCIPAL_OBJECT_ID
$roleName = $env:FLOW_SHARE_ROLE
$flow = Get-AdminFlow `
  -EnvironmentName $env:PP_ENVIRONMENT_ID `
  -FlowName $flowId
if ($flow.DisplayName -ne $flowName) {
  throw "Unexpected Flow display name: $($flow.DisplayName)"
}

Enable-AdminFlow `
  -EnvironmentName $env:PP_ENVIRONMENT_ID `
  -FlowName $flowId

Set-AdminFlowOwnerRole `
  -EnvironmentName $env:PP_ENVIRONMENT_ID `
  -FlowName $flowId `
  -PrincipalType $principalType `
  -PrincipalObjectId $principalObjectId `
  -RoleName $roleName

$flowAfter = Get-AdminFlow `
  -EnvironmentName $env:PP_ENVIRONMENT_ID `
  -FlowName $flowId
if (-not $flowAfter.Enabled) {
  throw 'The Flow is still disabled.'
}

$ownerRoles = @(Get-AdminFlowOwnerRole `
  -EnvironmentName $env:PP_ENVIRONMENT_ID `
  -FlowName $flowId)
if (-not ($ownerRoles | Where-Object {
  $_.PrincipalObjectId -eq $principalObjectId -and
  $_.PrincipalType -eq $principalType -and
  $_.RoleType -eq $roleName
})) {
  throw 'The requested Flow owner role was not found.'
}
```

Set `FLOW_SHARE_PRINCIPAL_TYPE`, `FLOW_SHARE_PRINCIPAL_OBJECT_ID`, and
`FLOW_SHARE_ROLE` in the environment before running this fallback. The role
must be `CanView` or `CanEdit`; `CanUse` is a connection permission, not a Flow
owner role. The current values target the Entra security group `Pěvecké
sdružení Campanula, z. s.` with `CanEdit`. To use Martin Mikes's account
instead, set the principal type to `User` and provide Martin's Entra object ID.
Do not pass `martin.mikes@campanulajihlava.cz` as
`FLOW_SHARE_PRINCIPAL_OBJECT_ID`; the cmdlet requires the object ID. Flow owner
sharing does not grant connection permissions, so the deployment application
must still have `Can use` access to all five backing connections.

### Refresh the Graph connection

After the connector is imported or its OAuth settings change:

1. In Power Platform, open the `CampanulaPlannerGraphConnector` solution or
   **Custom connectors** and confirm the connector Security settings use the
   dedicated OAuth app's client ID and secret value.
2. Create a connection for `Campanula Planner Graph`.
3. Sign in with a user who belongs to the Planner group and complete delegated
   Graph consent for `Tasks.ReadWrite`.
4. Test the connection and confirm that it is healthy.
5. Share the connection with the deployment application user and grant **Can
   use** when the service principal is not the owner.
6. In the Flow solution, verify that
   `Campanula Planner Graph - CampanulaCreateConcertPlanFromTemplate` points to
   the healthy connection.
7. Store the connection resource ID in `PP_GRAPH_CONNECTION_ID`.

If connection creation returns `AADSTS700016` with the connector component ID,
correct `PP_CONNECTOR_APP_ID`, rerun **Bootstrap Graph Connector**, recreate the
Graph connection, and use source rebuild for the Flow deployment. If the error
names the real OAuth app ID, check that the app exists in the tenant, is
multitenant when required, and has delegated `Tasks.ReadWrite` consent.

If connection creation returns `AADSTS7000215`, use the OAuth secret value,
not its secret ID, in the connector Security settings. If the same error occurs
while PAC CLI authenticates in GitHub Actions, update the deployment app secret
value in `PP_CLIENT_SECRET` instead. These are separate credentials.

## Release and package reference

A release package is immutable. Changing `PP_CONNECTOR_APP_ID` does not alter a
connector zip already attached to a release. Use **Rebuild both managed
solutions from current main** for an immediate source-based repair, or publish a
new release before using the normal release path.

For a redeployment, retain the exact managed solution artifact that was
imported. Record its release or workflow run, solution versions, target
environment, and connection-reference values. This makes a failed import or
acceptance result reproducible without guessing which package was used.

The two unpacked solutions must keep the same version:

- `src/CampanulaPlannerGraphConnector/Other/Solution.xml`
- `src/CampanulaPlannerFlows/Other/Solution.xml`

Normal releases derive the next version from semantic-release and update both
solutions. Use Conventional Commits to classify changes; do not manually bump
one solution independently of the other.

The Flow's Planner group is configured by `plannerGroupId` in
`src/CampanulaPlannerFlows/Workflows/CampanulaCreateConcertPlanFromTemplate.json`.
A group change is a source change and requires a new package or source rebuild.

## Detailed target-tenant acceptance

Run this procedure only against the imported managed solution in the target
tenant. The supported test seam is one temporary Microsoft Forms response per
case, followed by verification in Planner, the outcome e-mail, and Power
Automate run history.

### Preconditions

1. Retain the exact managed solution artifact, including the release or
   workflow run that produced it.
2. Confirm the Flow is enabled and all five connection references are healthy.
3. Confirm the SharePoint workbook copy matches the intended workbook version.
4. Prepare reversible temporary workbook rows or configuration for negative
   cases. Never modify archive material.

### Required coverage

Capture evidence for:

1. Clean success with small and large concert scopes.
2. Both concert types.
3. Labels 7 through 9 are named and applied correctly.
4. `completed-with-warnings` while valid tasks are still created.
5. `zero-valid-task` with no unintended plan created.
6. Today and past date rejection before plan creation.
7. Structural workbook failure before plan creation.
8. Runtime failure after partial creation, followed by cleanup, correction, and
   a successful new submission.

### Successful plan and run-history checks

For every successful plan, verify the expected title, every configured bucket,
labels 7 through 9, selected task count, assignments, due dates, progress,
priority, applied labels, descriptions, checklists, and the notification link
and task counts.

Capture run history showing that non-idempotent create actions do not retry for
plan, bucket, or task creation. Confirm transient notification failures use
bounded e-mail retries and that the final result is visible. For a partial
runtime failure, retain the failure stage and partial-plan link.

### Cleanup and evidence

After evidence is captured:

- delete every temporary plan;
- remove every temporary workbook row or temporary workbook configuration;
- retain the managed artifact and evidence set;
- do not edit, regenerate, move, or delete archive material.

## External resource updates

### SharePoint workbook

After changing `templates/PlannerTasksTemplate.xlsx`, upload the new file to
the SharePoint document library used by the Flow and replace the existing copy.
The Flow reads the SharePoint copy at runtime, not the repository file. Verify a
controlled run with the updated workbook before using it for production work.

### Microsoft Form

`docs/FormDefinition.md` is the source of truth for the Czech Microsoft Form.
When changing questions or choices:

- keep user-facing Czech labels understandable;
- keep the English identifiers used by the Flow and Excel, such as
  `concertName`, `templateType`, `concertDate`, `TemplateType`, and
  `DaysFromEvent`;
- keep template-type choices aligned with `tbTasksTemplate[TemplateType]`;
- export and unpack the Flow if the form schema or mappings changed.

## Connector credential guardrails

The Graph connector acts on behalf of one real user. That user and the backing
Entra app registration are operational dependencies.

| Failure mode | Symptom | Recovery |
| --- | --- | --- |
| Connector app registration deleted | Auth error at `Create_Planner_Plan` | Recreate the app, update `PP_CONNECTOR_APP_ID`, redeploy, and refresh the connection. |
| Connector connection expires or is deleted | Flow fails at `Create_Planner_Plan` | Recreate the Graph connection and relink the connection reference. |
| Connection user leaves the Planner group | Graph returns HTTP 403 | Re-add the user or recreate the connection under a group member. |
| `PP_CONNECTOR_APP_ID` is missing | Packaging fails at app-ID injection | Restore the GitHub variable and rerun the workflow. |

The Graph connection belongs to a specific user account. That account must stay
in the Microsoft 365 group used for plan creation. After any Entra, connector,
or environment change, open the Flow solution's **Connection References** and
confirm that `Campanula Planner Graph - CampanulaCreateConcertPlanFromTemplate`
shows a healthy connection.
