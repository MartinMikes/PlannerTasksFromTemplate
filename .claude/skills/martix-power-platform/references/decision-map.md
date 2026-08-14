# Power Platform decision map

| User need | Decision | Read next |
| --- | --- | --- |
| A service event should start a flow | Automated flow plus a connector trigger; choose webhook or polling from API capabilities | [Triggers and runtime](../rules/triggers-runtime.md) |
| A user or app should request work | Instant flow; expose a stable action and explicit inputs | [Foundation and flow types](../rules/foundation-flow-environments.md) |
| A recurrence should run work | Scheduled flow; bound pagination, concurrency, retries, and run duration | [Testing and limits](../rules/testing-troubleshooting-limits.md) |
| A REST API has no connector | Author a custom connector; prefer source-controlled Swagger 2.0 | [Connector authoring](../rules/connector-authoring.md) |
| Existing API documentation is OpenAPI 3.0 | Adapt and validate a Swagger 2.0 definition before import | [Connector authoring](../rules/connector-authoring.md) |
| A maker needs a dropdown | Dynamic list/value extension backed by a design-time operation | [OpenAPI extensions](../rules/openapi-extensions.md) |
| A maker needs variable fields | Dynamic schema/properties extension backed by JSON Schema | [OpenAPI extensions](../rules/openapi-extensions.md) |
| The API needs a header or route rewrite | Use a narrow policy template | [Policies and custom code](../rules/policies-custom-code.md) |
| The API needs a transformation no policy can express | Use `ScriptBase` custom code after schema and policy review | [Policies and custom code](../rules/policies-custom-code.md) |
| A flow returns the wrong number of iterations | Inspect response schema, array/object shape, Split On, and generated `Apply to each` | [Testing and limits](../rules/testing-troubleshooting-limits.md) |
| The connector moves across environments | Package definition and references in a solution; rebind target connections and values | [Solutions and ALM](../rules/solutions-alm-versioning.md) |
| A published operation must change incompatibly | Add a new operation/revision, migrate consumers, then deprecate the old one | [Solutions and ALM](../rules/solutions-alm-versioning.md) |
| The connector is shared only inside a tenant | Share with the smallest user/group permission and test dependent resources | [Sharing and certification](../rules/sharing-certification.md) |
| The connector should be public | Prepare certification files, tests, support, publisher evidence, and production host | [Sharing and certification](../rules/sharing-certification.md) |
| The request is generic REST or ASP.NET Core | Do not route here by default; use general API or .NET guidance | [Skill boundaries](../SKILL.md#boundaries-and-handoffs) |

## Required discovery fields

Before a mutation or deployment, record:

- target product and environment;
- region, Dataverse, maker/admin role, and license;
- DLP, gateway, VNet, and endpoint reachability;
- API host, auth grant, scopes/audience, pagination, idempotency, and limits;
- solution status, connection references, environment-specific values, and
  dependent flows/apps;
- testing account, raw-output policy, rollback strategy, and monitoring.
