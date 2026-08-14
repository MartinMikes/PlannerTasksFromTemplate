# Custom connector implementation plan

## Boundary

- Product:
- Environment and region:
- Dataverse and solution:
- Maker/admin role and license:
- DLP, gateway, VNet, and endpoint reachability:

## API contract

- API owner and nonproduction base URL:
- Operations and stable operation IDs:
- Success and error schemas:
- Pagination, rate limits, idempotency, and correlation IDs:
- Event model: webhook / polling / no trigger:

## Authentication

- Grant or credential model:
- Connection parameters and location:
- OAuth scopes, audience, tenant, and redirect URI:
- Secret storage and target-environment binding:

## Authoring route

- [ ] Blank designer
- [ ] Swagger 2.0 import
- [ ] Postman after current format check
- [ ] `paconn` source-controlled artifacts
- [ ] Dataverse solution API

## Runtime adaptations

- Required `x-ms-*` extensions:
- Required policy templates and execution order:
- Custom code justification, operation branches, and constraints:

## Validation and ALM

- Operation test cases:
- Swagger/Solution Checker validation:
- Flow/app integration test:
- Solution import order and connection references:
- Breaking-change and rollback plan:
- Sharing or certification target:

## Sources and volatile claims

- Owning Microsoft Learn pages:
- Values that need a current-page or tenant check:
