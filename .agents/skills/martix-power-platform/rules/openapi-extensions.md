# OpenAPI schemas and x-ms extensions

## Purpose

Make the connector contract usable in the designer and predictable at runtime.
`x-ms-*` metadata should improve maker experience or express a documented
capability, not compensate for an unclear API schema.

## Default guidance

- Keep the Swagger 2.0 base contract explicit: `host`, `schemes`, `paths`,
  parameters, responses, definitions, MIME types, and stable operation IDs.
- Use maker-facing metadata deliberately:

  | Extension | Use |
  | --- | --- |
  | `x-ms-summary` | Friendly parameter or property label |
  | `x-ms-visibility` | `important`, `advanced`, or `internal` presentation |
  | `x-ms-api-annotation` | Status, family, revision, and lifecycle metadata |
  | `x-ms-operation-context` | Operation context for trigger-style testing |
  | `x-ms-capabilities` | Test connection and chunk-transfer capabilities |
  | `x-ms-trigger` | `single` or `batch` trigger behavior |
  | `x-ms-trigger-hint` | Maker-facing trigger instructions |
  | `x-ms-notification-content` | Webhook notification schema |
  | `x-ms-notification-url` | Callback URL parameter |
  | `x-ms-url-encoding` | Path-parameter encoding choice |
  | `x-ms-dynamic-values` / `x-ms-dynamic-list` | Design-time dropdowns |
  | `x-ms-dynamic-schema` / `x-ms-dynamic-properties` | Design-time schema |

- Required parameters marked `internal` need a default because makers cannot
  enter them. Use `advanced` for optional complexity, not for required inputs.
- Dynamic values call another operation to return a collection and map value
  and title paths. Dynamic schema calls an operation that returns JSON Schema
  for fields. Validate dependency paths and return shapes at design time.
- Define a lightweight HTTP 200 test operation and reference it through
  `x-ms-capabilities.testConnection`. Enable chunk transfer only when the
  backend and flow action support it.

## Avoid

- Do not expose implementation-only fields that make Power Apps formulas or
  flow actions brittle.
- Do not use `internal` to hide a required value that has no default.
- Do not mix legacy and newer dynamic extensions without a compatibility reason.
- Do not infer runtime support from a designer label; validate the actual
  operation and generated flow shape.

## Review checklist

- [ ] Input and output schemas match real response bodies, including arrays and
      nullable or optional fields.
- [ ] Summary, visibility, operation status, revision, and trigger metadata are
      consistent.
- [ ] Dynamic lists and schemas identify operation, dependencies, collection,
      value, title, and returned schema paths.
- [ ] Test connection is lightweight, returns 200, and does not leak secrets.
- [ ] Chunking and URL-encoding behavior are tested where enabled.

## Related files

- [Connector authoring](./connector-authoring.md)
- [Triggers and runtime](./triggers-runtime.md)
- [Testing and limits](./testing-troubleshooting-limits.md)
- [Swagger 2.0 template](../templates/api-definition.swagger.template.json)

## Source anchors

- [OpenAPI extensions](https://learn.microsoft.com/en-us/connectors/custom-connectors/openapi-extensions)
- [Test connection](https://learn.microsoft.com/en-us/connectors/custom-connectors/test-connection)
- [Coding standards](https://learn.microsoft.com/en-us/connectors/custom-connectors/coding-standards)
- [Create custom connectors in solutions](https://learn.microsoft.com/en-us/connectors/custom-connectors/customconnectorssolutions)
