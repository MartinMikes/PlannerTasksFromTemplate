# Custom connector polling and webhook triggers

## Purpose

Select a trigger contract that matches the API's event semantics and avoids
duplicate work, orphaned subscriptions, or incorrect flow fan-out.

## Default guidance

- Connector triggers start Power Automate cloud flows and Logic Apps workflows.
  Power Apps does not directly host connector triggers; an app should invoke a
  flow when it needs event-driven behavior.
- A webhook trigger normally needs:
  1. registration `POST`;
  2. notification payload schema;
  3. deregistration `DELETE`;
  4. HTTP 201 on successful registration;
  5. a `Location` header identifying the subscription;
  6. a callback parameter marked with `x-ms-notification-url`;
  7. `x-ms-trigger: single` for one notification event.
- The service must authenticate and validate callbacks, tolerate duplicate
  notifications, and remove subscriptions when a flow or trigger is removed.
  Missing DELETE support or an unusable `Location` header can leave orphaned
  subscriptions.
- A polling trigger needs a retrieval operation, a state or filter input,
  newest-first results, a collection property, and an expression that extracts
  the next state. The connector runtime maintains state.
- Use a 202 response when there is no new data, with a retry interval or state as
  documented by the connector; return 200 with an object containing an array
  when records are available. Use `x-ms-trigger: batch` and Split On when each
  record should start separate processing.
- Treat training intervals as examples rather than an SLA. System scheduling
  varies by product, region, load, and plan.

## Avoid

- Do not model a webhook as polling just to avoid registration and deletion
  endpoints.
- Do not return a raw array when the polling trigger contract expects an object
  containing a collection property.
- Do not assume one event equals one flow run without deciding duplicate,
  ordering, replay, and idempotency behavior.
- Do not claim trigger support in Power Apps itself.

## Review checklist

- [ ] Registration, callback, deletion, authentication, and duplicate handling
      are documented for webhooks.
- [ ] Polling state extraction, sort order, collection path, response statuses,
      and retry interval behavior are explicit.
- [ ] `single` versus `batch`, Split On, concurrency, and downstream idempotency
      are intentional.
- [ ] Test coverage includes subscription lifecycle, no-change responses,
      duplicate events, malformed notifications, and API throttling.

## Related files

- [OpenAPI extensions](./openapi-extensions.md)
- [Testing and limits](./testing-troubleshooting-limits.md)
- [Flow contract checklist](../references/flow-contract-checklist.md)

## Source anchors

- [Use a custom polling trigger](https://learn.microsoft.com/en-us/connectors/custom-connectors/create-polling-trigger)
- [Use a webhook trigger](https://learn.microsoft.com/en-us/connectors/custom-connectors/create-webhook-trigger)
- [Webhook trigger training module](https://learn.microsoft.com/en-us/training/modules/create-triggers-custom-connectors/)
- [Polling trigger training module](https://learn.microsoft.com/en-us/training/modules/create-triggers-custom-connectors/5-polling-trigger)
