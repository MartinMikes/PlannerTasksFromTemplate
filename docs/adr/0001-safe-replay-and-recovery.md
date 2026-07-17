# ADR 0001: Resume concert-plan creation in place

## Status

Superseded by [ADR 0002](./0002-discard-failed-plans-and-resubmit.md)

## Context

A Power Automate run can fail after creating a Planner plan, buckets, or tasks. Microsoft Planner does not provide an idempotency key for plan creation, and titles are neither immutable nor unique. Replaying the current Flow from its trigger could therefore create duplicate plans or tasks, while automatic cleanup could destroy useful partial work.

The expected volume is approximately five concert plans per year. Correctness, traceability, and simple operator recovery are more important than concurrent throughput.

## Decision

One concert request is identified by the immutable composite key `FormId|ResponseId` and may have at most one active concert plan.

The automation will use two durable SharePoint lists:

- a register of processing records, with a uniqueness constraint on the concert-request key; and
- a register of processing items, relating stable template keys for buckets and tasks to their created Planner IDs.

The main Flow will use trigger concurrency `1`. It will persist a plan, bucket, or task ID immediately after creating the corresponding Planner object. A repeated or recovery run will reconcile the stored state and continue in the same plan, creating only missing items. Names and titles will not be used as identity keys.

Transient connector operations may retry automatically at most three times with delay. After those retries are exhausted, the processing record enters `Awaiting operator`, an error e-mail is sent, and further recovery is started explicitly through a recovery Flow. Recovery actions are audit-recorded.

The automation will neither delete partial Planner content nor create a replacement plan automatically. If the active plan is missing or cannot be safely completed, an operator must abandon it explicitly before authorizing a replacement plan. The processing record retains the previous Planner ID and the reason for replacement.

If an already completed concert request is received again, the automation records the replay and exits successfully without creating Planner content or sending an error e-mail.

## Consequences

- Partial progress remains usable and retries do not silently duplicate known Planner objects.
- Stable technical keys are required in the workbook contract for template buckets and tasks.
- SharePoint list provisioning, uniqueness constraints, recovery Flow behavior, state transitions, and error e-mail content become part of deployment and acceptance testing.
- Concert requests are processed serially; at the expected volume this delay is negligible.
- Exceptional replacement is deliberately slower because it requires an operator decision and preserves an audit trail.
- The guarantee applies to objects recorded successfully. Implementation must minimize the narrow interval between Planner creation and durable ID persistence and route ambiguous outcomes to an operator instead of guessing.
