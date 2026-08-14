# Connector and flow testing, troubleshooting, and limits

## Purpose

Turn a plausible connector into evidence that works in the target environment,
and diagnose failures without confusing schema, authentication, capacity,
network, and flow-graph problems.

## Default guidance

Use two validation layers:

1. **Designer and operation test**: create or select a connection, refresh
   connections, select an operation, provide required inputs, run the test, and
   inspect status, headers, body, and raw outputs.
2. **Static and source validation**: validate Swagger, place the connector in an
   unmanaged solution, run Solution Checker, and compile custom code locally
   against the documented support types.

Use a dedicated nonproduction account and test both success and representative
failures: expired credentials, malformed payloads, authorization failure,
throttling, empty collections, wrong content type, retries, and cancellation.
When an operation returns an array, inspect the generated flow for unexpected
`Apply to each` behavior.

Useful Power Automate design guards from the current limits page include 500
actions per flow, eight nesting levels, 250 variables, 8,192-character
expressions, 30-day run duration and history retention, 120-second synchronous
request limits, bounded `Apply to each` items and concurrency, and plan-dependent
request quotas. Use [volatile-values.md](../references/volatile-values.md) when
the custom-connector FAQ and limits page disagree.

Diagnose by boundary:

- **Connection/auth failure:** Grant, redirect, audience, consent, secret
  rotation, and target connection.
- **401/403 from API:** Token audience/scopes, API ACL, and connector auth
  injection.
- **Wrong designer fields:** OpenAPI response schema, visibility, and dynamic
  schema/list.
- **Unexpected loop:** Array versus object response shape and Split On.
- **Timeout:** Synchronous limit, connector/API latency, and custom-code
  timeout conflict.
- **429/throttling:** Connector and API quotas, retry policy, pagination, and
  concurrency.
- **VNet/gateway failure:** Environment association, resave requirement,
  gateway support, and endpoint reachability.
- **Flow succeeds but data is wrong:** Raw inputs/outputs, policy order, code
  branch, and response mapping.

## Avoid

- Do not validate only a happy-path operation.
- Do not retry non-idempotent writes blindly.
- Do not quote a limit without its product, plan, page, and date.
- Do not inspect or publish secrets in raw run history.
- Do not treat a successful connector test as proof that a complete flow has
  correct looping, retry, DLP, or target-environment behavior.

## Review checklist

- [ ] Operation, connection, flow, and target-environment tests are distinct.
- [ ] Raw response schemas, arrays, errors, headers, and status codes are
      captured safely.
- [ ] Retries, pagination, concurrency, idempotency, and async work are bounded.
- [ ] Swagger validation, Solution Checker, and local custom-code compilation
      are planned.
- [ ] Quotas and documentation conflicts are cited and marked volatile.

## Related files

- [Foundation and flow types](./foundation-flow-environments.md)
- [Policies and custom code](./policies-custom-code.md)
- [Flow contract checklist](../references/flow-contract-checklist.md)
- [Volatile values](../references/volatile-values.md)

## Source anchors

- [Validate a custom connector](https://learn.microsoft.com/en-us/connectors/custom-connectors/validate-custom-connector)
- [Swagger validator rules](https://learn.microsoft.com/en-us/connectors/custom-connectors/certification-swagger-validator-rules)
- [Use a custom connector in a flow](https://learn.microsoft.com/en-us/connectors/custom-connectors/use-custom-connector-flow)
- [Power Automate limits](https://learn.microsoft.com/en-us/power-automate/limits-and-config)
