# Test Plan

## Test Strategy
The testing approach will cover Unit tests using **Vitest** (for business logic like calculation and rule logic), Integration tests (for shared data flow), UI/Accessibility tests, and Security checks.

## Test Cases

### TC-001: Scam Checker - Suspicious Message
- **Preconditions:** System running, Scam Checker loaded.
- **Test Steps:** Enter "Urgent: Your account is blocked. Click here to verify http://fake-link.com". Click Analyze.
- **Expected Result:** System flags "Urgent" keyword and "Suspicious link", displays warning.
- **Actual Status:** Passed (Verified via `src/services/scamChecker.test.ts` and API tests).

### TC-002: Scam Checker - Harmless Message
- **Preconditions:** System running, Scam Checker loaded.
- **Test Steps:** Enter "Hi, see you at 5 PM." Click Analyze.
- **Expected Result:** System finds no indicators, displays a safe but cautious disclaimer.
- **Actual Status:** Passed (Verified via `src/services/scamChecker.test.ts`).

### TC-003: Input Validation - Missing Inputs
- **Preconditions:** Payment Assistant API loaded.
- **Test Steps:** Submit the request with empty amount, invalid issueType, or missing fields.
- **Expected Result:** System returns 400 Bad Request with precise validation message and prevents persistence.
- **Actual Status:** Passed (Verified via `src/app/api/payment-cases/route.test.ts` and `src/services/paymentAssistant.test.ts`).

### TC-004: Payment Assistant - Failed Payment
- **Preconditions:** Payment Assistant API loaded.
- **Test Steps:** Enter payment issueType as "FAILED".
- **Expected Result:** System records case with FAILED activity status and provides guidance on bank reversal timelines (T+1 to T+5 days), official bank customer care, NPCI dispute portal, and RBI Ombudsman.
- **Actual Status:** Passed (Verified via `src/services/paymentGuidance.test.ts`, `src/services/paymentAssistant.test.ts`, and API tests).

### TC-005: Cash-Flow Planner - Standard Forecast
- **Preconditions:** Cash-Flow Planner API loaded.
- **Test Steps:** Enter ₹5,000 available funds and ₹8,000 upcoming expenses.
- **Expected Result:** System shows a projected potential shortfall of ₹3,000.
- **Actual Status:** Passed (Verified via `src/services/cashFlowCalculator.test.ts`, `src/services/cashFlowService.test.ts`, and `src/app/api/cash-flow/forecast/route.test.ts`).

### TC-006: Cash-Flow Planner - Unconfirmed Receipt
- **Preconditions:** Cash-Flow Planner API loaded. ₹5,000 available, ₹8,000 expenses.
- **Test Steps:** Add an unconfirmed incoming receipt of ₹2,000 (or ₹4,000).
- **Expected Result:** Primary forecast strictly excludes unconfirmed receipts and continues to show a ₹3,000 shortfall. A separate conditional scenario ("unconfirmedReceiptsCleared") shows the adjusted shortfall/surplus if that receipt clears and arrives.
- **Actual Status:** Passed (Verified via `src/services/cashFlowCalculator.test.ts`, `src/services/cashFlowService.test.ts`, and `src/app/api/cash-flow/forecast/route.test.ts`).

### TC-007: Cash-Flow Planner - Confirmed Receipt
- **Preconditions:** Cash-Flow Planner loaded with an unconfirmed receipt.
- **Test Steps:** Update receipt status to "Confirmed" (`isConfirmed: true`).
- **Expected Result:** Primary forecast immediately updates to include the confirmed funds in the primary calculation.
- **Actual Status:** Passed (Verified via `src/services/cashFlowCalculator.test.ts`, `src/services/cashFlowService.test.ts`, and `src/app/api/cash-flow/items/[id]/route.test.ts`).

### TC-008: Security - Sensitive Credentials
- **Preconditions:** Navigating through schemas and API routes.
- **Test Steps:** Inspect all request schemas and attempt injecting OTPs, PINs, or passwords into reference fields.
- **Expected Result:** No field requests sensitive credentials. Injection of OTPs/PINs into reference fields is explicitly rejected with 400 Bad Request.
- **Actual Status:** Passed (Verified via `src/services/paymentGuidance.test.ts`, `src/services/paymentAssistant.test.ts`, and API tests).

### TC-009: UI - Empty States and Mobile
- **Preconditions:** Application loaded on a mobile viewport size with no user data.
- **Test Steps:** View the Action Centre.
- **Expected Result:** UI renders cleanly, no horizontal scrolling, empty state text is helpful ("Add a payment to track...").
- **Actual Status:** Not tested (UI phase).

### TC-010: Payment Assistant - Status Transitions and Access Control
- **Preconditions:** Payment cases created in database.
- **Test Steps:**
  1. Test status transitions: OPEN -> IN_PROGRESS -> RESOLVED -> CLOSED.
  2. Attempt illegal transition: CLOSED -> RESOLVED.
  3. Attempt fetching or updating case with unauthorized user ID.
  4. Attempt accessing non-existent case.
- **Expected Result:**
  1. Permitted transitions succeed and update linked FinancialActivity status.
  2. Illegal transition rejected with 400 Bad Request.
  3. Unauthorized access rejected with 403 Forbidden (or 401 if unauthenticated).
  4. Unknown case returns 404 Not Found.
- **Actual Status:** Passed (Verified via `src/services/paymentAssistant.test.ts`, `src/app/api/payment-cases/route.test.ts`, and `src/app/api/payment-cases/[id]/route.test.ts`).

### TC-011: Cash-Flow Planner - Deduplication, Edge Cases, and What-If Scenarios
- **Preconditions:** Cash-Flow calculation engine and items API loaded.
- **Test Steps:**
  1. Submit item lists with duplicate IDs to verify deduplication.
  2. Test user-defined hypothetical scenarios (side gig income / emergency expense).
  3. Attempt creating items with negative or non-integer amounts.
  4. Perform unauthorized item updates/deletions.
- **Expected Result:**
  1. Duplicates are filtered out without double counting.
  2. Hypotheticals are calculated conditionally without mutating primary forecast.
  3. Negative amounts rejected with 400 Bad Request.
  4. Cross-user access rejected with 403 Forbidden.
- **Actual Status:** Passed (Verified via `src/services/cashFlowCalculator.test.ts`, `src/services/cashFlowService.test.ts`, `src/app/api/cash-flow/forecast/route.test.ts`, and `src/app/api/cash-flow/items/[id]/route.test.ts`).

### TC-012: Supabase Database Schema Validation and Data Integrity
- **Preconditions:** Database foundation schemas loaded.
- **Test Steps:**
  1. Validate correct UUID and positive minor units (paise) constraints.
  2. Attempt invalid negative or non-integer floating-point inputs.
  3. Verify error sanitization scrubs database connection URLs and passwords.
- **Expected Result:**
  1. Valid records pass schema parsing.
  2. Invalid/float monetary amounts are rejected.
  3. Database error sanitization returns generic error message without leaking secrets.
- **Actual Status:** Passed (Verified via `src/services/databaseFoundation.test.ts`).

### TC-013: Supabase Row Level Security (RLS) Isolation
- **Preconditions:** Supabase migration `20261009183752_init_finova_schema.sql` applied to PostgreSQL database.
- **Test Steps:**
  1. Execute SELECT, INSERT, UPDATE, DELETE as User A (`auth.uid() = user_a`).
  2. Attempt accessing User A records as User B (`auth.uid() = user_b`).
- **Expected Result:**
  1. User A can access and manage own records.
  2. User B queries return 0 rows (SELECT) or violate policy check (INSERT/UPDATE/DELETE).
- **Actual Status:** Policy Defined in Migration DDL (Execution verified via unit tests and API tenant isolation; full live Postgres RLS test pending remote database connection).

