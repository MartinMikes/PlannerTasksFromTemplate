# Power Platform coding standards research for this repository

Research date: 2026-07-17

## Scope

This note gathers first-party Microsoft guidance that should shape the
repository standards for Power Platform solution source, Power Automate cloud
flows, the Microsoft Graph custom connector, and ALM packaging. It is written
for the assets under `src/CampanulaPlannerFlows`, the reference exports under
`exported/`, and the agent guidance in `docs/agents/power-automate.md`.[^repo-pa]

The goal is not to restate every platform feature. The goal is to identify the
standards this repository should enforce in `.sandcastle/CODING_STANDARDS.md`
so that reviewed changes stay portable, solution-aware, and safe to deploy.[^solution-aware][^solution-concepts]

## Recommended sections for the repository standards

The standards document for this repo should include these sections:

1. Solution-aware development and solution ownership boundaries.[^solution-aware][^create-solution][^solution-concepts]
2. Naming and versioning for solutions, flows, connection references,
   environment variables, and custom connector operations.[^conn-ref][^env-vars-guidance][^solution-concepts][^validator]
3. Environment variables, connection references, and connection ownership for
   deployment.[^env-vars][^env-vars-guidance][^conn-ref][^deploy-settings]
4. Trigger and action design, including trigger conditions, concurrency, and
   flow-size limits.[^trigger-opt][^limits]
5. Retry, idempotency, and failure-handling rules.[^limits][^trigger-opt]
6. Expressions and data-shaping rules for maintainable exported JSON.[^limits][^export-solution]
7. Approval and notification conventions.[^limits][^env-vars]
8. Custom connector design and lifecycle rules.[^custom-overview][^define-openapi][^custom-solutions]
9. OpenAPI, policy template, and connection-parameter conventions for the
   custom connector.[^define-openapi][^openapi-ext][^policy-templates][^conn-params][^validator]
10. ALM, export/import, pack/unpack, and build-artifact conventions.[^solution-concepts][^export-solution][^import-solution][^pac-solution]
11. Documentation, testing, and review gates.[^flow-checker][^export-solution][^pac-solution]
12. Security and governance constraints, especially DLP, connection sharing,
    and secret handling.[^dlp][^conn-ref][^env-vars-guidance][^custom-overview]

## Findings by standards area

### Solution-aware development

- Cloud flows that must move across environments should be created inside a
  Dataverse solution. Microsoft calls these solution-aware flows, and the
  primary portability mechanism is moving the solution and its referenced
  components together.[^solution-aware][^create-solution]
- Solutions are the Power Platform ALM boundary. Development happens in
  unmanaged solutions, while downstream environments should receive managed
  solution exports that are treated as build artifacts.[^solution-concepts]
- A custom publisher should be established and kept stable early. Microsoft
  warns that publisher-prefix choices should be made before creating metadata,
  and that component publishers cannot be changed later across publishers.[^solution-concepts]

**Repo standard implication:** all production Power Automate assets and the
custom connector should remain solution-aware, committed as unpacked solution
source, and reviewed as part of one coherent solution boundary rather than as
ad hoc portal changes.[^solution-aware][^solution-concepts][^custom-solutions]

### Naming and versioning

- Microsoft explicitly recommends unique, useful connection-reference display
  names so makers can differentiate them by name alone.[^conn-ref]
- Microsoft recommends consistent naming conventions and descriptions for
  environment variables so their purpose and usage remain clear across
  environments.[^env-vars-guidance]
- Solution version is a first-class ALM field during export/import, and the
  CLI supports explicit version updates through `pac solution version` and
  `pac solution online-version`.[^export-solution][^pac-solution]
- Custom connector operation identifiers must be unique and should avoid
  sanitized-name mismatches; Microsoft validator rules explicitly flag missing,
  duplicate, ambiguous, and sanitized `operationId` values.[^validator]
- OpenAPI operation `summary` should use sentence case, parameter and field
  `x-ms-summary` should use title case, and `description` should use sentence
  case for user-facing clarity in the maker UX.[^openapi-ext]

**Repo standard implication:** define one local naming scheme for flows,
actions, variables, connection references, environment variables, and custom
connector operations. The official docs do not prescribe the exact repo naming
style, but they do require uniqueness, clarity, stable publisher prefixes, and
valid operation identifiers.[^conn-ref][^env-vars-guidance][^solution-concepts][^validator]

### Environment variables and connections

- Environment variables exist specifically to avoid hardcoded values, separate
  configuration from logic, and support dev/test/prod differences without
  editing the flow definition itself.[^env-vars][^env-vars-guidance]
- Power Automate now supports environment variables as solution components with
  data types including Text, JSON, Data source, and Secret, plus default and
  current values.[^env-vars]
- Connection references are solution components that bind solution-aware flows
  to connections during import. The connection itself is a stored credential;
  the connection reference is not the credential.[^conn-ref]
- The user who turns on a flow must own or have permission to use all
  underlying connections, and import-time validation checks whether mapped
  connections will be usable by the connection-reference owner.[^conn-ref][^deploy-settings]
- Automated deployments should use deployment settings JSON to pre-populate
  connection references and environment variables, instead of relying on manual
  import-time prompts.[^deploy-settings][^pac-solution]

**Repo standard implication:** production values such as form IDs, SharePoint
  locations, Planner group or container IDs, notification recipients, and
  connector-specific endpoints should be modeled as environment variables, while
  authenticated access should be modeled through connection references mapped by
  deployment settings files.[^env-vars][^deploy-settings][^conn-ref]

### Trigger and action design

- Trigger type matters. Microsoft documents different off/on behavior for
  polling triggers and webhook triggers, which affects whether old events are
  replayed or missed after downtime.[^trigger-opt]
- Trigger conditions should be used when possible so the flow runs only when
  the business condition is actually met; Microsoft positions this as a direct
  efficiency improvement.[^trigger-opt]
- Trigger concurrency is off by default, can be useful, but is irreversible on
  that trigger, and Microsoft recommends leaving it at the default unless there
  is a concrete need.[^trigger-opt][^limits]
- Cloud flows have design limits, including 500 actions per workflow, eight
  levels of nesting, 250 variables, 80 characters for action or trigger names,
  and 8,192 characters per expression.[^limits]

**Repo standard implication:** standards should require explicit rationale for
  trigger type, trigger conditions, and any concurrency setting, and should
  favor child-flow or decomposition strategies before a flow approaches
  definition limits.[^trigger-opt][^limits]

### Retry, idempotency, and error handling

- Power Automate applies default retry policies to connector and HTTP actions,
  with more aggressive retry behavior on higher performance profiles. Retries,
  failures, and pagination all count toward request usage.[^limits]
- Microsoft notes that trigger concurrency can cause dirty reads and other
  consistency problems when flows read and then update shared state.[^trigger-opt]
- Flows with continuously failing triggers or actions can be turned off after
  14 days, and long-running runs including pending steps can last at most
  30 days.[^limits]

**Repo standard implication:** every external action in this repo should be
  classified as either safe to retry or unsafe to retry, with explicit retry
  configuration for create operations that can duplicate Planner artifacts or
  Graph side effects. Error paths should produce actionable diagnostics and
  operator-facing remediation steps, not silent termination.[^limits][^trigger-opt]

### Expressions and data shaping

- Exported solution cloud flows are stored as multiline formatted JSON, which
  Microsoft changed specifically to improve readability and revision tracking in
  source control.[^export-solution]
- Expression size and evaluation limits are real platform constraints, with
  8,192 characters per expression and 131,072 characters for expression
  evaluation.[^limits]

**Repo standard implication:** standards should prefer named Compose or other
  intermediate actions over deeply nested one-line expressions, because the
  repository reviews source-controlled JSON rather than portal screenshots. This
  is not a direct Microsoft wording requirement, but it is the pragmatic design
  response to the documented expression limits and the multiline JSON export
  model.[^limits][^export-solution]

### Approvals and notifications

- Notification routing values are a textbook environment-variable use case in
  Microsoft guidance; e-mail recipients and similar routing endpoints should be
  externalized from flow logic.[^env-vars]
- Any future approval step is still bound by the same 30-day flow run duration
  and pending-step timeout limits that Microsoft documents for cloud flows.[^limits]

**Repo standard implication:** notification recipients, escalation targets, and
  approval endpoints should be environment variables. If approvals are added,
  the standards should require explicit timeout expectations, owner rules, and
  manual recovery behavior for overdue runs.[^env-vars][^limits]

### Custom connector design

- Microsoft defines a custom connector as a wrapper around a REST API or SOAP
  API that can expose triggers and actions to Logic Apps, Power Automate, Power
  Apps, and Copilot Studio.[^custom-overview]
- Microsoft recommends standard authentication methods for custom connectors and
  calls out Microsoft Entra ID as the recommended approach where possible.[^custom-overview]
- OAuth custom connectors must use the newer per-connector redirect URI model;
  Microsoft explicitly warns older connectors must be updated or new
  connections stop working.[^custom-overview]
- Custom connectors used with connection references must be solution-aware
  before export, which means they need to be created in or added to a solution
  before packaging.[^custom-solutions]

**Repo standard implication:** the Microsoft Graph connector in this repo
  should be treated as part of the production solution contract, with explicit
  versioning, source review, OAuth configuration review, and solution-aware
  packaging rules.[^custom-overview][^custom-solutions]

### OpenAPI, policy, and connection-parameter conventions

- Power Platform custom connectors require OpenAPI 2.0 for imported OpenAPI
  definitions; OpenAPI 3.0 is not supported in this path.[^define-openapi]
- The OpenAPI definition must be less than 1 MB for import, and the selected
  top security definition governs custom connector creation behavior.[^define-openapi]
- The connector definition UX and OpenAPI extensions allow user-facing polish
  and behavior control through `summary`, `x-ms-summary`, `description`,
  `x-ms-visibility`, `x-ms-api-annotation`, `x-ms-trigger`,
  `x-ms-notification-content`, `x-ms-url-encoding`, `x-ms-dynamic-values`,
  `x-ms-dynamic-list`, `x-ms-dynamic-schema`, and `x-ms-dynamic-properties`.[^openapi-ext]
- Policy templates are first-party runtime transformation and routing features
  for custom connectors, and Microsoft now allows environment variables inside
  custom-connector policies for ALM scenarios.[^policy-templates]
- Supported connection-parameter authentication types are No authentication,
  Basic, API key, and OAuth 2.0. Microsoft explicitly notes that client
  credentials grant type is not supported by custom connectors.[^conn-params]
- Microsoft’s Swagger validator rules are strict about `operationId`
  uniqueness, path validity, notification metadata, schema depth, MIME types,
  encoding, dynamic-value references, and security-definition correctness.[^validator]

**Repo standard implication:** connector source review in this repo should
  validate OpenAPI version, operation naming, user-facing metadata, trigger and
  webhook annotations, path encoding, dynamic-value references, and policy use
  before any export is treated as releasable.[^define-openapi][^openapi-ext][^validator][^policy-templates]

### ALM, export, and packaging

- Solution-aware flows must be exported and imported as part of a solution, not
  from the standalone flow details page.[^export-solution][^import-solution]
- Microsoft recommends checking for issues and publishing changes before export,
  and notes that only published components are exported from an unmanaged
  solution.[^export-solution]
- Exported workflow JSON is multiline and the downloaded ZIP contains workflow
  JSON under the `Workflows` folder, which is relevant to source review and PR
  diffs.[^export-solution]
- Import can turn flows off and on again, flow ownership after import belongs to
  the importing user, and the flow turns on automatically only when connection
  references are mapped to usable connections.[^import-solution][^conn-ref]
- Power Platform CLI provides first-party commands for `pack`, `unpack`,
  `clone`, `sync`, `create-settings`, `check`, `import`, `export`, and
  `version`, and documents the difference between `clone` and `export` based
  on whether you are adding components or only modifying existing solution
  content.[^pac-solution]
- `pac solution pack` and `pac solution unpack` support both the legacy XML
  format and the newer YAML source-control format. For legacy XML, the expected
  structure includes `Other\Solution.xml` and `Other\Customizations.xml`.[^pac-solution]

**Repo standard implication:** standards should require packability from source
  control, declare whether this repo remains on legacy XML solution source or
  moves to YAML Git-integration layout later, and require deployment settings,
  managed build artifacts, and version bumps as part of release discipline.[^pac-solution][^solution-concepts][^deploy-settings]

### Documentation, testing, and review

- Microsoft recommends running Flow checker during design, fixing reported
  errors and warnings, and then testing the flow to ensure it works as
  expected.[^flow-checker]
- During solution export, Microsoft surfaces **Check for issues**, which runs
  Solution Checker to detect performance and stability issues before packaging.[^export-solution]
- The CLI exposes `pac solution check` for automated solution analysis in CI,
  which makes it suitable as a repo review gate rather than a manual-only
  portal activity.[^pac-solution]

**Repo standard implication:** this repository should require three review
  gates for production changes: Flow checker clean in the designer, successful
  pack/import-related validation in automation, and Solution Checker or
  `pac solution check` for releasable branches.[^flow-checker][^export-solution][^pac-solution]

### Security and governance

- Data policies are the official guardrail for connector governance, and policy
  changes affect both design-time and runtime behavior. Blocked connectors or
  actions can suspend resources and disable connections.[^dlp]
- Custom connectors deserve extra scrutiny under data policies because they are
  flexible but can compromise data security if not governed carefully.[^dlp]
- Microsoft explicitly advises against storing highly sensitive data directly in
  environment variables and points maintainers toward secure mechanisms such as
  Azure Key Vault for sensitive configuration.[^env-vars-guidance]
- Connection sharing and ownership are part of the security model. The user who
  enables a flow needs usable rights to all connections, and OAuth connections
  can only be explicitly shared with a user representing a service principal.[^conn-ref]

**Repo standard implication:** standards should require DLP awareness for every
  new connector, prohibit secrets in ordinary text environment variables when a
  stronger store is available, and document connection owners plus activation
  procedures for solution imports.[^dlp][^env-vars-guidance][^conn-ref]

## Priority recommendations for this repository

These are the five highest-value standards to add first to
`.sandcastle/CODING_STANDARDS.md` for this codebase:

1. **Require solution-aware assets only.** Production flows and the custom
   connector must be created, edited, exported, and imported through the
   `CampanulaPlannerFlows` solution boundary, not as standalone portal assets.[^solution-aware][^export-solution]
2. **Ban hardcoded environment-specific values in flow JSON.** SharePoint
   locations, Form identifiers, Planner targets, e-mail recipients, and similar
   deployment values should be environment variables mapped through deployment
   settings JSON.[^env-vars][^deploy-settings]
3. **Treat connection references as deployable infrastructure.** Every flow
   change should preserve connection-reference integrity, and deployment docs or
   automation must state who owns the underlying connections and who is allowed
   to enable imported flows.[^conn-ref][^import-solution]
4. **Classify every external action by retry safety.** Default retries are not
   neutral; they consume request budget and can multiply side effects. Standards
   should require explicit retry decisions for Graph, Planner, and other
   create/update operations.[^limits]
5. **Gate releases on first-party validation.** Releasable changes should pass
   Flow checker, solution packability, and Solution Checker or `pac solution
   check` before managed export/import is treated as production-ready.[^flow-checker][^export-solution][^pac-solution]

## Sources

[^repo-pa]: `docs/agents/power-automate.md` in this repository.
[^solution-aware]: <https://learn.microsoft.com/en-us/power-automate/overview-solution-flows>
[^create-solution]: <https://learn.microsoft.com/en-us/power-automate/create-flow-solution>
[^solution-concepts]: <https://learn.microsoft.com/en-us/power-platform/alm/solution-concepts-alm>
[^conn-ref]: <https://learn.microsoft.com/en-us/power-apps/maker/data-platform/create-connection-reference>
[^env-vars]: <https://learn.microsoft.com/en-us/power-automate/environment-variables>
[^env-vars-guidance]: <https://learn.microsoft.com/en-us/power-automate/guidance/coding-guidelines/use-environment-variables>
[^deploy-settings]: <https://learn.microsoft.com/en-us/power-platform/alm/conn-ref-env-variables-build-tools>
[^trigger-opt]: <https://learn.microsoft.com/en-us/power-automate/guidance/coding-guidelines/optimize-power-automate-triggers>
[^limits]: <https://learn.microsoft.com/en-us/power-automate/limits-and-config>
[^custom-overview]: <https://learn.microsoft.com/en-us/connectors/custom-connectors/>
[^custom-solutions]: <https://learn.microsoft.com/en-us/connectors/custom-connectors/customconnectorssolutions>
[^define-openapi]: <https://learn.microsoft.com/en-us/connectors/custom-connectors/define-openapi-definition>
[^openapi-ext]: <https://learn.microsoft.com/en-us/connectors/custom-connectors/openapi-extensions>
[^policy-templates]: <https://learn.microsoft.com/en-us/connectors/custom-connectors/policy-templates>
[^conn-params]: <https://learn.microsoft.com/en-us/connectors/custom-connectors/connection-parameters>
[^validator]: <https://learn.microsoft.com/en-us/connectors/custom-connectors/certification-swagger-validator-rules>
[^export-solution]: <https://learn.microsoft.com/en-us/power-automate/export-flow-solution>
[^import-solution]: <https://learn.microsoft.com/en-us/power-automate/import-flow-solution>
[^pac-solution]: <https://learn.microsoft.com/en-us/power-platform/developer/cli/reference/solution>
[^flow-checker]: <https://learn.microsoft.com/en-us/power-automate/error-checker>
[^dlp]: <https://learn.microsoft.com/en-us/power-platform/admin/wp-data-loss-prevention>
