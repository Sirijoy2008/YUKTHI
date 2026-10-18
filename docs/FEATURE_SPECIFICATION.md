# Feature Specification

## Module A — Scam Checker

**Purpose:** Analyze a user-provided message using configured rules to identify risk indicators, explain risks, and recommend safe steps.

### Requirements
- **FR-001 (Input):** The system shall accept a text message from the user.
- **FR-002 (Analysis):** The system shall evaluate the text against predefined rules (urgency, sensitive credential requests, suspicious links).
- **FR-003 (Output):** The system shall display identified risk indicators and explain why they are risky.
- **FR-004 (Disclaimer):** The system shall clearly display a disclaimer that the analysis is not definitive fraud detection.
- **NFR-001:** The system must not claim a message is safe just because no indicator was found.
- **NFR-002:** The system must not claim integration with live threat intelligence.

## Module B — Payment Assistant

**Purpose:** Guide users through next steps for problematic payments and track follow-up status.

### Requirements
- **FR-005 (Input):** The system shall allow users to input payment details (status, type).
- **FR-006 (Guidance):** The system shall provide static next steps for failed, delayed, pending, or debited-not-credited payments.
- **FR-007 (Tracking):** The system shall allow users to record a reference number and current follow-up status.
- **FR-008 (Support):** The system shall direct users to official support or complaint channels where relevant.
- **NFR-003:** The system must visually distinguish user-reported status from provider-verified status (currently all are user-reported).
- **NFR-004:** The system shall never request an OTP, UPI PIN, banking password, or card PIN.
- **NFR-005:** The system must not claim it can reverse or settle a transaction.
- **NFR-006:** The system must not claim to retrieve real-time transaction information.

## Module C — Cash-Flow Planner

**Purpose:** Estimate if available funds cover expenses, considering unconfirmed income.

### Requirements
- **FR-009 (Input):** The system shall accept current available funds, expected income (and status), and upcoming expenses.
- **FR-010 (Calculation):** The system shall calculate the projected surplus or shortfall.
- **FR-011 (Uncertainty Handling):** The system shall exclude unconfirmed incoming payments from the primary available funds calculation.
- **FR-012 (Hypotheticals):** The system shall allow users to view scenarios showing the impact of unconfirmed funds.
- **NFR-007:** The system must clearly explain every calculation and state its assumptions.

## Implementation Status
- **Module A — Scam Checker:** **Implemented & Verified** (Phase 3). Rule-based static evaluation engine (`src/services/scamChecker.ts`) and API (`/api/scam-checker/analyze`).
- **Module B — Payment Assistant:** **Implemented & Verified** (Phase 4). Backend API routes (`/api/payment-cases`, `/api/payment-cases/[id]`), state machine service (`src/services/paymentAssistant.ts`), provider-appropriate static guidance engine (`src/services/paymentGuidance.ts`), and unverified status disclaimers.
- **Module C — Cash-Flow Planner:** **Implemented & Verified** (Phase 5). Deterministic calculation engine (`src/services/cashFlowCalculator.ts`), persistence & aggregation service (`src/services/cashFlowService.ts`), forecast APIs (`/api/cash-flow/forecast`), and item schedule APIs (`/api/cash-flow/items`, `/api/cash-flow/items/[id]`). Strict exclusion of unconfirmed receipts from primary forecast, separate conditional what-if scenarios, and transparent formula explanations.
