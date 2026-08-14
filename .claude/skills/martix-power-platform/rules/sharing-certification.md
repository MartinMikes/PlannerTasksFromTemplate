# Sharing, certification, and product boundaries

## Purpose

Decide whether a connector should remain private, be shared inside a tenant, or
enter the public certification lifecycle without overstating platform support.

## Default guidance

- Custom connectors in Power Apps and Power Automate are private to the creator
  by default. Share with users or groups using the smallest **Can view** or
  **Can edit** permission that fits the responsibility.
- Sharing an app or team flow can make the connector usable through that
  resource, but it does not replace API permissions, connection setup, DLP, or
  target-environment checks.
- Logic Apps visibility is tied to author, tenant, Azure subscription, and
  region. Treat Logic Apps connector deployment as an Azure resource boundary.
- Public certification requires supported authentication, production HTTPS,
  valid Swagger 2.0, unique concise metadata, exact schemas, TLS 1.2 or higher,
  support contact, test flow and solution, documentation, and secret-free
  submission files. Verified and independent publishers have different
  ownership and submission paths.
- Certification testing must cover all actions, triggers, and fields. Preview
  to GA guidance includes production availability and success criteria, but
  current pages disagree on deployment timelines. Use the current certification
  page for a concrete submission.
- Treat enhanced connectors and other preview features as opt-in and
  environment-dependent. Do not make preview behavior the default route.

## Avoid

- Do not promise public listing or a fixed certification turnaround.
- Do not confuse tenant sharing with public certification.
- Do not delete a shared connector before checking connections and dependent
  flows/apps.
- Do not claim Logic Apps, Power Apps, Power Automate, and Copilot Studio have
  identical connector trigger or authoring behavior.

## Review checklist

- [ ] Intended audience and sharing permission are explicit.
- [ ] Publisher ownership, support contact, production host, TLS, auth, and
      secret-free package requirements are checked for certification.
- [ ] Every operation, trigger, and field has a test case.
- [ ] Preview labels, public availability, and timeline estimates are surfaced.
- [ ] Product-specific handoffs are clear.

## Related files

- [Solutions and ALM](./solutions-alm-versioning.md)
- [Source index](../references/doc-source-index.md)
- [Volatile values](../references/volatile-values.md)

## Source anchors

- [Share a custom connector](https://learn.microsoft.com/en-us/connectors/custom-connectors/share)
- [Certification overview](https://learn.microsoft.com/en-us/connectors/custom-connectors/submit-certification)
- [Prepare connector files for certification](https://learn.microsoft.com/en-us/connectors/custom-connectors/certification-submission)
- [Verified publisher certification process](https://learn.microsoft.com/en-us/connectors/custom-connectors/submit-for-certification)
- [Independent publisher certification process](https://learn.microsoft.com/en-us/connectors/custom-connectors/certification-submission-ip)
- [Test your connector](https://learn.microsoft.com/en-us/connectors/custom-connectors/certification-testing)
- [Move from preview to GA](https://learn.microsoft.com/en-us/connectors/custom-connectors/certification-to-ga)
