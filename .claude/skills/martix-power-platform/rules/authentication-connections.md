# Custom connector authentication and connections

## Purpose

Choose an authentication model the target connector and API actually support,
then keep credentials, connection objects, and solution references separate.

## Default guidance

- **Anonymous:** Use only when the API is intentionally public; assess data
  exposure and abuse.
- **Basic:** Use when the service exposes username/password over HTTPS; plan
  rotation and secret handling.
- **API key:** Use when the service expects a header or query key; prefer
  headers and avoid URL logging.
- **OAuth 2.0:** Use when a user delegates access to the service; check
  consent, scopes, refresh, and redirect behavior.
- **Microsoft Entra ID:** Use when a delegated API and connector app are
  registered; check audience, tenant, permissions, and consent.

- Define the exact connection parameter name and location the API expects.
  Prefer HTTPS headers over query-string secrets because URLs are more likely to
  be logged or copied.
- Generic OAuth configuration normally includes client ID, client secret,
  authorization URL, token URL, refresh URL, optional scope, and redirect URI.
  The documented custom connector model does not support the OAuth
  client-credentials grant.
- Copy the redirect URI generated for the actual connector instance and
  register that exact value with the identity provider. Treat older global or
  legacy redirect examples as historical until verified.
- For Entra delegated access, verify the API app registration, connector app
  registration, delegated permission, consent, audience, tenant mode, and
  managed-identity requirements. A target environment may create a new managed
  identity that must be allowed by the API.
- Multiple authentication choices use `connectionParameterSets` in
  `apiProperties.json`; the current documentation identifies the CLI as the
  route for multi-auth because the wizard does not create it.
- A connection is the credential-bearing instance in one environment. A
  connection reference is a solution component that points a resource to a
  target connection. Never treat a reference as a secret store.

## Avoid

- Do not recommend client-credentials OAuth as if it were supported by custom
  connector OAuth.
- Do not paste a client secret, API key, token, or password into source files,
  logs, screenshots, or chat.
- Do not copy an old OAuth redirect URI from a blog or legacy page.
- Do not assume a source connection will be carried into a target environment
  by a solution import.

## Review checklist

- [ ] The API's supported grant and credential location are known.
- [ ] Secret-bearing values are external to source control and solutions.
- [ ] OAuth redirect, scopes, audience, tenant, and consent are registered for
      the actual connector.
- [ ] Target connection creation, rebinding, and test-connection behavior are
      explicit.
- [ ] Multi-auth preserves existing connection parameters when evolving a
      certified connector.

## Related files

- [Connector authoring](./connector-authoring.md)
- [Solutions and ALM](./solutions-alm-versioning.md)
- [Volatile values](../references/volatile-values.md)

## Source anchors

- [Specify connection parameters](https://learn.microsoft.com/en-us/connectors/custom-connectors/connection-parameters)
- [Authenticate with Microsoft Entra ID](https://learn.microsoft.com/en-us/connectors/custom-connectors/azure-active-directory-authentication)
- [Troubleshoot OAuth configuration](https://learn.microsoft.com/en-us/connectors/custom-connectors/troubleshoot-oauth2)
- [Multiple authentications](https://learn.microsoft.com/en-us/connectors/custom-connectors/multi-auth)
- [Data protection in connectors](https://learn.microsoft.com/en-us/connectors/protection)
