# ADR 0002: Discard failed plans and resubmit

## Status

Accepted

## Context

Campanula creates only a few concert plans per year, each with roughly 20 to 60
tasks. The same operator maintains the workbook and submits concert requests,
and the workbook is never changed while a request is running or a generation
failure remains unresolved. Operational simplicity is more valuable than
automated in-place recovery.

## Decision

Each concert request gets one generation attempt. If a fatal failure leaves a
partial concert plan, the failure notification identifies and links that plan.
The operator manually deletes it, corrects the cause, and submits a new concert
request. A failed request is never resumed, cleaned up automatically, abandoned
through a recovery workflow, or replaced under the same request. Invalid
individual template tasks remain non-fatal: valid tasks are created and the
result is completed with warnings that list every skipped row. A runtime failure
while creating valid Planner content is fatal rather than a warning.

## Consequences

No recovery Flow, task snapshot, recovery state machine, replacement-plan
operation, custom operator interface, Teams notification, durable
notification-delivery state, notification-resend workflow, or durable
duplicate-response register is required. A single configured e-mail channel
reports clean success, completion with warnings, and generation failure. E-mail
actions may use their ordinary bounded retry behavior; after retries are
exhausted, Power Automate run history is the only delivery evidence.

A resubmission is a new concert request and may create a new concert plan only
after the operator has deleted the failed partial plan. Automatic retries are
disabled for non-idempotent Planner creation actions; read-only operations may
still retry. Rare duplicate delivery of the same Forms response may create a
duplicate plan; the operator accepts this risk and removes such a plan manually.
Failure notifications must provide enough information to identify the partial
plan and correct the cause safely.
