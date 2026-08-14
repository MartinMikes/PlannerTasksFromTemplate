# Policy templates and custom connector code

## Purpose

Choose the least powerful runtime adaptation that solves the documented API
gap. Policies are inspectable configuration; custom code is a C# runtime
escape hatch with stricter portability and networking constraints.

## Default guidance

Use this decision ladder:

1. Correct the OpenAPI contract or response schema.
2. Use a policy for a narrow request, response, header, query, host, routing, or
   data-shape adaptation.
3. Use custom code only when the contract and policy templates cannot express
   the transformation or operation.

Documented policy families include array/object conversion, delimited-string
conversion, request routing, unauthenticated status handling, values from URL,
host URL, HTTP headers, properties, query parameters, and runtime expressions.
Policies execute in order, so a later policy may depend on a value changed by an
earlier one.

Common expression forms are:

```text
@headers('headerName')
@queryParameters('queryParameterName')
@connectionParameters('connectionParameterName')
@body().property
@environmentVariables("environmentVariableName")
```

Expression support is template-specific. Do not assume an expression accepted
by one policy is accepted by another.

Custom code follows the `ScriptBase` shape and can inspect
`Context.OperationId`, modify `Context.Request`, call `Context.SendAsync`, log
through the context logger, honor cancellation, and create JSON content. When
enabled, code takes precedence over the codeless definition; explicitly forward
operations that should retain normal behavior.

The documented code boundary includes .NET Standard 2.0 APIs, one script file
and class, a 1 MB script limit, no custom assemblies, no on-premises data
gateway, and no private VNet access through `Context.SendAsync`. Documentation
conflicts on timeout: training says under five seconds while the current FAQ
describes two minutes for newly created connectors. Treat the current target
tenant and FAQ as the concrete deployment authority, but keep code small.

## Avoid

- Do not use custom code to hide a wrong schema or a simple header rewrite.
- Do not assume all policy expression forms are interchangeable.
- Do not place secrets in code or log full requests and responses.
- Do not claim `Context.SendAsync` can reach a private VNet endpoint.
- Do not state one custom-code timeout without citing the current page and
  acknowledging the training/FAQ conflict.

## Review checklist

- [ ] The API contract and policy options were considered before code.
- [ ] Policy ordering, target operations, and expression support are explicit.
- [ ] Code branches by operation, preserves normal forwarding, handles
      cancellation, maps errors, and serializes JSON deliberately.
- [ ] Script size, runtime, gateway, VNet, and timeout constraints are checked.
- [ ] Code compiles locally against the documented `ScriptBase` support types.

## Related files

- [OpenAPI extensions](./openapi-extensions.md)
- [Testing and limits](./testing-troubleshooting-limits.md)
- [Volatile values](../references/volatile-values.md)

## Source anchors

- [What is a policy?](https://learn.microsoft.com/en-us/connectors/custom-connectors/policy-templates)
- [Policy expressions](https://learn.microsoft.com/en-us/connectors/custom-connectors/policy-templates/expressions/expressions)
- [Write code in a custom connector](https://learn.microsoft.com/en-us/connectors/custom-connectors/write-code)
- [Custom code training module](https://learn.microsoft.com/en-us/training/modules/custom-code-connectors/)
