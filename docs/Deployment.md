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
- Dataverse access for the deployment app to read the sharing principal and to
  read, activate, and share the workflow record in that environment.
- A separate Entra app registration for the Graph connector OAuth flow.
- GitHub repository access to **Settings -> Secrets and variables -> Actions**.

The deployment workflow reads GitHub `vars.*` and `secrets.*`; it does not read
the local `.env` file.

## GitHub configuration

Create these repository variables and secret:

| Name | Type | Value |
| --- | --- | --- |
| `PP_ENVIRONMENT_URL` | Variable | Target environment URL. |
| `PP_APP_ID` | Variable | Client ID of the deployment app. |
| `PP_TENANT_ID` | Variable | Entra tenant ID. |
| `PP_CLIENT_SECRET` | Secret | Client secret **value** of the deployment app. |
| `PP_CONNECTOR_APP_ID` | Variable | Client ID of the Entra app used by the Graph connector. |
| `PP_FORMS_CONNECTION_ID` | Variable | Forms connection resource ID in the target environment. |
| `PP_EXCEL_CONNECTION_ID` | Variable | Excel Online Business connection resource ID. |
| `PP_PLANNER_CONNECTION_ID` | Variable | Planner connection resource ID. |
| `PP_GRAPH_CONNECTION_ID` | Variable | Campanula Planner Graph connection resource ID. |
| `PP_OUTLOOK_CONNECTION_ID` | Variable | Office 365 Outlook connection resource ID. |
| `FLOW_SHARE_PRINCIPAL_TYPE` | Variable | `User` or `Group`; the corresponding user or group team must exist in Dataverse. |
| `FLOW_SHARE_PRINCIPAL_OBJECT_ID` | Variable | Entra object ID of the user or group receiving the direct share. |
| `FLOW_SHARE_ROLE` | Variable | `CanView` (read) or `CanEdit` (read/write) on the workflow record. |

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

### Flow connection authorization, activation, and sharing

The managed package contains the Flow with `StateCode=0`, so packaging and
solution import alone do not guarantee that the modern cloud Flow is running.
Deployments bind existing connections; they do not change who can use them.
After a successful import, **Activate and Share Flow** uses the deployment
application's Dataverse access in the same organization as the import:

1. Read the modern flow definition by its stable solution workflow ID. Display
   names can be localized and are not used for lookup.
2. Resolve the Entra object ID to exactly one existing Dataverse group team or
   enabled user. No teams, users, or tenant-wide grants are created.
3. Activate the workflow if needed and read back its state.
4. Grant or update the target's direct share and verify its access mask.
   `CanView` means read; `CanEdit` means read and write. A matching share is
   left alone. Changing the configured role replaces that principal's direct
   share on this record; it does not change rights inherited from other roles.

This is Dataverse record sharing, not an ownership transfer, run-only sharing,
connection sharing, or a license grant. Premium flows owned by a service
principal may still require a Process license or a designated licensed owner.

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
   user who belongs to the target Planner group. Confirm that the deployment
   application can use the connection before importing the Flow.
5. Copy each connection's resource ID into its matching GitHub variable. A
   deleted and recreated connection receives a new ID, even for the same user.
6. Run **Actions -> Deploy Power Platform Solution -> Run workflow** with
   **Rebuild both managed solutions from current main** enabled. This packs the
   current source, injects `PP_CONNECTOR_APP_ID` into a temporary connector
   package, imports the connector, maps all five connection references, and
   imports the Flow. The dependent post-deployment job then enables the Flow
   and shares it with the configured principal.
7. Verify the Flow is enabled, the configured principal has the configured
   record access, and all five connection references are healthy in the
   `CampanulaPlannerFlows` solution. Submit one clearly temporary Form
   response, verify the plan and notification, then delete the test plan.

`--activate-plugins` does not guarantee activation of a modern cloud Flow. The
dependent Dataverse job explicitly activates it and verifies its direct share.

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
- activate the imported modern Flow by updating its Dataverse workflow record;
- grant or update the configured direct share and read it back for verification.

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

Open the failed import in the target environment's **Solutions → See history**.
Match the failing connection reference to its `PP_*_CONNECTION_ID`. Check that
the connection is healthy, belongs to that environment, and is the one you
intend to use. Have the connection owner repair or share **that connection**
with the deployment application user where supported. If it cannot be shared,
bind an authorized connection instead. Retry only after correcting the binding
or access; do not grant rights to all five connections as a diagnostic step.

To identify the deployment principal, open **Entra ID → Enterprise applications**
in `PP_TENANT_ID`, find the application whose **Application ID** is `PP_APP_ID`,
and copy its **Object ID**. This optional local lookup value (`PP_APP_OBJECT_ID`)
is not required in GitHub Actions. Do not use the object ID from **App registrations**.

### `InvalidSourceTemplateName` during Flow import

The deployable Flow definition must use its opaque source template identifier,
not the Flow display name. Confirm that
`src/CampanulaPlannerFlows/Workflows/CampanulaCreateConcertPlanFromTemplate.json`
contains:

```json
"templateName": "f06e6f8fbd3e49d5984858b3b54709b2"
```

The companion `.json.data.xml` supplies localized names and the stable
workflow ID used by the activation job. If the
release ZIP predates this correction, select **Rebuild both managed solutions
from current main** rather than redeploying that ZIP.

### Flow import rejects a connection ID

Confirm that the ID is the resource ID from the target environment's connection
details, not the connector ID, app ID, environment ID, or logical connection-
reference name. Replace the corresponding GitHub variable and rerun the
workflow.

### The activation or sharing job fails

If activation returns `InvalidOpenApiFlow` / `WorkflowOperationParametersExtraParameter`,
check the named input against the **connector operation** rather than the underlying
Graph API. For example, Planner `CreateBucket_V2` takes `name`, `groupId`, and
`planId`, not `orderHint`. Stable `CreateTask_V3` takes labels under
`appliedCategories` but does not take `priority`; the Flow applies priority in
its ETag-protected Graph task update. Import the corrected managed solutions
before retrying activation.

The PR workflow tests the flow definition and the activation/sharing script
with mock Dataverse responses. It uses no deployment credentials. To verify
real activation before production, import both candidate packages into a test
environment with its own connections, form, workbook, and Dataverse sharing
principal, then run [the same activation command as CI](DeploymentReference.md#enable-and-share-the-modern-flow).

Check the Dataverse HTTP operation and status in the failed step. For a missing
workflow, check the solution import and `PP_ENVIRONMENT_URL`; use the workflow
ID, not the localized name. For a missing or ambiguous principal, verify the
configured Entra object ID and provision or identify the intended team or user
in this environment. A 403 requires checking the deployment application's
record access, not granting tenant administration or sharing connections.

If the activation `PATCH` returns HTTP 400 with a nested
`ConnectionAuthorizationFailed` for the Graph reference, the flow was found
but Power Automate could not use its connection. Before changing permissions:

1. As the deployment app, run `pac connection list --environment <organization-url>`.
   Find `PP_GRAPH_CONNECTION_ID` and compare its **API Id** with the Graph
   `apiId` in the flow package. Use the installed connector's API ID, not the
   similarly named OAuth redirect URI. An old release ZIP retains the old ID.
2. If **Status** is `Error`, have the connection owner
   [repair or recreate the delegated Graph connection](DeploymentReference.md#refresh-the-graph-connection).
   If recreated, update `PP_GRAPH_CONNECTION_ID`. Confirm the connection is
   healthy and the deployment app can use it.
3. Deploy a package built from the corrected source. Rerunning the failed
   activation job alone does not replace the imported flow definition.

If activation succeeds but the Flow cannot run, troubleshoot the five backing
connections separately. Flow owner access and connection `Can use` access are
different permissions. Also check the service-principal licensing requirement
for premium connectors or service-principal-owned Flows.

## References

- [Microsoft deployment settings](https://learn.microsoft.com/power-platform/alm/conn-ref-env-variables-build-tools)
- [Power Platform connection references](https://learn.microsoft.com/power-apps/maker/data-platform/create-connection-reference)
- [Manage solution cloud flows with Dataverse](https://learn.microsoft.com/power-automate/manage-flows-with-code)
- [Custom connector Microsoft Entra authentication](https://learn.microsoft.com/connectors/custom-connectors/azure-active-directory-authentication)
- [Form definition](FormDefinition.md)
- [Excel template](ExcelTemplate.md)
