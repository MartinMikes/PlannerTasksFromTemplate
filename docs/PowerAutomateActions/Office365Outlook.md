# Office 365 Outlook

The Office 365 Outlook connector covers mail, calendar, contacts, shared
mailbox work, and some direct Microsoft Graph request scenarios.

## Most important actions

| Action family | Main actions to know |
| --- | --- |
| Mail sending | `Send an email (V2)`, `Send an email from a shared mailbox (V2)`, `Draft an email message`, `Send a Draft message` |
| Mail reading | `Get email (V2)`, `Get emails (V3)`, `Export email (V2)`, `Get Attachment (V2)` |
| Mail updates | `Reply to email (V3)`, `Forward an email (V2)`, `Move email (V2)`, `Delete email (V2)`, `Flag email (V2)`, `Mark as read or unread (V3)` |
| Calendar and meetings | `Create event (V4)`, `Get event (V3)`, `Get events (V4)`, `Get calendar view of events (V3)`, `Delete event (V2)`, `Respond to an event invite (V2)`, `Find meeting times (V2)` |
| Rooms and scheduling | `Get room lists (V2)`, `Get rooms (V2)`, `Get rooms in room list (V2)` |
| Contacts | `Create contact (V2)`, `Get contact (V2)`, `Get contacts (V2)`, `Delete contact (V2)`, `Get contact folders (V2)` |
| Advanced access | `Send an HTTP request` for supported Graph-backed mail/calendar segments |

## Important limitations and notes

- Connector throttling is **300 API calls per connection per 60 seconds**.
- `Send an email (V2)` does **not** return a message id.
- Triggering with `Include Attachments = Yes` can cause timeouts; Microsoft
  recommends using `Get Attachment (V2)` when needed.
- Shared mailbox access can require permission replication time and only works
  when the account truly has mailbox access.
- A 504 timeout does not always mean the underlying action failed; retries can
  create duplicate emails.
- Embedded inline images in email bodies have a **1 MB data URI** limit.
- Many older action versions are deprecated; prefer the newest `V2`, `V3`, or
  `V4` variants.
- The connector does not support service-principal-based authentication.

## Project relevance

This connector is mainly useful for notifications, summaries, approval-like
messages, and calendar-related follow-up steps around the Planner workflow.

## Source links

- <https://learn.microsoft.com/en-us/connectors/office365/>
