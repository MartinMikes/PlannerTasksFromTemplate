# Deployment Guide

This repository deploys two managed Power Platform solutions:

- `CampanulaPlannerGraphConnector` installs the custom connector prerequisite.
- `CampanulaPlannerFlows` installs the Flow and its five connection references.

GitHub Actions imports the connector before the Flow. The Flow solution does
not contain authenticated connections. Those connections belong to the target
environment and must already exist when the Flow solution is imported.

For manual PAC CLI recovery, detailed target-tenant evidence, external resource
updates, versioning, and connector maintenance, see
[Deployment Reference](DeploymentReference.md).

## Prerequisites

- A target Power Platform environment and permission to add application users,
  connectors, solutions, and connections.
- A Microsoft 365 group where the connection owner can create Planner plans.
- The Microsoft Form and SharePoint workbook used by the Flow. They are
  external resources and are not packaged in either solution.
- The deployment app registered as an application user in the target
  environment with `System Administrator` or `System Customizer` access.
- The deployment app configured for Power Platform administration commands.
   The app must be allowed to authenticate to the Power Platform administration
   service, and its service principal must have the required environment and
   Flow-management permissions.
- A separate Entra app registration for the Graph connector OAuth flow.
- GitHub repository access to **Settings -> Secrets and variables -> Actions**.

The deployment workflow reads GitHub `vars.*` and `secrets.*`; it does not read
the local `.env` file.

## GitHub configuration

Create these repository variables and secret:

| Name | Type | Value |
| --- | --- | --- |
| `PP_ENVIRONMENT_URL` | Variable | Target environment URL. |
| `PP_ENVIRONMENT_ID` | Variable | Target environment GUID used by the administration PowerShell cmdlets. |
| `PP_APP_ID` | Variable | Client ID of the deployment app. |
| `PP_TENANT_ID` | Variable | Entra tenant ID. |
| `PP_CLIENT_SECRET` | Secret | Client secret **value** of the deployment app. |
| `PP_CONNECTOR_APP_ID` | Variable | Client ID of the Entra app used by the Graph connector. |
| `PP_FORMS_CONNECTION_ID` | Variable | Forms connection resource ID in the target environment. |
| `PP_EXCEL_CONNECTION_ID` | Variable | Excel Online Business connection resource ID. |
| `PP_PLANNER_CONNECTION_ID` | Variable | Planner connection resource ID. |
| `PP_GRAPH_CONNECTION_ID` | Variable | Campanula Planner Graph connection resource ID. |
| `PP_OUTLOOK_CONNECTION_ID` | Variable | Office 365 Outlook connection resource ID. |
| `FLOW_SHARE_PRINCIPAL_TYPE` | Variable | `User` or `Group` for the Flow owner permission target. |
| `FLOW_SHARE_PRINCIPAL_OBJECT_ID` | Variable | Entra object ID of the user or security group receiving the Flow owner permission. |
| `FLOW_SHARE_ROLE` | Variable | `CanView` or `CanEdit`; `CanUse` is not a valid Flow owner role. |

All five connection values must be connection **resource IDs** from the same
target environment. They are not connector IDs, Entra app IDs, environment IDs,
connection-reference names, URLs, or secret IDs.

### Graph connector OAuth setup

`PP_CONNECTOR_APP_ID` must be the **Application (client) ID** of the dedicated
connector app registration. Do not use the custom connector component ID
`aa5c469a-b5dd-4963-917c-66bf35639bb3`; doing so causes `AADSTS700016`.

Configure the connector app registration with:

- Microsoft Graph delegated permission `Tasks.ReadWrite`;
- this Web redirect URI:
  `https://global.consent.azure-apim.net/redirect/campa-campanula-planner-graph-5f2d765a9c3b99d87d`;
- a client secret whose **value** is entered in the custom connector's
  **Security** settings.

Keep this connector secret separate from `PP_CLIENT_SECRET`. It is not stored
in the solution source or GitHub Actions.

The Flow's Planner group ID is stored in the `plannerGroupId` parameter in
`src/CampanulaPlannerFlows/Workflows/CampanulaCreateConcertPlanFromTemplate.json`.
Change that source value and publish a new solution version when deploying to a
different group.

### Flow activation and sharing

The managed package contains the Flow with `StateCode=0`, so packaging and
solution import alone do not guarantee that the modern cloud Flow is running.
After a successful import, the workflow's Windows PowerShell job uses the
Microsoft.PowerApps.Administration.PowerShell module to:

1. Resolve workflow ID `7b7d1d61-5ad2-4a81-9ee8-3e6e7c829018` and verify its
   display name is `CampanulaCreateConcertPlanFromTemplate`.
2. Run `Enable-AdminFlow`.
3. Grant the configured `FLOW_SHARE_PRINCIPAL_TYPE` and
   `FLOW_SHARE_PRINCIPAL_OBJECT_ID` the configured `FLOW_SHARE_ROLE` owner
   role. To keep the current group sharing, set those variables to `Group`,
   `a41f5114-a83e-48ae-8f09-6108674e138f`, and `CanEdit`.
4. Re-read the Flow and its owner roles, failing the deployment if it is not
   enabled or the requested role is missing.

The principal ID is a non-secret repository configuration value. A `Group`
principal must be an Entra security-enabled group because that is the group
type accepted by the administration cmdlet. To share with a person instead,
use `User` and that person's Entra object ID. `martin.mikes@campanulajihlava.cz`
is an email address, not a value accepted by `Set-AdminFlowOwnerRole`; resolve
the user's object ID first.

`Set-AdminFlowOwnerRole` supports only `CanView` and `CanEdit`. Use `CanEdit`
when the target needs to inspect, edit, or manage the Flow; use `CanView` for
read-only owner access. `CanUse` is not a Flow owner role. It is the permission
used for sharing a connector connection, and does not grant Flow access. If the
target only needs to invoke the Flow, configure a Power Automate run-only user
through the product's run-only sharing experience instead; that is a different
permission model and is not what this owner-role job configures.

Flow owner sharing is separate from connection sharing. The deployment service
principal still needs `Can use` access to each backing connection before the
solution import can succeed. Giving the group owner access to the Flow does not
grant it access to Forms, Excel, Planner, Outlook, or Graph connections.

The post-deployment job runs with Windows PowerShell 5.1 because the documented
administration module targets Windows PowerShell. Confirm that the deployment
application is registered and authorized as a Power Platform management
application before relying on this job. A premium Flow owned by a service
principal may also require a Power Automate Process license or a designated
licensed owner, depending on the target tenant's licensing configuration.

## First deploy to an empty environment

Use this path when the target has no connector, solutions, or connections.

1. Configure the two Entra applications, the GitHub settings above, and the
   Graph connector Security settings. Do not create the Graph connection until
   the connector's client ID and secret are configured.
2. Run **Actions -> Bootstrap Graph Connector -> Run workflow**. Provide a
   reason. This workflow installs only the connector and does not require
   `PP_GRAPH_CONNECTION_ID`.
3. In the target environment, create and test these five connections:
   - Microsoft Forms
   - Excel Online Business
   - Planner
   - Office 365 Outlook
   - Campanula Planner Graph
4. For the Graph connection, complete delegated sign-in and consent with a
   user who belongs to the target Planner group. If the deployment app is not
   the connection owner, share each connection with its application user and
   grant **Can use**.
5. Copy each connection's resource ID into its matching GitHub variable. A
   deleted and recreated connection receives a new ID, even for the same user.
6. Run **Actions -> Deploy Power Platform Solution -> Run workflow** with
   **Rebuild both managed solutions from current main** enabled. This packs the
   current source, injects `PP_CONNECTOR_APP_ID` into a temporary connector
   package, imports the connector, maps all five connection references, and
   imports the Flow. The dependent post-deployment job then enables the Flow
   and shares it with the configured principal.
7. Verify the Flow is enabled, the configured principal has the configured
   owner role, and all five connection references are healthy in the
   `CampanulaPlannerFlows` solution. Submit one clearly temporary Form
   response, verify the plan and notification, then delete the test plan.

`--activate-plugins` asks solution import to activate workflows included in the
package when their connections are usable. It does not override the state of an
existing Flow that is already turned off in the target environment. The
dependent administration job is the explicit activation step for this modern
Flow; it also applies and verifies the co-owner role.

## Redeploy with existing connections

Choose the workflow mode based on the target state:

| Situation | Action |
| --- | --- |
| New source change on `main` | Push to `main`. If semantic-release publishes a release, the workflow deploys it automatically. |
| Existing connector and connections are healthy; redeploy the last release | Run **Deploy Power Platform Solution** with **Rebuild both managed solutions from current main** disabled. This uses the exact assets attached to the latest release. |
| Connector app ID, connector source, or current unreleased source changed | Run the workflow with **Rebuild both managed solutions from current main** enabled. This avoids reusing a stale release asset. |
| Connector was deleted but connections are absent | Run **Bootstrap Graph Connector**, recreate and authenticate the five connections, update their IDs, then run the source rebuild. |
| A connection was deleted or recreated | Update only the matching `PP_*_CONNECTION_ID` variable before importing the Flow. |

The normal deployment always imports the connector prerequisite before the Flow.
The source-rebuild option is especially important after correcting
`PP_CONNECTOR_APP_ID`, because changing the GitHub variable does not change an
already published connector zip.

## Target-Tenant Black-Box Acceptance

Retain the exact managed solution artifact used for the deployment and record
the target environment, solution versions, connection-reference status, Flow
run history, Planner results, and notification results. Use one temporary Microsoft Forms response per case and cover small and large concert scopes,
both concert types, and labels 7 through 9.

The acceptance run must demonstrate these outcomes and safeguards:

- successful generation;
- `completed-with-warnings` for selected rows that are skipped;
- `zero-valid-task` when no selected row can create a task;
- rejection of today and past date submissions;
- a structural workbook failure before plan creation;
- a runtime failure after partial creation;
- create actions do not retry after an uncertain result, while transient
   notification failures use bounded e-mail retries.

After each scenario, remove the temporary plan and temporary workbook row.
Protect archive material and attach the relevant run history to the evidence.

## What the workflows do

The workflows automate the package work:

- stage both unpacked solution folders;
- replace the connector app-ID placeholder only in the temporary package;
- pack managed solution zips;
- import the connector and apply its icon;
- generate and validate deployment settings for all five connection references;
- import the Flow solution with `--activate-plugins`;
- enable the imported modern Flow with `Enable-AdminFlow`;
- grant and verify the configured Flow owner role with
   `Set-AdminFlowOwnerRole` and `Get-AdminFlowOwnerRole`.

When the manual workflow reuses a published release, the connector OpenAPI
definition is read from that release's managed package and the icon is read
from the release tag. The connector update therefore stays aligned with the
selected release instead of applying connector metadata from the current
`main` checkout.

They cannot create authenticated user connections, perform delegated OAuth
sign-in, or grant consent. A solution contains a connection reference, not the
OAuth token behind the connection. This is the reason the clean deployment has
one interactive setup stage between the two workflows.

The Form, SharePoint workbook, Planner group, and connector OAuth app are also
environment-level dependencies. A solution import does not create or upload
those resources.

## Troubleshooting

### `AADSTS700016` names the custom connector ID

The connector was packaged with the component ID instead of the OAuth app ID.

1. Set `PP_CONNECTOR_APP_ID` to the connector Entra app's Application (client)
   ID.
2. Set the connector's Security client ID and secret in the target environment.
3. Run **Bootstrap Graph Connector** again.
4. Delete the failed Graph connection, create it again, and update
   `PP_GRAPH_CONNECTION_ID`.
5. Run the deployment with source rebuild enabled.

### `AADSTS7000215` says the client secret is invalid

Use the secret **value**, not the secret ID. The connector OAuth secret belongs
in the custom connector Security settings. `PP_CLIENT_SECRET` is a different
secret used only by PAC CLI authentication.

### The caller cannot use the custom connector

Confirm that the deployment app is an application user in the target
environment with sufficient solution privileges, and that the connector was
imported by the Bootstrap workflow or is shared with that application user.
Then verify that the connection owner has shared the connection with the
connection-reference owner and granted **Can use**.

### `ConnectionAuthorizationFailed` during Flow import

The Flow import can stop at about 38.89% with PAC CLI reporting only
`An unexpected error occurred`. The server-side import job will show
`ConnectionAuthorizationFailed` when the deployment application's service
principal cannot use one of the connections in the deployment settings file.

In the target environment, open **Power Apps -> Connections**, share each of
the five connections used by the Flow with the deployment application user,
and grant **Can use**:

- Microsoft Forms
- Excel Online Business
- Planner
- Office 365 Outlook
- Campanula Planner Graph

In this tenant the application user is displayed as
`GitHub-PowerPlatform-CICD`. For the Graph OAuth connection, sharing with the
service principal is required when the connection owner is a different user.
The failed run reported service-principal object ID
`9be81f92-206c-4889-a1f4-4aa0f5aa21f7`; the configured `PP_APP_ID` is the
separate client/application ID `860c6253-e153-4050-951a-6db6ef834829`. Share
the connection with the application user identified by the object ID, and
keep the client/application ID in `PP_APP_ID`.
After sharing all five connections, rerun the deployment. Keep the full
connection resource IDs in the corresponding `PP_*_CONNECTION_ID` variables;
do not replace them with an app ID, connector ID, or connection-reference name.

### Flow import rejects a connection ID

Confirm that the ID is the resource ID from the target environment's connection
details, not the connector ID, app ID, environment ID, or logical connection-
reference name. Replace the corresponding GitHub variable and rerun the
workflow.

### The activation or sharing job fails

Check that `PP_ENVIRONMENT_ID` is the target environment GUID, not
`PP_ENVIRONMENT_URL`, the tenant ID, or an environment display name. Confirm
that the deployment application can use the Power Platform administration
PowerShell cmdlets and that the `Microsoft.PowerApps.Administration.PowerShell`
module can authenticate with the configured tenant, application ID, and secret.

If Flow lookup fails, verify that the imported solution contains workflow ID
`7b7d1d61-5ad2-4a81-9ee8-3e6e7c829018` and that its display name remains
`CampanulaCreateConcertPlanFromTemplate`. If owner verification fails, confirm
that `FLOW_SHARE_PRINCIPAL_TYPE`, `FLOW_SHARE_PRINCIPAL_OBJECT_ID`, and
`FLOW_SHARE_ROLE` are set to the intended principal and one of the supported
owner roles, `CanView` or `CanEdit`.

If activation succeeds but the Flow cannot run, troubleshoot the five backing
connections separately. Flow owner access and connection `Can use` access are
different permissions. Also check the service-principal licensing requirement
for premium connectors or service-principal-owned Flows.

## References

- [Microsoft deployment settings](https://learn.microsoft.com/power-platform/alm/conn-ref-env-variables-build-tools)
- [Power Platform connection references](https://learn.microsoft.com/power-apps/maker/data-platform/create-connection-reference)
- [Enable-AdminFlow](https://learn.microsoft.com/powershell/module/microsoft.powerapps.administration.powershell/enable-adminflow?view=pa-ps-latest)
- [Set-AdminFlowOwnerRole](https://learn.microsoft.com/powershell/module/microsoft.powerapps.administration.powershell/set-adminflowownerrole?view=pa-ps-latest)
- [Get-AdminFlowOwnerRole](https://learn.microsoft.com/powershell/module/microsoft.powerapps.administration.powershell/get-adminflowownerrole?view=pa-ps-latest)
- [Custom connector Microsoft Entra authentication](https://learn.microsoft.com/connectors/custom-connectors/azure-active-directory-authentication)
- [Form definition](FormDefinition.md)
- [Excel template](ExcelTemplate.md)
