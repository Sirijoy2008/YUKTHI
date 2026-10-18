# Decisions and Assumptions

## Decision Log

### DEC-001: No Real-Time Banking Integration
- **Date:** 2026-10-09
- **Decision:** The prototype will not integrate with live banking or telecom APIs.
- **Reason:** Regulatory hurdles, access restrictions, and scope limitations of a hackathon.
- **Alternatives Considered:** Plaid or similar aggregators (Too complex/expensive for target market initial tests).
- **Consequences:** All payment statuses must be manually inputted by the user.
- **Status:** Accepted.

### DEC-002: Rule-Based Scam Checker
- **Date:** 2026-10-09
- **Decision:** Use simple keyword/Regex rules instead of an LLM or ML model for scam detection.
- **Reason:** Predictability, speed, and cost constraints.
- **Alternatives Considered:** OpenAI API (Risk of hallucination and latency).
- **Consequences:** Will miss novel scams not covered by rules. Requires strong disclaimer.
- **Status:** Accepted.

### DEC-003: Backend Architecture Stack
- **Date:** 2026-10-09
- **Decision:** Use Next.js App Router, Route Handlers (TypeScript), Supabase PostgreSQL, Prisma, Zod, and Vitest.
- **Reason:** Provides a cohesive full-stack TypeScript developer experience, type safety from DB to UI, and robust validation.
- **Alternatives Considered:** Separate Node.js/Express backend (rejected to reduce context switching and deployment complexity).
- **Consequences:** Team must be familiar with Next.js specific paradigms.
- **Status:** Accepted.

### DEC-004: Supabase PostgreSQL, CLI Migrations & Prisma ORM Coexistence
- **Date:** 2026-10-10
- **Decision:** Supabase PostgreSQL acts as the single persistent relational store. Supabase CLI owns declarative schema migrations and Row Level Security (RLS) policies. Prisma ORM serves as the server-side strongly typed query builder and runtime data mapper, mapped via `@@map` annotations to Supabase tables.
- **Reason:** Prevents competing migration histories. Prisma does not natively support or manage PostgreSQL RLS declarative policies. Using Supabase CLI for SQL migrations enables standard PostgreSQL RLS DDL (`CREATE POLICY`) and enum definitions while retaining Prisma's end-to-end type safety in server Route Handlers.
- **Alternatives Considered:**
  1. *Prisma Migrate only*: Cannot declaratively manage Supabase RLS policies or PostgreSQL triggers cleanly.
  2. *Supabase JS Client only*: Lacks automatic relational compile-time typing and transactional ergonomics provided by Prisma.
- **Consequences:** Whenever schema migrations are created in `supabase/migrations/`, `prisma/schema.prisma` must be kept in sync using `npx prisma generate`. Direct client-side database access is guarded by RLS; server-side Route Handlers connect via pooled `DATABASE_URL`.
- **Status:** Accepted.

## Assumptions Log

### ASM-001: User Willingness for Manual Entry
- **Assumption:** Users facing a delayed payment are anxious enough that they will be willing to manually type in the details to receive guidance.
- **Status:** Unresolved. Needs validation via user testing.

### ASM-002: Market Differentiator
- **Assumption:** Linking payment disputes to cash flow is a significant enough pain point that users will prefer YUKTHI over using separate banking and budgeting apps.
- **Status:** Unresolved. Needs market validation.
