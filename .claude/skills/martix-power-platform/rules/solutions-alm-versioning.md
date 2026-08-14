# Solutions, ALM, versioning, and connector lifecycle

## Purpose

Move connector-backed flows safely between environments and evolve their
contracts without breaking existing apps, flows, or connections.

## Default guidance

- Use unmanaged solutions as the development source and managed solutions as
  downstream deployment artifacts. Track publisher, dependencies, components,
  import order, upgrade/patch strategy, and rollback evidence.
- A solution can carry the custom connector definition and connection
  references, but not the credential-bearing connection secret. Import the
  connector, bind or create the target connection, then satisfy connection
  references before dependent flows or apps run.
- Roles and permissions are not automatically preserved. Check Dataverse role
  security, maker/admin access, DLP connector groups, premium licensing,
  gateway/VNet reachability, API ACLs, and environment geography.
- Environment variables can externalize host, base URL, client ID, client
  secret, login URL, and refresh URL. Do not put secrets in ordinary text
  variables; use a supported secret store. The documented environment-variable
  and policy pages disagree about direct action/trigger/policy support, so
  validate the target implementation and resave behavior.
- For solution custom connectors, the Dataverse API documents connector
  `GET`, `POST`, `PATCH`, and `DELETE` operations. Do not store secrets in
  Dataverse payloads; use the supported connection process.
- Treat a breaking operation as a new contract: use a new operation ID and path
  where needed, increase revision, publish the new operation as Preview first,
  and deprecate the old operation only after migration. Deprecated operations
  remain functional for existing resources but are hidden from new designers.
- Share privately with the smallest required user or group permission. Public
  distribution requires certification preparation, supported auth, production
  HTTPS, valid Swagger 2.0, exact schemas, TLS 1.2+, support contact, test
  solution/flow, and no secrets in submitted files. Treat certification
  timelines as estimates.

## Avoid

- Do not assume a solution import includes usable target credentials.
- Do not mutate a published operation's response type, required fields, or auth
  parameter when existing flows depend on it.
- Do not put client secrets in ordinary environment variables or certification
  packages.
- Do not delete a shared connector without checking dependent connections,
  flows, apps, and subscriptions.

## Review checklist

- [ ] Unmanaged development and managed deployment boundaries are explicit.
- [ ] Connector, connection reference, connection, dependent flows/apps, and
      environment-specific values have an import and binding order.
- [ ] Target roles, DLP, license, network, API permissions, and region are
      checked.
- [ ] Breaking changes use new operation IDs/revisions and a migration plan.
- [ ] Sharing or certification scope, ownership, support, tests, and volatile
      timelines are documented.

## Related files

- [Authentication and connections](./authentication-connections.md)
- [Testing and limits](./testing-troubleshooting-limits.md)
- [Sharing and certification](./sharing-certification.md)
- [Connector plan template](../templates/connector-plan.template.md)

## Source anchors

- [Solution concepts with Power Platform](https://learn.microsoft.com/en-us/power-platform/alm/solution-concepts-alm)
- [Custom connectors in solutions](https://learn.microsoft.com/en-us/connectors/custom-connectors/customconnectorssolutions)
- [Environment variables in solution custom connectors](https://learn.microsoft.com/en-us/connectors/custom-connectors/environment-variables)
- [Manage solution custom connectors with Dataverse APIs](https://learn.microsoft.com/en-us/connectors/custom-connectors/solution-custom-api)
- [Operational versioning](https://learn.microsoft.com/en-us/connectors/custom-connectors/operational-versioning)
- [Deprecate an operation](https://learn.microsoft.com/en-us/connectors/custom-connectors/deprecate-operation)
