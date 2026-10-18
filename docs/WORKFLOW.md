# Workflows

## 1. Scam Checker Workflow
- **User action:** User pastes a suspicious SMS, email, or WhatsApp message into the input field and clicks "Analyze".
- **System processing:** System runs rule-based analysis (checks for urgency keywords, credential requests, suspicious URLs).
- **Decision points:** Does the message match any risk rules?
- **Output:** A list of triggered risk indicators with explanations, or a statement that no configured indicators were found (with a disclaimer).
- **Next action:** User is advised to ignore the message, report the sender, or proceed with caution.
- **Failure cases:** Empty input (show error), input too long (truncate/error).

## 2. Payment Assistant Workflow
- **User action:** User inputs details of a problematic payment (e.g., amount, date, status: "debited but not credited").
- **System processing:** System saves the payment as an active "Financial Activity" record.
- **Decision points:** What is the payment status?
- **Output:** Static guidelines on next steps (e.g., "Wait T+3 days", "Contact bank with reference").
- **Next action:** User adds a reference number or updates status to "Resolved".
- **Failure cases:** Missing required fields like amount or status (prompt user).

## 3. Cash-Flow Planner Workflow
- **User action:** User enters available funds, upcoming expenses, and expected income.
- **System processing:** System fetches unresolved incoming payments from the Shared Financial Activity record. System calculates primary forecast (Available - Expenses).
- **Decision points:** Are there unconfirmed funds? 
- **Output:** Primary forecast (shortfall/surplus) excluding unconfirmed funds.
- **Next action:** User toggles a "hypothetical scenario" to see the forecast if unconfirmed funds arrive.
- **Failure cases:** Negative available funds entered incorrectly.

## 4. Shared Financial Activity & Connected Workflow (Implemented & Verified)
- **User action:** User records a problematic or delayed incoming payment (e.g. ₹2,000 delayed via UPI).
- **System processing:**
  1. Creates or deduplicates the `FinancialActivity` (Status: `UNCONFIRMED`, Type: `INCOME`) linked 1-to-1 with a `PaymentCase` (Status: `OPEN`, Issue: `DELAYED`).
  2. Prevents duplicate activity creation on retry via idempotency and reference matching.
  3. Returns status-appropriate official guidance (e.g. RBI TAT rules, UTR tracking).
- **Cash-Flow Integration:**
  - Cash-Flow Planner strictly excludes the unconfirmed receipt from primary liquid funds (e.g. maintaining a ₹3,000 shortfall against ₹8,000 expenses).
  - Automatically presents a conditional scenario (`unconfirmedReceiptsCleared`) showing the adjusted ₹1,000 shortfall if the receipt clears.
- **Action Centre Integration:**
  - Action Centre dynamically aggregates the unresolved payment as a `PAYMENT_FOLLOW_UP` action item and flags the `CASH_FLOW_SHORTFALL`.
  - Prioritizes items by urgency (`HIGH` for shortfalls and critical payment issues).
- **Lifecycle Resolution:**
  - When the user confirms receipt (via Action Centre resolution or activity status update), YUKTHI executes an atomic database transaction:
    - `FinancialActivity.status` -> `CONFIRMED`
    - `PaymentCase.resolutionStatus` -> `RESOLVED`
  - Cash-Flow Planner immediately updates the primary forecast, including the confirmed funds and eliminating the uncertainty gap.
  - The Action Centre clears the resolved action item from pending tasks.

## 5. Action Centre Workflow
- **User action:** User opens the main dashboard or calls `/api/action-centre`.
- **System processing:** Aggregates unresolved `PaymentCase` records (`OPEN` / `IN_PROGRESS`), unconfirmed `FinancialActivity` records, active cash-flow shortfalls, and high-risk scam warnings. Deduplicates underlying source records.
- **Output:** Prioritized actionable dashboard items categorized by `HIGH`, `MEDIUM`, and `LOW` urgency.
- **Next action:** User clicks "Resolve" or updates follow-up status, triggering atomic multi-record updates via `/api/action-centre/resolve`.

## 6. Error and Recovery Workflows
- **Database & Transaction Failures:** Operations spanning multiple models use Prisma transactions (`$transaction`). If an update fails, all changes roll back to prevent orphaned or inconsistent states.
- **Network / Retry Idempotency:** Duplicate requests bearing the same reference number return existing records without double-counting funds or generating duplicate action items.

