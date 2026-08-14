# Power Platform foundations, flow types, and environments

## Purpose

Choose the correct Power Platform surface and cloud-flow shape before designing
connector operations. Environment, license, permissions, DLP, and network
boundaries determine whether an otherwise valid definition can run.

## Default guidance

- Identify whether the target is Power Automate, Power Apps, Logic Apps, or
  Copilot Studio. Keep connector guidance separate from app, agent, analytics,
  and infrastructure design.
- Resolve the environment, region, Dataverse state, maker/admin role, premium
  licensing, DLP policy, gateway or VNet path, and solution status before
  proposing a mutation or deployment.
- Select a cloud-flow type from the event model:
  - **Automated**: a connector or service event starts the flow.
  - **Instant**: a button, app, or manual request starts the flow.
  - **Scheduled**: a recurrence starts the flow.
- Model a cloud flow as a trigger followed by connector actions, built-in
  actions, control scopes, and expressions. Connections supply credentials;
  schemas supply parameter and output shapes; run history supplies execution
  evidence.
- Keep these objects distinct: connector definition, connection, solution
  connection reference, and flow. A solution does not make a target connection
  or API permission appear automatically.

## Avoid

- Do not assume the default environment is a production boundary.
- Do not choose a scheduled flow merely because a polling trigger exists; the
  connector trigger contract and event latency requirements still matter.
- Do not diagnose a connector definition without checking environment access,
  premium licensing, DLP, gateway/VNet reachability, and target credentials.
- Do not use a cloud flow as an unbounded worker; long-running work needs an
  asynchronous or durable design.

## Review checklist

- [ ] Product surface and cloud-flow type are explicit.
- [ ] Environment, region, Dataverse, role, license, DLP, and network path are
      recorded.
- [ ] Trigger cardinality, idempotency, pagination, concurrency, and retry
      behavior are bounded.
- [ ] Connection and connection-reference responsibilities are separated.
- [ ] Deployment advice names the target environment rather than assuming the
      source environment's state.

## Related files

- [Connector authoring](./connector-authoring.md)
- [Testing and limits](./testing-troubleshooting-limits.md)
- [Solutions and ALM](./solutions-alm-versioning.md)
- [Decision map](../references/decision-map.md)

## Source anchors

- [Power Platform environments overview](https://learn.microsoft.com/en-us/power-platform/admin/environments-overview)
- [What is Power Automate?](https://learn.microsoft.com/en-us/power-automate/flow-types)
- [Overview of cloud flows](https://learn.microsoft.com/en-us/power-automate/overview-cloud)
- [Connectors overview](https://learn.microsoft.com/en-us/connectors/overview)
