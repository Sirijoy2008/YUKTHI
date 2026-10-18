# Security and Privacy

> **Note:** FINOVA is currently an empty project in the documentation phase. These guidelines apply to the proposed implementation.

## Data Minimization
- The application shall only request data strictly necessary for providing the stated features.
- Risk Assessment texts should not be persisted long-term to prevent accidental storage of real credentials.

## Sensitive Information (Never Collected)
The application must **NEVER** ask for, collect, or store:
- OTPs (One Time Passwords)
- UPI PINs
- Banking Passwords
- Credit/Debit Card PINs
- Full Credit/Debit Card Numbers

## Input Validation and Sanitization
- All user inputs must be strictly validated on the backend using **Zod** schemas.
- Use **Prisma ORM** for all database queries to inherently protect against SQL Injection.
- Financial amounts must be validated as positive numbers.

## Secure Error Handling
- Error messages displayed to the user must be generic and user-friendly.
- Stack traces or system paths must never be exposed in production UI.

## Authentication and Authorization
- **Tenant Isolation:** Enforced on API routes via `x-user-id` header inspection (returning 401 Unauthorized for missing auth and 403 Forbidden for mismatched ownership).
- **PostgreSQL Row Level Security (RLS):** Supabase PostgreSQL tables (`user_profiles`, `financial_activities`, `payment_cases`, `risk_assessments`, `cash_flow_items`, `action_centre_items`) have RLS enabled with granular SELECT, INSERT, UPDATE, DELETE policies verifying `auth.uid() = user_id`.
- **Privileged Credentials:** Secret keys and service-role credentials reside exclusively on the server side and are never exposed to browser clients.


## Storage and Retention Policy
- User-entered text in the Scam Checker must be deleted immediately after analysis or stored only temporarily in memory.

## Secure Environment Variable Management
- Never commit `.env` files.
- Secrets must be managed via secure environment variables in the deployment environment.

## API Security Requirements
- If a backend API is created, all endpoints must have rate limiting to prevent abuse (e.g., spamming the Scam Checker API).

## Logging Rules
- Logs must not contain financial amounts, message contents, or PII. Log only generic events like `ScamCheck_Executed` or `PaymentFollowUp_Created`.

## Known Risks and Mitigations
- **Risk:** Users entering real credentials into the Scam Checker.
- **Mitigation:** Clear UI warnings stating "Never paste your PIN or OTP here." System drops numbers resembling PINs in memory.

## Limitations of Current Prototype
- The prototype is not completely secure, compliant with financial regulations, or audited. It is a proof-of-concept hackathon project and should not be used with real, sensitive financial data in its current state.
