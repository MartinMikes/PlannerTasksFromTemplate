---
description: 'Maintainer and companion guide for the martix-power-platform standalone skill package'
---

# MartiX Power Platform companion guide

`martix-power-platform` is a standalone, source-backed router for Power
Platform environments, Power Automate cloud flows, and custom connectors. Keep
the entrypoint short and put durable domain detail in the grouped rules and
reference maps.

## Maintainer contract

- Keep [SKILL.md](./SKILL.md) activation-oriented and under 200 lines.
- Keep each rule focused on one decision boundary and use the shared section
  order: `Purpose`, `Default guidance`, `Avoid`, `Review checklist`, `Related
  files`, and `Source anchors`.
- Put dated or conflicting product values in
  [references/volatile-values.md](./references/volatile-values.md), not in
  multiple rule files.
- Keep source links tied to the Microsoft Learn page that owns the claim.
- Keep OpenAPI examples secret-free and valid as Swagger 2.0 unless a file is
  explicitly documenting a conversion boundary.
- Update `metadata.json`, `assets/taxonomy.json`,
  `assets/section-order.json`, and `evals/evals.json` when routes or coverage
  change.

## Review workflow

1. Identify the target product: Power Automate, Power Apps, Logic Apps, or
   Copilot Studio.
2. Resolve the environment, region, Dataverse state, maker/admin role, premium
   license, DLP policy, gateway/VNet reachability, and solution status.
3. Record the API host, authentication grant, operation contract, pagination,
   idempotency, webhook lifecycle, and rate limits.
4. Prefer codeless OpenAPI and exact schemas. Add extensions, policies, or code
   only for a demonstrated requirement.
5. Test the connector operation independently, then test the complete flow or
   app. Preserve raw status, headers, body, correlation identifiers, and safe
   error details.
6. Validate in an unmanaged solution, bind connection references in the target,
   and version breaking operations instead of mutating a published contract.

## Safety and uncertainty

- Never ask a user to paste a client secret, API key, access token, or password
  into source files, logs, or chat.
- Never present a plan-dependent limit or preview feature as a universal
  guarantee.
- When Microsoft Learn pages conflict, state the conflict, cite both pages, and
  recommend a current-tenant test rather than silently selecting a value.
- Do not claim that custom-code `Context.SendAsync` can reach a private VNet
  endpoint; the current documentation says it uses a public endpoint.
- Do not claim that a Power Apps app can directly host a connector trigger; use
  a flow for event-driven behavior.

## Handoffs

- **`martix-dotnet-csharp`:** General C# or .NET rather than connector
  custom code.
- **Azure skills:** Azure identity, networking, Functions, App Service, or APIM
  provisioning rather than connector behavior.
- **`martix-powershell`:** PowerShell cmdlet or advanced-function authoring
  rather than a `paconn` or OAuth helper.
- **Power Apps / Copilot Studio guidance:** The connector is only an
  integration boundary and the requested behavior is app, agent, grounding, or
  formula design.

## Validation

Run package Markdown checks and repository validation after changes:

```powershell
powershell -ExecutionPolicy Bypass `
  -File .\plugins\martix-markdown-automation\hooks\markdown-check.ps1 `
  -CheckOnly -Path <changed-markdown-files>

powershell -ExecutionPolicy Bypass -File .\scripts\validate-repository.ps1
```
