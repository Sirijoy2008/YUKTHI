# YUKTHI — Smart Financial Assistance Platform

**Team:** YUGMA  
**Domain:** FinTech  
**Target Market:** India  

## Overview
YUKTHI is a Smart Financial Assistance Platform designed to help users understand potential financial risks, handle payment-related uncertainty, and plan cash flow through one connected platform. 

## Problem Addressed
Users often face a fragmented experience when dealing with financial uncertainties. They struggle to assess the risks of suspicious messages, don't know the next steps for failed or pending payments, and find it difficult to forecast their cash flow when expected payments are delayed. 

## Proposed Solution & Core Modules
1. **Scam Checker**: Analyzes user-provided messages using predefined rules to identify risk indicators and recommend safe next steps.
2. **Payment Assistant**: Helps users understand payment situations (failed, delayed, pending) and provides next steps and official support channels.
3. **Cash-Flow Planner**: Estimates whether available funds can cover upcoming expenses, supporting hypothetical scenarios and unconfirmed receipts.

## Current Implementation Status
* **Phase 1: Backend Foundation (Completed):** Next.js App Router backend foundation with standardized API responses, safe logging, Zod validation, and Vitest test suite.
* **Phase 2: Database Foundation & Backend Integration (Completed):** Supabase PostgreSQL schema with 6 core entities (`user_profiles`, `financial_activities`, `payment_cases`, `risk_assessments`, `cash_flow_items`, `action_centre_items`), integer minor unit precision (paise), Row Level Security (RLS) policies, Supabase CLI migration suite (`supabase/migrations/`), and synchronized Prisma client bindings.
* **Phase 3-5: Core Fintech Modules (Completed):** Explainable Scam Checker (`/scam-checker`), Payment Assistant & Dispute Tracker (`/payment-assistant`), and Conservative Cash-Flow Planner (`/cash-flow`).
* **Phase 6: Action Centre & Shared Activities (Completed):** Unified command center (`/action-centre`) synchronizing actionable follow-ups and chronological shared activity across all modules, featuring dual perspective feeds, urgency indicators, multi-dimensional filtering, and atomic task resolution.
* **Phase 7: Opening Experience, Auth, Language & Identity Verification (Completed):** Premium welcome page (`/welcome` & `/`), native script multi-language engine supporting English, Telugu (తెలుగు), and Hindi (हिन्दी), dedicated Login (`/login`) & Sign Up (`/signup`) flows, and compliant Aadhaar Identity Verification interface (`/verify-aadhaar`) with zero-biometric-storage security safeguards.

## Technology Stack
* **Runtime & Framework:** Next.js App Router (TypeScript), Node.js, React 19.
* **Database & Auth:** Supabase PostgreSQL with Row Level Security (RLS) & Supabase Auth.
* **Internationalization:** Native script multilingual engine (`en`, `te`, `hi`) with persistent preference storage.
* **Data Access & Typing:** Prisma ORM (server-side query builder with `@@map` to Supabase tables) & Zod schema validation.
* **Testing:** Vitest (186 unit, integration, and UI utility tests passing).

## Prerequisites
- Node.js 18+
- npm (or pnpm/yarn)

## Setup and Run Instructions
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000` or test the health endpoint at `http://localhost:3000/api/health`.

## Testing Instructions
To run unit tests (Vitest) for the backend logic:
```bash
npm run test
```

## Build Instructions
To build the application for production:
```bash
npm run build
```

## Environment Variables
Copy `.env.example` to `.env` or `.env.local` for local development.

## Known Limitations
- The project is currently in the foundation phase. No functional frontend or core business logic features exist yet.
- The application does not integrate with real-time bank or telecom APIs.

## Team and Contribution
Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on our workflow and how to contribute.
