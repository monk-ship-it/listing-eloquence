# Manual billing support — internal owner checklist

Prepared 1 November 2026. Internal operating guide for Domenico Monk; **not public Terms, an approved refund policy, or authority to change a particular customer's billing**. The commercial offers below come from the unpublished [refund draft](refund-policy-draft.md). Confirm the applicable policy and record the owner's decision before treating a proposed refund as approved. No live action, customer message or lifecycle test was performed in preparing this guide.

Confirmed operator: Domenico Monk, sole trader trading as CopyByMonk. `domenico@copybymonk.com` handles administration, support, billing and privacy requests. The operator is not VAT registered and is ICO registered; no registration number or business address is invented. The missing correspondence/service address and unfinished public legal pages remain separate launch work.

## 1. Open one case and establish authority

- Record a case ID, original message reference and **mailbox receipt timestamp** with its timezone; keep UTC and the Europe/London display time. Eligibility uses when the request arrived, not when it was read. Preserve the customer's actual cancellation/refund wording and requested scope.
- Verify the requester is authorised for the Quill account through the account email or a verified account-access/support process. Match the immutable Quill user ID to the stored Stripe customer and subscription IDs. A matching name, forwarded receipt or editable billing email alone is insufficient.
- A verified request to cancel authorises stopping that subscription's renewal; it does not by itself authorise a refund, resumption, new subscription or price change. The owner approves refund eligibility and the exact amount. An assistant may prepare the case and draft a response; executing a financial change or sending a message requires explicit owner authorisation covering that action. This checklist grants neither.
- Assign one case owner. Link duplicate emails and earlier cases to the same payment/request so two people do not act independently.

## 2. Verify current billing state before proposing a change

- Confirm the intended Stripe account and **live versus sandbox/test environment**. Read the exact customer, subscription, invoice and payment; verify their relationships, paid amount/currency, payment date, billing period, current status, cancellation flag/date and any outstanding invoice. Use the actual payment, including any grandfathered price, rather than today's advertised price.
- Check for an existing cancellation, refund, pending refund, dispute or other reimbursement and read its timeline. Record the identifiers privately in the case; never ask for a password, full card number or security code.
- If identity, payment ownership or status is uncertain, resolve it before changing money or disclosing account details. A timeout or an app error does not establish that Stripe did nothing.

## 3. Record the proposed refund decision

| Draft basis | Evidence and treatment to record |
| --- | --- |
| First paid payment | Request received within 14 calendar days of the first paid subscription payment; once per customer, reasonable evaluation, no hard three-pack cutoff. Record prior use of this offer and any specific repeated-claim concern; normal feature/voice evaluation is permitted by the draft. |
| Unwanted renewal | Request received within seven calendar days of the renewal payment and no successful new core listing pack in that renewed billing period. Stop further renewal as part of the approved request. Used periods require an individual, fair owner decision. |
| Billing mistake | Establish the duplicate/incorrect charge or the cancellation receipt time preceding the mistaken renewal. Assess separately from the commercial offer windows. |
| Service problem | Record the failed service, affected allowance/period, attempted remedy and the proposed retry, credit or full/proportionate refund. Do not substitute credit for an agreed refund. |

For renewal eligibility, review durable completed `generation_usage` and relevant saved-generation evidence for the **Stripe billing period**, not the calendar-month allowance counter. Deleted history alone does not prove no use. Failed attempts, marketing retries, opening history and login are not successful new core packs. Reconcile unresolved reservations/finalisation evidence before deciding; a marketing failure can coexist with a successful saved core pack.

Record the decision, basis, amount/currency, original payment reference, cancellation treatment, and any separate access change. Keep mandatory rights/remedies outside an arbitrary commercial cutoff; escalate a disputed legal entitlement rather than inventing a rule. The draft offers submission without undue delay and within 14 calendar days after agreement, not guaranteed bank arrival by that date.

## 4. Execute only the authorised action, then verify it

- **Ordinary cancellation:** preserve Quill's period-end cancellation behaviour. Review the final Stripe action and any invoice/proration/refund options before confirming. A refund or immediate service termination is a separate decision. A subscription scheduled to end can still be `active`; record its verified end date. Payment problems must not prevent a cancellation request being handled. [Stripe cancellation guidance](https://docs.stripe.com/billing/subscriptions/cancel).
- **Refund:** immediately recheck existing/pending refunds and disputes on the exact payment. Submit only the approved amount to the original payment method. A cancellation does not automatically refund; a refund does not automatically stop renewal or end Quill access. Avoid a second reimbursement while a dispute/refund is unresolved. [Stripe refund guidance](https://docs.stripe.com/refunds).
- **Duplicate safeguards:** keep one case/action reference and record the Stripe result ID as soon as available. After an uncertain response, inspect current Stripe state before retrying. If an authorised API operation is used, retain one idempotency key and identical parameters for that operation; do not rely on that key as a permanent case ledger. [Stripe idempotency guidance](https://docs.stripe.com/api/idempotent_requests).
- Re-read Stripe and the reconciled Quill subscription state. Record any mismatch for follow-up; do not manually grant entitlement or overwrite billing rows to hide it. The application can report that Stripe accepted a change while its latest state could not be confirmed. Verify before repeating or describing the result as complete.
- Track a refund's actual status and next action. Pending or action-required is not completed; failed/cancelled needs investigation before another attempt. A Stripe success status is not proof of the customer's bank posting time. Keep pending cases open and record the next review owner/time.

## 5. Confirm manually and close the case accurately

- Prepare a concise response identifying the approved action, amount if applicable, verified renewal/end date, refund status and any next step. Do not promise deletion of the account/history, waive unrelated invoices, or say access has ended unless separately verified.
- **No automatic Quill cancellation/refund email is implemented.** The unused browser-callable transactional sender is closed with HTTP 410. Stripe receipt emails depend on its verified settings and conditions; do not assume they were sent. The owner must send and record any approved support confirmation through the support mailbox. Drafting is not sending.
- Log the decision/authorisation, execution and verification times, actor, Stripe references, exact confirmation sent, and follow-up status. Keep only necessary records in the restricted support record; retention/deletion rules still need finalisation.
- Tax handling remains unchanged: the owner is not VAT registered. Do not add VAT or enable Stripe Tax while resolving a support case; any future tax change needs a separate verified decision.

## Source boundaries

- `src/lib/subscription.functions.ts`: owner-scoped cancellation/resumption and billing portal; no refund endpoint or cancellation email send.
- `src/lib/stripe.server.ts`: cancellation sets `cancel_at_period_end`; it does not request a refund.
- `src/lib/billing-sync.server.ts`: version-guarded writes and fresh reconciliation after competing/uncertain billing responses.
- `src/lib/listing.functions.ts`, `src/lib/quota-slot.ts`: successful core-pack usage and uncertain-finalisation handling.
- `src/routes/lovable/email/transactional/send.ts`: unused public sender closed; managed authentication email is separate.
- `docs/refund-policy-draft.md`, `docs/release-readiness.md`: commercial draft and outstanding launch checks. This checklist does not certify the Stripe test lifecycle, hosted email delivery, authenticated generation journey or public legal readiness.
