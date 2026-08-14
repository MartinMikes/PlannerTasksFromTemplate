# MartiX Power Platform

`martix-power-platform` is the standalone-first MartiX skill for
Power Platform environments, Power Automate cloud flows, and custom connector
design. It is intentionally custom-connector heavy and uses progressive
disclosure: the router chooses a focused rule, and the rule points to the
smallest supporting reference.

## Package structure

| Path | Purpose |
| --- | --- |
| [SKILL.md](./SKILL.md) | Activation router and boundary rules |
| [AGENTS.md](./AGENTS.md) | Maintainer, safety, review, and handoff guidance |
| [rules/](./rules) | Nine grouped decision guides |
| [references/](./references) | Source map, decision map, checklists, and volatile facts |
| [templates/](./templates) | Connector planning and Swagger 2.0 scaffolds |
| [assets/](./assets) | Taxonomy and stable ordering data |
| [evals/evals.json](./evals/evals.json) | Canonical behavior and routing evals |
| [metadata.json](./metadata.json) | Registration and package inventory |

## Install

For the Copilot CLI marketplace:

```powershell
copilot plugin marketplace add MartiXDev/skills
copilot plugin install martix-power-platform@martix-skills
```

For a standalone skill install:

```powershell
npx skills add https://github.com/MartiXDev/skills --skill martix-power-platform
```

For local validation on Windows, use the absolute package path:

```powershell
npx skills add `
  C:\Git\MartiXDev\skills\skills\martix-power-platform `
  -a github-copilot -y
```

## Source and refresh policy

The package was derived from the dated research snapshot in
[`docs/martix/martix-power-platform`](../../docs/martix/martix-power-platform).
The [source index](./references/doc-source-index.md) retains the high-value
Microsoft Learn entry points and points to the complete processed inventory.

Microsoft Learn values are not immutable configuration. Recheck licensing,
request quotas, preview behavior, portal labels, custom-code timeout, Postman
import support, OAuth redirect guidance, environment-variable support, and
certification timelines before production advice.

## Validation

```powershell
powershell -ExecutionPolicy Bypass `
  -File .\plugins\martix-markdown-automation\hooks\markdown-check.ps1 `
  -CheckOnly -Path .\skills\martix-power-platform\SKILL.md,`
    .\skills\martix-power-platform\README.md,`
    .\skills\martix-power-platform\AGENTS.md

powershell -ExecutionPolicy Bypass -File .\scripts\validate-repository.ps1
```

Marketplace metadata is maintained in
[marketplace.json](../../.github/plugin/marketplace.json) and stays aligned with
[plugin.json](./plugin.json) and [metadata.json](./metadata.json).
