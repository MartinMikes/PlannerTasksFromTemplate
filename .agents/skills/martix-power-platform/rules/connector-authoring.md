# Custom connector authoring and API contracts

## Purpose

Turn a stable REST API into a discoverable Power Platform connector without
hiding contract, authentication, or portability decisions in designer clicks.

## Default guidance

- Confirm a stable HTTPS host, base path, operation IDs, parameter names,
  explicit success and error responses, exact schemas, pagination, idempotency,
  rate limits, and a nonproduction endpoint.
- Choose the smallest authoring path:
  - blank designer for a small, exploratory connector;
  - OpenAPI import for a source-controlled contract;
  - Postman only after checking the current supported collection format;
  - `paconn` for repeatable source-controlled create, update, download, and
    validation operations.
- Treat custom connector OpenAPI as Swagger 2.0. Include `swagger`, `info`,
  `host`, `schemes`, `consumes`, `produces`, `paths`, and reusable definitions.
  Keep the imported definition below the documented 1 MB boundary.
- Use stable, unique, PascalCase `operationId` values, human-readable summaries,
  reusable `$ref` schemas, explicit MIME types, and one clear body shape.
- Keep the CLI artifacts together: `apiDefinition.swagger.json`,
  `apiProperties.json`, optional `icon.png`, optional `script.csx`, and
  optional `settings.json`.
- Typical CLI flow:

  ```text
  paconn login
  paconn download
  paconn validate --api-def apiDefinition.swagger.json
  paconn create --api-prop apiProperties.json --api-def apiDefinition.swagger.json
  paconn update --api-prop apiProperties.json --api-def apiDefinition.swagger.json
  ```

## Avoid

- Do not import OpenAPI 3.0 and silently assume semantic compatibility. Adapt
  to Swagger 2.0 and validate the resulting connector definition.
- Do not hard-code one Postman collection version; current Microsoft pages
  disagree. Verify the target portal and CLI behavior.
- Do not put secrets, tokens, or environment-specific credentials in the
  definition or source-controlled `apiProperties.json`.
- Do not start with custom code when a corrected schema or small policy solves
  the problem.

## Review checklist

- [ ] Backend host, scheme, base path, auth model, and test endpoint are known.
- [ ] Every operation has a stable ID, correct method/path, parameters, success
      response, error behavior, and exact schemas.
- [ ] Definition size and schema/operation counts are checked against current
      documentation.
- [ ] OpenAPI 2.0 conversion and Postman format assumptions are explicit.
- [ ] A nonproduction `paconn validate` or equivalent designer validation is
      planned before update or sharing.

## Related files

- [Authentication and connections](./authentication-connections.md)
- [OpenAPI extensions](./openapi-extensions.md)
- [Connector plan template](../templates/connector-plan.template.md)
- [Swagger 2.0 template](../templates/api-definition.swagger.template.json)

## Source anchors

- [Custom connectors overview](https://learn.microsoft.com/en-us/connectors/custom-connectors/)
- [Create from scratch](https://learn.microsoft.com/en-us/connectors/custom-connectors/define-blank)
- [Create from an OpenAPI definition](https://learn.microsoft.com/en-us/connectors/custom-connectors/define-openapi-definition)
- [Coding standards](https://learn.microsoft.com/en-us/connectors/custom-connectors/coding-standards)
- [paconn CLI](https://learn.microsoft.com/en-us/connectors/custom-connectors/paconn-cli)
- [Custom connector FAQ](https://learn.microsoft.com/en-us/connectors/custom-connectors/faq)
