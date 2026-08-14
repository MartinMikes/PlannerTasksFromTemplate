# Connector-backed flow contract checklist

Use this checklist to turn a connector request into an implementation and
verification plan. It is intentionally product-agnostic within Power Platform;
fill the target-specific values before acting.

## Boundary

- [ ] Product: Power Automate / Power Apps / Logic Apps / Copilot Studio
- [ ] Environment, region, Dataverse, role, license, and solution
- [ ] DLP policy, gateway/VNet, public/private endpoint, and data geography
- [ ] API owner, support contact, nonproduction endpoint, and test account

## API and connector definition

- [ ] Stable HTTPS host and base path
- [ ] Swagger 2.0 definition or documented conversion from another format
- [ ] Stable operation IDs, summaries, parameters, MIME types, and responses
- [ ] Exact object/array/nullability schemas and reusable definitions
- [ ] Pagination, rate limits, idempotency, correlation IDs, and error contract
- [ ] Auth grant, scopes/audience, connection parameters, and redirect URI
- [ ] Required `x-ms-*` extensions, dynamic values/schema, test connection, and
      chunking decisions

## Runtime

- [ ] Automated, instant, or scheduled flow chosen from the event model
- [ ] Webhook registration/callback/delete or polling state/filter contract
- [ ] Duplicate, replay, ordering, Split On, concurrency, and retry behavior
- [ ] Policy versus custom-code decision and policy execution order
- [ ] Async pattern for work beyond synchronous request limits

## Validation

- [ ] Swagger or `paconn validate`
- [ ] Designer operation test with a dedicated nonproduction connection
- [ ] Success, empty, malformed, unauthorized, expired, throttled, and timeout
      cases
- [ ] Raw status, headers, body, and safe correlation details inspected
- [ ] Generated flow checked for unexpected loops or dynamic fields
- [ ] Solution Checker and local custom-code compilation where applicable

## ALM and operation

- [ ] Unmanaged development solution and managed deployment artifact
- [ ] Connector, connection reference, target connection, values, and dependent
      flow import order
- [ ] Environment-specific values and secret handling
- [ ] Breaking-change revision and migration plan
- [ ] Sharing, monitoring, run-history retention, rollback, and support plan
