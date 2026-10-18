# Data Model

> **Status:** Supabase PostgreSQL Schema with Row Level Security (RLS) is defined in `supabase/migrations/20261009183752_init_finova_schema.sql` and mapped via Prisma in `prisma/schema.prisma`. All models support minor monetary integer units (paise) and strict tenant isolation.


## 1. User
Represents an individual user of the platform.
- `id` (String/UUID): Primary identifier.
- `email` (String, Optional): User's email.
- `createdAt` / `updatedAt`: Timestamps.

## 2. Financial Activity
Represents an incoming or outgoing payment, confirmed or unconfirmed.
- `id` (String/UUID): Primary identifier.
- `userId` (String): Link to User.
- `type` (Enum: INCOME, EXPENSE): Direction of cash flow.
- `amount` (Int): The value of the transaction in minor units (e.g., paise for INR) to prevent floating-point errors.
- `currency` (String, Default: "INR"): Currency identifier.
- `status` (Enum: CONFIRMED, UNCONFIRMED, FAILED): Current state.
- `date` (DateTime): Date of transaction or expected date.
- `referenceNumber` (String, Optional): Bank or UPI reference for follow-up and idempotency deduplication.
- **Sensitivity:** High (Financial data). Authorized by user boundaries.

## 3. Payment Case
Linked to a Financial Activity that requires follow-up (e.g. failed payment).
- `id` (String/UUID): Primary identifier.
- `financialActivityId` (String): Link to Financial Activity.
- `issueType` (String): e.g., "FAILED", "PENDING", "DELAYED", "DEBITED_NOT_CREDITED".
- `resolutionStatus` (String): "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED".
- `nextActionDate` (DateTime, Optional): When the user should check again.

## 4. Risk Assessment
Represents a past scam check.
- `id` (String/UUID): Primary identifier.
- `financialActivityId` (String, Optional): Link to related activity.
- `indicatorsFound` (Array of Strings): Rules triggered.
- `riskLevel` (String): "LOW", "MEDIUM", "HIGH".
- **Sensitivity:** High. Message content is intentionally **NOT** stored to minimize data retention of sensitive text.

## 5. Cash-Flow Item
Represents static funds or expenses (can be standalone from Financial Activity).
- `id` (String/UUID): Primary identifier.
- `userId` (String): Link to User.
- `amount` (Int): The value in minor units (paise).
- `currency` (String, Default: "INR"): Currency identifier.
- `isIncome` (Boolean): Direction of flow.
- `isConfirmed` (Boolean): Whether funds are actual or theoretical.
- `dueDate` (DateTime, Optional): When the expense is due.

## 6. Action-Centre Item
A computed (virtual) view object combining Payment Cases with 'OPEN'/'IN_PROGRESS' status, active Cash-Flow Shortfalls, unconfirmed incoming receipts, and high-risk scam warnings to render a unified prioritized dashboard list. Not stored directly in the database.
- `id`: Synthetic identifier (e.g. `action-pc-uuid`, `action-cf-shortfall-userId`).
- `type`: `PAYMENT_FOLLOW_UP`, `CASH_FLOW_SHORTFALL`, `UNCONFIRMED_RECEIPT`, `SCAM_ALERT`.
- `urgency`: `HIGH`, `MEDIUM`, `LOW`.
- `status`: `PENDING`, `RESOLVED`.
- `sourceEntity`: Link to underlying `entityType` and `entityId`.
- `actionPrompt`: Recommended safe next step.

## Data Distinctions
- **User-reported values:** `issueType`, `status`, `amount`, `referenceNumber`
- **System-generated estimates:** `primaryForecast`, `conditionalScenarios`, `projectedShortfall`
- **Externally verified values:** None (Currently out of scope for the prototype; all statuses flagged as unverified).

