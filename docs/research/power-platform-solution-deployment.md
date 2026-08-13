# Power Platform Solution Deployment - generic info

## Prompts

**Prompt 1**
Power Platform Solution with custom Flow and custom Connector. How to properly deploy it from GitHub, Turn it on and get ready to work for a user?

**Prompt 2**
Power Platform Solution with custom Flow and custom connector. Give me detailed step by step guidance for proper automated deploy from GitHub using GH Actions. We use service principals and we need to turn on all solution objects (Cloud Flow, Custom Connector, Connection References) and get ready to work for a user.
Right now I already have solution created, partially working deployment as the solution is imported in my environment. But it still needs to be activated and enabled to be used by user
I already have configured my ENV VARs for Forms, Excel, Planner and Outlook connection, I'm still missing the Graph connection ID to for my custom connector, which then connects to Planner API to create a new Plan (as this Action is missing in builtin Microsoft Actions)

## Response 1

### Overview

Below is a practical, step‑by‑step deployment checklist to take a **Power Platform solution** stored in **GitHub** (including a **solution-aware Power Automate flow** and a **custom connector**) and deploy it into a target environment, enable it, and make it ready for a user. I include the key commands, ALM options, and the configuration items you must set after import (connection references, environment variables, permissions).

---

### Quick comparison (what to choose for CI/CD)

| **Attribute** | **GitHub Actions (recommended)** | **Azure DevOps** |
| --- | ---: | ---: |
| **Integration with GitHub repo** | **Best**; native Actions | Good |
| **Prebuilt Power Platform tasks** | Microsoft Power Platform Actions; community actions | Power Platform Build Tools (extensions) |
| **Ease for small teams** | Easier to set up | Enterprise-friendly, mature pipelines |
| **Secrets & service connections** | GitHub Secrets | Service connections, variable groups |

---

### 1. Prepare the solution in GitHub

1. **Solution packaging**
   - Ensure your solution contains the **flow** and the **custom connector** as solution components (managed or unmanaged depending on target). Export a solution zip from the source environment and commit it to the repo.  
   - **Why:** ALM pipelines import the solution zip into the target environment.

2. **Custom connector artifacts**
   - Include the connector definition (OpenAPI/Swagger JSON) and any policy files in the repo if you maintain the connector outside the solution. If the connector is inside the solution, the connector resource will be part of the solution zip.

3. **Parameterize environment-specific values**
   - Put environment variables, connection names, and secrets into a pipeline-friendly format (JSON or YAML parameter files). Use **Environment Variables** or **Solution Patches** for values that change per environment.

---

### 2. Choose CI/CD approach and set up authentication

1. **Use Power Platform CLI (pac) + GitHub Actions** (recommended)
   - Install and use the **Power Platform CLI (pac)** in your workflow to authenticate and run solution import/export commands. Microsoft provides GitHub Actions and CLI guidance.

2. **Service principal / service account**
   - Create an Azure AD app or service principal (or a dedicated user) with the required permissions in the target Dataverse environment (Environment Maker or System Administrator depending on tasks). Store credentials in GitHub Secrets.

3. **Secrets to store**
   - Tenant ID, Client ID, Client Secret (for service principal) or username/password for a service account; target environment URL; solution file path. Use GitHub Secrets or Azure DevOps variable groups.

---

### 3. Pipeline steps (GitHub Actions example)

1. **Checkout repo**  
2. **Authenticate** using `pac auth create` or the Power Platform GitHub Action with the service principal.  
3. **Export / Build (optional)** — if building from source, run solution pack/unpack steps.  
4. **Import solution** into target environment using `pac solution import --path <solution.zip> --async` or the corresponding action.  
5. **Apply environment-specific configuration**:
   - Update **connection references** to point to the correct connections in the target environment.
   - Set **environment variables** (Dataverse environment variables) values.
   - If the custom connector is not included, import the connector (OpenAPI) and create the connection resource.

6. **Publish customizations** and **wait for import completion**. Use `pac solution import --wait` or poll the import job.

---

### 4. Post‑import configuration (critical to “turn on” flows)

After the solution import finishes, perform these steps in the target environment (can be automated in pipeline):

1. **Create connections for the custom connector and other connectors**
   - For each connector used by the flow (including your custom connector), create a **connection** resource in the environment and authenticate it (OAuth consent, API keys, etc.). The flow’s connection references must point to these connections. Without valid connections the flow will be disabled.

2. **Update Connection References**
   - Map solution connection references to the newly created connections. This is usually done by the pipeline using the Power Platform CLI or by using the Power Platform admin center. If not mapped, flows remain in a **disabled** or **broken** state.

3. **Set Environment Variables**
   - Populate Dataverse environment variables used by the solution (API endpoints, keys, feature flags). These are editable in the Power Apps maker portal or via CLI.

4. **Enable and test the flow**
   - After connections are valid and references mapped, **enable** the flow (it may be enabled automatically if connection references are resolved). Run a test trigger to confirm it executes successfully. Check run history and logs for errors.

5. **Assign permissions**
   - Ensure the user(s) who will run or manage the flow have appropriate roles: access to the environment, the solution, and any Dataverse tables or custom connector resources. For custom connectors, ensure the connector’s API permissions are granted to the service principal or user.

---

### 5. Common pitfalls and how to avoid them

- **Flow disabled after import** — usually due to missing or unmapped connection references. Fix by creating connections and mapping them.
- **Custom connector not authorized** — ensure OAuth consent and API keys are configured in the target environment. Test the connector independently before running the flow.
- **Solution import failures** — check solution dependencies, managed/unmanaged conflicts, and required platform versions. Use `--overwrite` or patching strategies carefully.
- **Secrets in repo** — never store credentials in source; use GitHub Secrets or Azure DevOps secure variables.

---

### 6. Example commands and snippets
>
> **Authenticate (pac CLI)**  
> `pac auth create --url https://<org>.crm.dynamics.com --clientId <id> --clientSecret <secret> --tenant <tenantId>`

> **Import solution**  
> `pac solution import --path ./solutions/MySolution.zip --async`

> **List connection references** (to map)  
> `pac solution list-connectionreferences --solution <solutionId>`

> **Update environment variable**  
> `pac solution set-environmentvariable --name MyVar --value "production-value"`

(Use the Power Platform CLI docs for exact flags and latest syntax.)

---

### 7. Turn it on for a user — final checklist

1. Solution imported successfully and published.
2. All connector **connections** created and authenticated (including custom connector).
3. **Connection references** mapped to the created connections.
4. Environment variables set to production values.
5. Flow(s) enabled and a successful test run recorded.
6. User has required environment and Dataverse permissions; any API consent granted.

---

### 8. Useful references

- **Power Platform ALM and GitHub Actions** — Microsoft docs on using GitHub Actions and Power Platform CLI for solution deployment.
- **Power Platform CLI (pac) reference** — commands for solution import/export and environment configuration.
- **Custom connectors and authentication** — how to import, configure, and authenticate custom connectors.

---

If you want, I can:

- Produce a **GitHub Actions workflow** YAML tailored to your repo (I’ll infer typical repo layout), or  
- Generate the exact **pac CLI** command sequence for your environment (tell me whether you use a service principal or a user account, and whether the connector is inside the solution or separate).

## Response 2

### Summary

Below is a **detailed, step‑by‑step GitHub Actions CI/CD recipe** to take your existing Power Platform solution (contains a **Cloud Flow** and a **Custom Connector**), import it into a target environment using a **service principal**, create and map **connection references**, register and wire the **Graph/Azure AD** identity for the custom connector (so it can call Planner), enable the flow and verify it’s ready for a user. I include concrete `pac` CLI commands, GitHub Actions job steps, and the exact post‑import actions you must automate. I also call out checks and troubleshooting tips.

> **Assumptions I use below**
>
> - You have a solution ZIP in your repo or an artifact produced by a prior job.  
> - You use an Azure AD **service principal** (client id/secret/tenant) with rights to the target environment.  
> - The custom connector either is included in the solution or you have its OpenAPI JSON in the repo.  
> - You already configured environment variables for Forms, Excel, Planner, Outlook connections except the Graph app (you still need Graph client id/secret/consent).  

---

### Table of key steps (high level)

| **Step** | **Purpose** | **Key tools** |
| --- | ---: | --- |
| 1. Prepare artifacts | Ensure managed solution or export managed in pipeline | `pac` export or pre-exported managed ZIP |
| 2. Authenticate in pipeline | Connect `pac` to target environment using service principal | `pac auth create` |
| 3. Import solution | Import managed solution into target environment | `pac solution import` |
| 4. Create connections | Create connection resources for connectors (including custom connector) | `pac connector import` / REST / PowerShell |
| 5. Map connection references | Map solution connection references to created connections | `pac solution update-connectionreference` or REST API |
| 6. Set environment variables | Populate Dataverse environment variables used by solution | `pac solution set-environmentvariable` |
| 7. Enable flows & test | Ensure Cloud Flow is enabled and run a smoke test | Power Platform REST / `pac` / Flow run API |
| 8. Verify permissions & consent | Ensure Graph app has delegated/app permissions and admin consent | Azure AD portal / MS Graph consent |

---

### 1 — Prepare solution artifact (managed)

**Why:** `--convert-to-managed` is deprecated; produce a managed package explicitly.  
**Options:**

- **Preferred:** Export a **managed** solution from your dev/build environment and store the ZIP as a pipeline artifact or in the repo.
- **CI option:** Use `pac solution export` in a build job to create a managed ZIP, then pass that artifact to the deploy job.

**Example (conceptual):**

```bash
# from a build job that has access to the source environment
pac auth create --url https://<org>.crm.dynamics.com --clientId $SP_CLIENT_ID --clientSecret $SP_CLIENT_SECRET --tenant $TENANT_ID
pac solution export --name "MySolution" --managed true --path ./artifacts
# artifact: ./artifacts/MySolution_managed.zip
```

---

### 2 — GitHub Actions: authenticate using service principal

Store these secrets in **GitHub Secrets**: `SP_CLIENT_ID`, `SP_CLIENT_SECRET`, `TENANT_ID`, `ENV_URL` (target org URL), and any connector secrets.

**Action step (bash):**

```yaml
- name: Install Power Platform CLI
  run: |
    npm i -g paconn-cli || true
    # or use Microsoft provided action to install pac
- name: Authenticate pac
  env:
    SP_CLIENT_ID: ${{ secrets.SP_CLIENT_ID }}
    SP_CLIENT_SECRET: ${{ secrets.SP_CLIENT_SECRET }}
    TENANT_ID: ${{ secrets.TENANT_ID }}
    ENV_URL: ${{ secrets.ENV_URL }}
  run: |
    pac auth create --url $ENV_URL --clientId $SP_CLIENT_ID --clientSecret $SP_CLIENT_SECRET --tenant $TENANT_ID
```

(Adjust install step to match your runner OS and pac install method.)

---

### 3 — Import the managed solution

**Important:** remove any use of `--convert-to-managed`. Import the managed ZIP produced earlier.

**Action step:**

```yaml
- name: Import managed solution
  run: |
    pac solution import --path ./artifacts/MySolution_managed.zip --wait
```

Use `--wait` or poll the import job to ensure completion before proceeding.

---

### 4 — Create and authenticate connection resources (including custom connector)

After import, the solution will contain **connection references** that must be mapped to actual **connection** records in the environment. For each connector used by the flow (Forms, Excel, Outlook, Planner/custom connector), do:

#### 4.1 Built-in connectors (Forms, Excel, Outlook)

- If you already have connection credentials (user/service account), create connections via Power Platform REST or `pac` (or use the Power Platform Admin center UI).
- Example (REST approach): call the **Connections** API to create a connection record and authenticate it. Many teams use PowerShell or the `Microsoft.PowerPlatform.Cds.Client` libraries.

#### 4.2 Custom connector (Graph / Planner)

You must register an **Azure AD app** (service principal) that the custom connector will use to call Microsoft Graph (Planner). Steps:

1. **Register Azure AD app** (if not already):
   - Create app registration in Azure AD.
   - Add required **Application** or **Delegated** permissions for Microsoft Graph (e.g., `Group.ReadWrite.All`, `Tasks.ReadWrite`, `Planner.ReadWrite.All` depending on actions).
   - **Grant admin consent** for those permissions.

2. **Expose credentials** to pipeline:
   - Save `GRAPH_CLIENT_ID`, `GRAPH_CLIENT_SECRET`, `GRAPH_TENANT_ID` in GitHub Secrets.

3. **If custom connector uses OAuth2**:
   - In the custom connector definition (OpenAPI), set the OAuth2 settings to use the registered app (client id, tenant, token URL).
   - If the connector is included in the solution, after import you still must create a **connection** for that connector and authenticate it (OAuth consent flow). For service principal flows, you may use client credentials if the connector supports it.

4. **Create the connection resource** in the environment:
   - Use the Power Platform REST API to create a connection referencing the custom connector and include the OAuth client id/secret. Example payload includes `connectorid`, `parameters` (client id/secret), and `displayName`.
   - Alternatively, use `pac` or PowerShell wrappers if available.

**Note:** If your custom connector uses **client credentials** (app-only) you must ensure the connector supports that grant type and the connector's security definition is configured accordingly.

---

### 5 — Map connection references to created connections

**Why:** Without mapping, flows remain disabled or broken.

**How to automate:**

- Use `pac` CLI commands or the Power Platform **Solution API** to list connection references in the imported solution and update them to point to the newly created connection records.

**Conceptual `pac`/REST flow:**

1. **List connection references** for the solution (get the logical names and reference ids).
2. **For each connection reference**, find the corresponding connection record you created (by connector id or display name).
3. **Update the connection reference** to point to the connection record id.

**Example pseudo-commands:**

```bash
# list connection references (pseudo)
pac solution list-connectionreferences --solution MySolution

# update a connection reference (pseudo)
pac solution update-connectionreference --solution MySolution --connectionReferenceName "shared_planner" --connectionId <connection-record-id>
```

If `pac` on your version lacks a direct command, use the Dataverse Web API to PATCH the `connectionreference` entity or update the `msdyn_solutioncomponent` mapping. Many teams use a small PowerShell or Azure Function to perform the mapping via the Web API.

---

### 6 — Set Dataverse environment variables

If your solution uses Dataverse environment variables (recommended), set them after import:

**Example:**

```bash
pac solution set-environmentvariable --name "GraphClientId" --value ${{ secrets.GRAPH_CLIENT_ID }}
pac solution set-environmentvariable --name "GraphClientSecret" --value ${{ secrets.GRAPH_CLIENT_SECRET }}
pac solution set-environmentvariable --name "PlannerTenantId" --value ${{ secrets.TENANT_ID }}
```

If `pac` lacks a direct command for your CLI version, use the Dataverse Web API to update `environmentvariablevalue` records.

---

### 7 — Publish customizations and enable flows

1. **Publish all customizations** (ensures solution components are active):

   ```bash
   pac org publish --all
   ```

   or call the Dataverse `PublishAll` action.

2. **Enable Cloud Flow(s)**:
   - If connection references are correctly mapped and connections are valid, flows may auto‑enable. If not, explicitly enable them via the Power Automate REST API:
     - Use the **Flows** API to set `state` to `Started` or call the `Enable` action.
   - Example (pseudo):

     ```bash
     # call Power Automate REST to enable flow
     PATCH https://management.azure.com/providers/Microsoft.ProcessSimple/environments/<env>/flows/<flowId>?api-version=2016-11-01
     body: { "properties": { "state": "Started" } }
     ```

3. **Run a smoke test**:
   - Trigger the flow (if it has a manual trigger) or simulate the trigger event.
   - Check run history for success and inspect logs.
   - If the flow fails, check connection errors and connector logs.

---

### 8 — Verify custom connector Graph access and Planner action

- Confirm the custom connector can obtain tokens from Azure AD using the client id/secret and call Planner endpoints.
- Test the connector independently (Postman or `paconn` test) to create a Plan in Planner.
- If the connector uses delegated permissions, ensure the connection user has the necessary Planner permissions.

---

### 9 — Finalize user readiness and permissions

- Ensure the user(s) who will use the solution have:
  - Access to the environment (Environment Maker or appropriate role).
  - Security roles for Dataverse tables used by the flow.
  - If flows run under connection user accounts, ensure those accounts have Planner/Graph permissions.
- Document how to re-authenticate connections if tokens expire.

---

### Example GitHub Actions job (skeleton)

```yaml
name: Deploy Power Platform Solution

on:
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install pac CLI
        run: |
          # install pac according to your environment
          npm i -g paconn-cli || true

      - name: Authenticate pac
        env:
          SP_CLIENT_ID: ${{ secrets.SP_CLIENT_ID }}
          SP_CLIENT_SECRET: ${{ secrets.SP_CLIENT_SECRET }}
          TENANT_ID: ${{ secrets.TENANT_ID }}
          ENV_URL: ${{ secrets.ENV_URL }}
        run: |
          pac auth create --url $ENV_URL --clientId $SP_CLIENT_ID --clientSecret $SP_CLIENT_SECRET --tenant $TENANT_ID

      - name: Download artifact (managed solution)
        run: |
          # ensure ./artifacts/MySolution_managed.zip exists
          ls -la ./artifacts

      - name: Import managed solution
        run: |
          pac solution import --path ./artifacts/MySolution_managed.zip --wait

      - name: Create connections (custom connector example)
        env:
          GRAPH_CLIENT_ID: ${{ secrets.GRAPH_CLIENT_ID }}
          GRAPH_CLIENT_SECRET: ${{ secrets.GRAPH_CLIENT_SECRET }}
        run: |
          # Use REST or pac to create connection for custom connector
          # Example: call a script that uses Dataverse Web API to create connection record
          ./scripts/create-connections.sh

      - name: Map connection references
        run: |
          ./scripts/map-connection-references.sh --solution MySolution

      - name: Set environment variables
        run: |
          pac solution set-environmentvariable --name GraphClientId --value "${{ secrets.GRAPH_CLIENT_ID }}"
          pac solution set-environmentvariable --name GraphClientSecret --value "${{ secrets.GRAPH_CLIENT_SECRET }}"

      - name: Publish and enable flows
        run: |
          pac org publish --all
          ./scripts/enable-flows.sh

      - name: Smoke test
        run: |
          ./scripts/smoke-test-flow.sh
```

**Note:** Replace `./scripts/*` with scripts that call the Dataverse Web API or `pac` commands to create connections, map references, enable flows, and run tests.

---

### Troubleshooting checklist (common failures)

- **Flow still disabled after import** → connection references not mapped or connection authentication failed. Check connection status in Power Platform maker portal.
- **Custom connector returns 401** → Graph app not consented or client id/secret wrong; verify admin consent and secret validity.
- **Solution import errors** → dependency or version mismatch; check solution dependencies and import logs.
- **`pac` command missing features** → update `pac` CLI to latest; some commands vary by version.

---

### Concrete next steps for you (recommended)

1. **Create Azure AD app** for Graph (if not done) and grant `Planner` Graph permissions; store client id/secret in GitHub Secrets.  
2. **Add a pipeline step** (or script) that creates the custom connector connection using the Graph client id/secret (Dataverse Connections API).  
3. **Add a script** to map connection references after import (use `pac` if available or Dataverse Web API).  
4. **Add a step** to enable flows and run a smoke test.  
5. **Run pipeline in a sandbox** and iterate until flows run successfully.

---

If you want, I can:

- **Generate the exact scripts** (`create-connections.sh`, `map-connection-references.sh`, `enable-flows.sh`) that call the Dataverse Web API and `pac` (tell me whether you prefer PowerShell or Bash), or  
- **Produce a complete GitHub Actions YAML** with those scripts embedded and placeholders for your secrets and IDs.
