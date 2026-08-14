# Volatile values and documentation conflicts

Microsoft Learn pages reviewed on 2026-08-13 contain values that can change or
conflict. Use this file as a refresh checklist, not as a permanent quota
contract. Recheck the linked current pages before implementation or production
advice.

## Current evidence to reconcile

- **OpenAPI/Postman size:** The custom connector FAQ documents definitions
  below 1 MB.
- **Swagger schemas and operations:** The FAQ documents maximums of 512 body
  schemas, 256 operations, and 16,384 schemas per operation.
- **Custom connector calls:** The Power Automate limits page and custom
  connector FAQ currently show different per-connection request values
  (500 versus 10,000 requests/minute).
- **Custom-code timeout:** Training says fewer than five seconds; the current
  write-code FAQ describes two minutes for newly created connectors.
- **Postman import:** One tutorial describes Collection v1 while the FAQ
  describes Collection v2 support.
- **Environment variables:** The environment-variable page restricts direct
  action/trigger/policy use, while policy documentation exposes
  `@environmentVariables(...)`.
- **OAuth redirects:** Current overview guidance favors a per-connector URI
  while older examples retain legacy global settings.
- **Certification timeline:** Current pages give estimates ranging from about
  10-14 days to 15 business days or 5-6 weeks.
- **Preview and enhanced connectors:** Availability, authoring screens, and
  support can vary by product and tenant.
- **Flow quotas:** The limits page is plan-dependent; do not transfer a value
  from another product or connector.

## Stable design guards to preserve

- OpenAPI 3.0 is not documented as a direct custom-connector authoring format;
  adapt and validate Swagger 2.0.
- OAuth client-credentials grant is not supported by the documented custom
  connector OAuth model.
- Solutions do not package credential-bearing connection secrets.
- Power Apps does not directly host connector triggers.
- Custom-code `Context.SendAsync` cannot reach private VNet endpoints.

## Refresh method

1. Open the owning Microsoft Learn page, not a copied blog or stale sample.
2. Record product, plan, preview state, region, and page update context.
3. If pages still disagree, cite both claims and recommend a target-environment
   test.
4. Update this reference and the affected rule together, preserving the date and
   reason for the change.

## Source anchors

- [Custom connector FAQ](https://learn.microsoft.com/en-us/connectors/custom-connectors/faq)
- [Write code in a custom connector](https://learn.microsoft.com/en-us/connectors/custom-connectors/write-code)
- [Power Automate limits](https://learn.microsoft.com/en-us/power-automate/limits-and-config)
- [Environment variables](https://learn.microsoft.com/en-us/connectors/custom-connectors/environment-variables)
- [Policy expressions](https://learn.microsoft.com/en-us/connectors/custom-connectors/policy-templates/expressions/expressions)
- [Certification overview](https://learn.microsoft.com/en-us/connectors/custom-connectors/submit-certification)
