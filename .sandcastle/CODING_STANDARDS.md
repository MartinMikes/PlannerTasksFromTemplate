# Coding Standards

These standards define the review bar for this repository's Power Platform
assets. They apply to solution source under `src/CampanulaPlannerFlows`,
deployment automation, supporting documentation, and any custom connector
artifacts committed to the repo.

## Scope And Source Of Truth

- Treat `src/CampanulaPlannerFlows` as the only deployable solution source.
- Treat `archive/` and `exported/` as reference artifacts unless a document
     explicitly promotes a file to production truth.
- Keep production changes solution-aware. Do not introduce portal-only changes
     that cannot be packed, reviewed, and redeployed from source control.
- Keep custom connectors, connection references, environment variables, and
     workflows inside the same reviewed ALM boundary when they ship together.

## Naming And Authoring Style

- Follow `docs/agents/power-automate.md` for Power Automate naming
     conventions.
- Prefer ASCII-only authored action and variable names.
- Prefer PascalCase for Power Automate action names, variable names, and
     Compose-style intermediate values when the platform allows it.
- Preserve platform-generated identifiers and serialized shapes when renaming
     would cause invalid exports or needless diff churn.
- Keep workbook, table, column, connector operation, and environment-variable
     names stable once published; rename only with a coordinated source,
     deployment, and documentation update.
- Custom connector `operationId` values must be unique, stable, and descriptive.
- User-facing custom connector metadata must be clear and consistent:
     `summary` in sentence case, `x-ms-summary` in title case, and descriptions in
     sentence case.

## Solution Ownership And ALM

- Build and edit production flows as solution-aware flows, not standalone cloud
     flows.
- Keep the publisher prefix and solution identity stable after components exist.
- Commit unpacked solution source only. Do not commit ad hoc packed ZIPs as the
     authoritative source.
- Every releasable change must remain packable with Power Platform CLI from the
     checked-in source.
- Use managed solution artifacts for downstream deployment. Treat unmanaged
     solutions as development-time state only.
- Update solution version intentionally for releasable changes.

## Configuration, Connections, And Secrets

- Do not hardcode environment-specific IDs, URLs, recipients, or tenant values
     into workflow logic when an environment variable or deployment setting can
     carry them.
- Model deploy-time configuration as solution environment variables.
- Model authenticated dependencies as connection references, not embedded
     credentials.
- Keep connection ownership explicit in documentation and deployment notes.
- Never commit live secrets, signed-in connection material, or tenant-specific
     credential exports.
- Placeholder values that CI replaces at pack time must remain placeholders in
     source control.

## Flow Design

- Design triggers intentionally. Document why the trigger type fits the desired
     delivery behavior and replay characteristics.
- Use trigger conditions where they can prevent unnecessary runs.
- Leave trigger concurrency at the default unless a specific concurrency need is
     documented and the race implications are understood.
- Keep loops sequential or explicitly bounded when actions mutate shared state
     or when connector throttling makes parallelism unsafe.
- Require an explicit retry-safety decision for every external create or update
     action. Non-idempotent operations must not rely on blind automatic retries.
- Prefer small, named intermediate actions over deeply nested expressions when
     it improves reviewability or avoids expression-limit risk.
- Keep flows below platform limits for action count, nesting depth, variable
     count, and expression size.
- If a flow approaches platform limits, split the design into smaller flows or
     child flows instead of compressing more logic into one definition.

## Error Handling And Operational Safety

- Failure paths must be intentional. Do not allow silent termination for
     business-critical runs.
- Operator-facing notifications must include enough context to identify the
     failing run and any partial external side effects.
- Where a flow can create irreversible external artifacts, review whether the
     action is safe to retry, safe to resume manually, or must fail fast.
- Manual recovery steps must be documented when the platform cannot guarantee
     idempotent replay.

## Data Contracts

- Treat workbook sheet names, table names, column names, and solution component
     names as versioned contracts.
- Keep technical identifiers in English when automation depends on them,
     even if user-facing labels are localized.
- Validate required external data structures before creating irreversible
     Planner or Graph side effects when technically possible.
- Do not weaken documented data constraints without updating the relevant docs,
     acceptance rules, and deployment guidance.

## Custom Connectors

- Treat the custom connector as part of the production contract, not as an
     incidental helper.
- Keep custom connectors solution-aware before export and deployment.
- Prefer standard authentication approaches supported by the platform; use
     Microsoft Entra ID delegated OAuth where the connector contract requires it.
- Keep OAuth redirect URI, scopes, and connection parameter definitions aligned
     with current Microsoft guidance.
- Keep imported connector definitions compatible with supported Power Platform
     OpenAPI requirements.
- Review OpenAPI extensions deliberately, especially trigger metadata,
     visibility, dynamic values, notification content, and URL-encoding behavior.
- Use policy templates only when they solve a concrete runtime or ALM need, and
     document the reason when policies influence request or response behavior.
- Validate connector source against first-party rules for operation naming,
     schemas, security definitions, and dynamic references before release.

## Documentation And Review Gates

- Production behavior claims in `README.md`, `docs/`, and deployment guidance
     must match the checked-in solution source.
- Update documentation in the same change whenever behavior, configuration, or
     deployment expectations change.
- Reuse `docs/research/` for standards or platform notes grounded in first-party
     sources.
- Keep `docs/agents/power-automate.md` aligned with repository naming and
     authoring conventions when they evolve.
- Releasable Power Platform changes should pass Flow Checker, remain packable
     from source, and satisfy Solution Checker or an equivalent first-party
     solution validation step.

## Security And Governance

- Apply least privilege to connector permissions, app registrations, and shared
     identities.
- Do not widen Microsoft Graph or Power Platform permissions without an
     implementation need and an accompanying documentation update.
- Assume target-environment DLP policy, licensing, and connector sharing rules
     are part of the deployment contract.
- Keep privileged environment details out of docs unless they are necessary for
     deployment and safe to publish in the repository.

## Change Review Heuristics

- Reject changes that improve portal behavior locally but break packability,
     importability, or source-controlled review.
- Reject changes that introduce hardcoded environment data where environment
     variables or deployment settings should be used.
- Reject changes that add custom connector surface area without corresponding
     OpenAPI, policy, auth, and documentation review.
- Reject changes where docs describe implemented behavior that the production
     solution source still does not perform.
