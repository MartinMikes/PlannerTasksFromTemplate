# Recommendations

## Implemented architecture

The connector bootstrap deadlock has been resolved by splitting the custom
connector into the managed `CampanulaPlannerGraphConnector` prerequisite
solution. Run `.github/workflows/deploy-connector.yml` once for a new target
environment, create and authenticate the delegated Graph connection
interactively, save its resource ID as `PP_GRAPH_CONNECTION_ID`, and then run
`.github/workflows/deploy.yml` for the Flow solution. Normal releases package
and import both managed solutions in that order.

The remainder of this file is the original investigation transcript. Its
historical searches may mention the connector under the former Flow solution
path; the current source is under `src/CampanulaPlannerGraphConnector`.

Updated todo list

I’ll trace the deployment contract from the Prompt 2/Response 2 guidance into the workflow’s actual connection-reference mapping, then run the repo’s focused checks. I’ll pay special attention to whether `PP_GRAPH_CONNECTION_ID` is merely a lookup value or whether the workflow has a missing step to create and authenticate the custom-connector connection.

Read , lines 120 to 390

Read

Read

Read

Read memory

The local contract already exposes the key gap: `PP_GRAPH_CONNECTION_ID` is consumed only as a `ConnectionId` in the generated deployment-settings JSON. The workflow validates that the value is nonempty and maps it, but it contains no step that creates, authenticates, or verifies the Graph custom-connector connection; I’m checking the connector definition and focused tests now to confirm the exact prerequisites and any separate workflow defects.

Search complete: Trace Graph connection contract

Searched for files matching `**/test/**/deploy-workflow*test.*`, no matches

Searched for text `PP_GRAPH_CONNECTION_ID`, 8 results

Searched for files matching `**/test/**/target-tenant*test.*`, no matches

Searched for files matching `**/scripts/typecheck-workflow.mjs`, 1 match

Searched for regex `pac.*command|command.*pac|Power.*Platform.*connector`, 18 results

Searched for regex `delegated.*OAuth|app-only.*auth|custom.*connector.*auth`, 17 results

Searched for files matching `**/deploy.yml`, 1 match

Searched for files matching `**/CampanulaPlannerFlows/Connectors/**`, 4 matches

Searched for files matching `**/issue-60-target-tenant*acceptance*test*`, 1 match

Searched for files matching `**/deploy.yml`, 1 match

Searched for files matching `**/typecheck-workflow*`, 1 match

Searched for files matching `**/issue-59-deploy-workflow*test*`, 1 match

Searched for files matching `**/campa_planner_graph*`, 4 matches

The connector source confirms this is delegated OAuth, not client-credential/app-only auth: the connector advertises Graph as the resource, uses the Power Platform consent redirect, and requires a user-owned authenticated connection. That means the missing value cannot be generated from `PP_CONNECTOR_APP_ID`; it must be the resource ID of a connection created and signed in by the intended delegated owner. I’m validating the platform’s supported deployment semantics and then I’ll separate blockers from merely conceptual statements in Response 2.

Ran Microsoft Docs Search
Completed with input: {
  "query": "Power Automate custom connector OAuth 2.0 delegated authentication create connection consent redirect URL"
}

Ran Microsoft Docs Search
Completed with input: {
  "query": "Power Platform CLI pac solution create-settings deployment settings connection references solution import settings-file"
}

Ran Microsoft Docs Search
Completed with input: {
  "query": "Power Platform solution connection references deployment settings file connection ID existing connection"
}

The official-doc search is back with larger-than-inline results, so I’m reading the saved excerpts before drawing conclusions. After that I’ll run the repository’s `typecheck` and deployment tests; those checks can catch workflow-contract regressions, while they cannot prove a target tenant connection is actually authenticated.

Read

Read

The Microsoft guidance matches the workflow’s intended use: generate settings, populate real target connection IDs, then import; import validates that each connection is usable by the connection-reference owner or a shared principal. It also confirms that the ID is read from the target connection URL. I’m running the repo checks now, then I’ll flag the workflow’s remaining operational and correctness risks, including the release/manual path behavior.

Ran terminal command: pnpm typecheck

Ran terminal command: pnpm test

Ran terminal command: git status --short --branch

The repository checks pass (`typecheck` and all 18 tests), but they are contract tests, not tenant validation. One important review distinction is emerging: the workflow is structurally sound for binding an already-authenticated connection, while Response 2 overstates what `pac`/GitHub can automate for delegated OAuth. I’m checking the Graph permission requirements and the exact custom-connector sign-in sequence so the final setup steps are technically precise.

Ran Microsoft Docs Search
Completed with input: {
  "query": "site:learn.microsoft.com/en-us/graph/api/planner-post-plans Create plannerPlan permissions delegated Group.ReadWrite.All Planner.ReadWrite.All"
}

Ran Microsoft Docs Search
Completed with input: {
  "query": "site:learn.microsoft.com/power-platform/alm connection reference owner shared connection flow enabled import solution"
}

Ran Microsoft Docs Search
Completed with input: {
  "query": "site:learn.microsoft.com/power-platform/custom-connectors OAuth 2.0 custom connector redirect URI connection consent Microsoft Graph"
}

Created 3 todos

Read

Read

Read

The Graph API check confirms `Tasks.ReadWrite` is the least-privileged delegated permission for the connector’s `POST /planner/plans`; application-only deployment credentials do not replace that user consent. Microsoft’s solution guidance also confirms a crucial runtime rule: the importing service principal must own or be granted use of the mapped connection, and an existing flow that is already off may remain off after an update import. I’m doing one final local pass for exact line references and branch-specific differences before I summarize.

Ran terminal command: rg -n "PP_GRAPH_CONNECTION_ID|PP_CONNECTOR_APP_ID|Validate required configuration|Create deployment settings file|Import solution to Power Platform|--settings-file|--activate-plugins|Set solution version|Resolve last published release|git push" .github/workflows/deploy.yml docs/Deployment.md docs/research/power-platform-solution-deployment.md
Completed with input: rg -n "PP_GRAPH_CONNECTION_ID|PP_CONNECTOR_APP_ID|Validate required configuration|Create deployment settings file|Import solution to Power Platform|--settings-file|--activate-plugins|Set solution version|Resolve last published release|git push" .github/workflows/deploy.yml docs/Deployment.md docs/research/power-platform-solution-deployment.md

Ran terminal command: git diff main -- .github/workflows/deploy.yml docs/research/power-platform-solution-deployment.md; git diff --check
Completed with input: git diff main -- .github/workflows/deploy.yml docs/research/power-platform-solution-deployment.md; git diff --check

Ran terminal command: rg -n "connectionReferences|campa_sharedcampanulaplannergraph_createconcertplan|CreatePlan|Tasks.ReadWrite|groupId|planner/plans" src/CampanulaPlannerFlows/Workflows src/CampanulaPlannerFlows/Connectors docs/Deployment.md
Completed with input: rg -n "connectionReferences|campa_sharedcampanulaplannergraph_createconcertplan|CreatePlan|Tasks.ReadWrite|groupId|planner/plans" src/CampanulaPlannerFlows/Workflows src/CampanulaPlannerFlows/Connectors docs/Deployment.md

Ran terminal command: rg -n "^\.env|\.env" .gitignore README.md docs/Deployment.md
Completed with input: rg -n "^\.env|\.env" .gitignore README.md docs/Deployment.md

The local tests are green, and the review is now about runtime readiness rather than syntax. I found two practical blockers to call out clearly: the current workflow expects `PP_GRAPH_CONNECTION_ID` to pre-exist, and it does not explicitly re-enable a flow that was already off in the target environment. I’m fetching the exact Microsoft references and line anchors for the final guidance.

Ran Microsoft Docs Search
Completed with input: {
  "query": "<https://learn.microsoft.com/connectors/custom-connectors/azure-active-directory-authentication#create-a-custom-connector>"
}

Ran Microsoft Docs Search
Completed with input: {
  "query": "<https://learn.microsoft.com/power-platform/alm/conn-ref-env-variables-build-tools>"
}

Ran Microsoft Docs Search
Completed with input: {
  "query": "<https://learn.microsoft.com/graph/api/planner-post-plans?view=graph-rest-1.0>"
}

Ran Microsoft Docs Search
Completed with input: {
  "query": "<https://learn.microsoft.com/power-apps/maker/data-platform/create-connection-reference#share-connections-with-another-user-so-flows-can-be-enabled>"
}

Ran Microsoft Docs Search
Completed with input: {
  "query": "Microsoft Graph create plannerPlan delegated Tasks.ReadWrite permissions"
}

Ran Microsoft Docs Search
Completed with input: {
  "query": "Power Platform custom connector Azure Active Directory authentication create connection redirect URI"
}

Ran Microsoft Docs Search
Completed with input: {
  "query": "Power Platform ALM connection references environment variables build tools deployment settings import"
}

Ran terminal command: Select-String -Path .github/workflows/deploy.yml -Pattern 'Resolve last published release|Validate required configuration|PP_GRAPH_CONNECTION_ID|PP_CONNECTOR_APP_ID|Create deployment settings file|--settings-file|Import solution to Power Platform|--activate-plugins|Set solution version|git push'

Ran terminal command: Select-String -Path docs/Deployment.md,docs/research/power-platform-solution-deployment.md -Pattern 'PP_GRAPH_CONNECTION_ID|PP_CONNECTOR_APP_ID|must already exist|does not create|delegated|pac solution update|create connections|enable Cloud Flow|StateCode|Response 2|convert-to-managed'

Ran terminal command: Select-String -Path src/CampanulaPlannerFlows/Connectors/campa_planner_graph_connectionparameters.json,src/CampanulaPlannerFlows/Connectors/campa_planner_graph_openapidefinition.json,src/CampanulaPlannerFlows/Workflows/CampanulaCreateConcertPlanFromTemplate.json.data.xml -Pattern 'clientId|Tasks.ReadWrite|redirectUrl|delegated|oauth2_auth|StateCode|StatusCode|campa_sharedcampanulaplannergraph_createconcertplan'

The final picture is clear: the deployment file is acceptable as a “bind existing connections and import” workflow, but it is not a complete first-run automation for a delegated custom connector. I’m taking one last targeted read of the documented setup and workflow anchors so the handoff can be executed step by step without confusing the connector app ID, connection ID, and deployment service-principal credentials.

Read , lines 232 to 306

Read , lines 187 to 270

Read , lines 97 to 145

Read , lines 320 to 345

Read , lines 1 to 42

**Review Verdict**

`deploy.yml` is structurally sound for importing a managed solution and binding existing target-environment connections. The repository checks pass:

- `pnpm typecheck`
- `pnpm test`: 18 tests passed

However, it is not a fully unattended first-time deployment. The workflow expects `PP_GRAPH_CONNECTION_ID` to already identify an authenticated Power Platform connection. It does not create the custom-connector connection or perform delegated OAuth consent.

**Important Findings**

1. **`PP_GRAPH_CONNECTION_ID` must be created before the workflow can succeed.**  
   The workflow rejects an empty value in `deploy.yml:97`, then writes that value into the Graph connection reference in `deploy.yml:232`. It never creates or authenticates the connection.

2. **The workflow does not guarantee that an already-disabled flow is enabled.**  
   `--activate-plugins` is not a general cloud-flow enable operation. Microsoft documents that when an existing target flow is already off, importing an update does not necessarily turn it back on. The repository documentation already describes this case in `Deployment.md:220`.

3. **Response 2 contains conceptual or outdated PAC commands.**  
   Treat these as pseudocode, not commands to add directly:
   - `pac connector import`
   - `pac solution list-connectionreferences`
   - `pac solution update-connectionreference`
   - `pac solution set-environmentvariable`
   - `pac solution import --wait`

   The current workflow’s use of `pac solution create-settings` and `pac solution import --settings-file` is the correct approach. The deployment settings file is the mechanism that maps connection references.

4. **Response 2 incorrectly leaves room for client-credential authentication.**  
   This connector is explicitly configured for delegated OAuth in `campa_planner_graph_connectionparameters.json:1`. `PP_APP_ID` and `PP_CLIENT_SECRET` authenticate the deployment service principal to Dataverse; they are not the Graph connection credentials.

5. **Security issue:** the attached `.env` contains a client secret that appears usable. Rotate or revoke that secret immediately, then update the GitHub Actions `PP_CLIENT_SECRET` secret. Deleting the local `.env` alone is not sufficient.

**What Each Value Means**

| Value | Meaning |
| --- | --- |
| `PP_APP_ID` | Client ID of the deployment service principal used by PAC CLI |
| `PP_CLIENT_SECRET` | Secret of the deployment service principal |
| `PP_CONNECTOR_APP_ID` | Client ID of the separate Entra app used by the custom connector |
| `PP_GRAPH_CONNECTION_ID` | ID of the authenticated Power Platform connection created for `Campanula Planner Graph` |
| `campa_sharedcampanulaplannergraph_createconcertplan` | Solution connection-reference logical name |

Do not use the connector app ID, connector component ID, connection-reference logical name, or the full connection URL as `PP_GRAPH_CONNECTION_ID`.

**How to Create `PP_GRAPH_CONNECTION_ID`**

1. **Verify the connector Entra app**

   In the app registration represented by `PP_CONNECTOR_APP_ID`:

   - Add Microsoft Graph delegated permission `Tasks.ReadWrite`.
   - Grant admin consent if required by the tenant.
   - Add this exact Web redirect URI:

   ```text
   https://global.consent.azure-apim.net/redirect/campa-campanula-planner-graph-5f2d765a9c3b99d87d
   ```

   The redirect URI comes from the connector definition. The connector app ID must be the value that the workflow injects into the staged package in `deploy.yml:200`.

2. **Make sure the custom connector exists in the target environment**

   The solution must already have been imported at least once so that `Campanula Planner Graph` appears in the target environment.

   For a completely new environment, there is a bootstrap dependency: the workflow requires the connection ID before importing the solution, but the connector is delivered by that solution. Use a one-time maker-portal/bootstrap import or split the connector into a prerequisite solution.

3. **Create the connection interactively**

   In the target environment:

   1. Open Power Automate or Power Apps.
   2. Select the correct environment.
   3. Open **Connections**.
   4. Select **New connection**.
   5. Search for **Campanula Planner Graph**.
   6. Select **Create**.
   7. Sign in with the dedicated delegated connection owner.
   8. Accept the requested Microsoft Graph consent.

   Use an account that can create Planner plans in the target Microsoft 365 group. The deployment service principal cannot perform this interactive delegated sign-in.

4. **Share the connection with the deployment service principal**

   Because the workflow imports through `PP_APP_ID`, the connection must be usable by the solution/flow owner after import.

   In the connection’s sharing options, share it with the application user representing `PP_APP_ID` and grant **Can use**. This is especially important when the connection was created by a human or service account rather than the deployment service principal.

   The repository documentation covers this ownership requirement in `Deployment.md:208`.

5. **Copy the connection resource ID**

   Open the connection details page. Its URL will contain a segment similar to:

   ```text
   .../connections/<connector-name>/<connection-id>/details
   ```

   Copy only the `<connection-id>` value. Copy it exactly as shown. Do not copy the connector name or the entire URL.

6. **Create the GitHub Actions variable**

   Go to:

   **Repository Settings → Secrets and variables → Actions → Variables**

   Create or update this repository variable:

   ```text
   PP_GRAPH_CONNECTION_ID=<copied-connection-id>
   ```

   The workflow reads `${{ vars.PP_GRAPH_CONNECTION_ID }}`. It does not read the local `.env` file. Since the workflow has no `environment:` declaration, a variable stored only under a GitHub Environment will not be available; use a repository variable or add the appropriate job environment.

7. **Confirm the other four connection IDs**

   All five values must point to existing, usable connections:

   - `PP_FORMS_CONNECTION_ID`
   - `PP_EXCEL_CONNECTION_ID`
   - `PP_PLANNER_CONNECTION_ID`
   - `PP_GRAPH_CONNECTION_ID`
   - `PP_OUTLOOK_CONNECTION_ID`

8. **Deploy the correct package**

   If the target already contains an older version with the flow turned off, publish a new patch release containing the active flow metadata. Do not rely on the manual “redeploy latest release” path if that path reuses an older ZIP.

   This is documented in `Deployment.md:220`. Also, if `PP_CONNECTOR_APP_ID` changes, publish a new package first. A manual deployment that downloads an existing release asset does not reinject the current app ID.

9. **Verify after import**

   In the target environment:

   - Open the `CampanulaPlannerFlows` solution.
   - Confirm all five connection references are healthy.
   - Confirm the custom connector connection status is connected.
   - Enable the cloud flow manually if it remains off.
   - Submit a controlled Microsoft Forms test response.
   - Verify the run history reaches the Graph `CreatePlan` action successfully.

The workflow’s JSON validation and import logic are good for the existing-connection model: `deploy.yml:247` verifies all five connection references before `deploy.yml:296` imports the package. The missing piece is the one-time delegated OAuth connection setup and, for an already-disabled flow, explicit re-enablement.

Starting: *Provide guidance for setting ENV VAR PP_GRAPH_CONNECTION_ID* (3/3)
