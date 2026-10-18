# API Specification (Proposed)

> **Note:** The following APIs are proposed for the application backend. Currently, the repository is empty, so these endpoints are **not implemented**.

## 1. Analyze Message
- **Endpoint:** `/api/scam-checker/analyze`
- **Method:** `POST`
- **Purpose:** Analyzes text for potential risk indicators based on static rules.
- **Request Schema:**
  ```json
  {
    "message": "string (required, max 2000 chars)"
  }
  ```
- **Response Schema (Success):**
  ```json
  {
    "success": true,
    "data": {
      "indicators": ["string"],
      "details": [
        {
          "id": "string",
          "name": "string",
          "description": "string",
          "reason": "string",
          "recommendation": "string"
        }
      ],
      "riskLevel": "Low | Medium | High",
      "recommendations": ["string"],
      "disclaimer": "string"
    }
  }
  ```
- **Validation:** Zod schema validation enforces string types and a 2000 character limit. Rejects empty messages.
- **Error Codes:** `400 Bad Request` (Invalid input or too large), `500 Internal Server Error`.
- **Authentication:** None required for public prototype.
- **Status:** **Implemented & Verified** (Phase 3)

## 2. Get Activities
- **Endpoint:** `/api/activities`
- **Method:** `GET`
- **Purpose:** Retrieves all shared financial activities for the authenticated user, including linked payment cases and risk assessments.
- **Headers:**
  - `x-user-id: string` (required).
- **Response Schema (Success - 200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "activities": [
        {
          "id": "string (UUID)",
          "userId": "string",
          "type": "INCOME | EXPENSE",
          "amount": 200000,
          "currency": "INR",
          "status": "CONFIRMED | UNCONFIRMED | FAILED",
          "date": "string (ISO 8601)",
          "referenceNumber": "string | null",
          "paymentCase": {
            "id": "string",
            "issueType": "DELAYED",
            "resolutionStatus": "OPEN"
          },
          "riskAssessment": null,
          "createdAt": "string",
          "updatedAt": "string"
        }
      ]
    }
  }
  ```
- **Error Codes:** `401 Unauthorized`, `500 Internal Server Error`.
- **Status:** **Implemented & Verified** (Phase 6)

## 3. Create Activity
- **Endpoint:** `/api/activities`
- **Method:** `POST`
- **Purpose:** Adds a new financial activity (or returns an existing record if a matching reference number is retried), supporting atomic linking to payment issues.
- **Headers:**
  - `x-user-id: string` (required).
  - `idempotency-key: string` (optional).
- **Request Schema:**
  ```json
  {
    "type": "INCOME" | "EXPENSE",
    "amount": 200000,
    "currency": "INR",
    "status": "CONFIRMED" | "UNCONFIRMED" | "FAILED",
    "date": "2026-10-09T10:00:00.000Z",
    "referenceNumber": "string (optional)",
    "issueType": "FAILED | PENDING | DELAYED | DEBITED_NOT_CREDITED (optional)"
  }
  ```
- **Validation:** Positive integer amount (paise), valid ISO date, permitted types and statuses.
- **Response Schema (Success - 201 Created or 200 OK for idempotent duplicate):** Created or retrieved activity.
- **Error Codes:** `400 Bad Request`, `401 Unauthorized`, `500 Internal Server Error`.
- **Status:** **Implemented & Verified** (Phase 6)

## 3B. Update Activity Status
- **Endpoint:** `/api/activities/[id]`
- **Method:** `PATCH`
- **Purpose:** Updates financial activity status (e.g. from UNCONFIRMED to CONFIRMED), atomically updating linked PaymentCase records and recalculating available cash flow.
- **Headers:**
  - `x-user-id: string` (required).
- **Request Schema:**
  ```json
  {
    "status": "CONFIRMED" | "UNCONFIRMED" | "FAILED"
  }
  ```
- **Response Schema (Success - 200 OK):** Updated activity with updated paymentCase relation.
- **Error Codes:** `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal Server Error`.
- **Status:** **Implemented & Verified** (Phase 6)

## 4. Cash-Flow Forecast
- **Endpoint:** `/api/cash-flow/forecast`
- **Methods:** `GET`, `POST`
- **Purpose:** Calculates the expected cash flow by separating confirmed available liquid funds from unconfirmed receipts, evaluating upcoming expenses, and providing conditional what-if scenarios.
- **GET Request:**
  - **Headers:** `x-user-id: string` (required) - Authenticated user identifier.
  - **Query Params:** Optional filtering/lookahead parameters.
- **POST Request (Interactive / Ad-hoc Simulation):**
  - **Headers:** `x-user-id: string` (optional).
  - **Request Schema:**
    ```json
    {
      "currentAvailableFunds": 500000,
      "confirmedIncome": 0,
      "unconfirmedReceipts": 200000,
      "expenses": 800000,
      "items": [
        {
          "id": "item-1",
          "amount": 800000,
          "currency": "INR",
          "isIncome": false,
          "isConfirmed": true,
          "dueDate": "2026-10-15T00:00:00.000Z"
        }
      ],
      "hypotheticalScenarios": [
        {
          "name": "Side Gig Bonus",
          "additionalIncome": 150000,
          "additionalExpense": 0
        }
      ]
    }
    ```
- **Response Schema (Success - 200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "summary": {
        "confirmedAvailableFunds": 500000,
        "confirmedIncomingFunds": 0,
        "totalConfirmedLiquid": 500000,
        "unconfirmedReceipts": 200000,
        "upcomingExpenses": 800000
      },
      "primaryForecast": {
        "netAmount": -300000,
        "isShortfall": true,
        "shortfallAmount": 300000,
        "surplusAmount": 0,
        "statusText": "Potential shortfall of ₹3,000.00"
      },
      "conditionalScenarios": {
        "unconfirmedReceiptsCleared": {
          "projectedLiquid": 700000,
          "netAmount": -100000,
          "isShortfall": true,
          "shortfallAmount": 100000,
          "surplusAmount": 0,
          "statusText": "Potential shortfall of ₹1,000.00 if unconfirmed receipts clear",
          "description": "Conditional projection assuming all pending or unconfirmed receipts arrive and become available."
        },
        "hypotheticals": [
          {
            "name": "Side Gig Bonus",
            "projectedNet": 50000,
            "isShortfall": false,
            "shortfallAmount": 0,
            "surplusAmount": 50000,
            "statusText": "Projected surplus of ₹500.00"
          }
        ]
      },
      "explanation": {
        "calculationFormula": "Primary Net = Total Confirmed Liquid (₹5,000.00) - Upcoming Expenses (₹8,000.00)",
        "breakdown": [
          "Confirmed available funds: ₹5,000.00",
          "Upcoming expenses due: ₹8,000.00",
          "Unconfirmed receipts excluded from primary: ₹2,000.00"
        ],
        "assumptions": [
          "Unconfirmed receipts are strictly excluded from the primary forecast until verified.",
          "All listed upcoming expenses are assumed payable in full on their designated due dates.",
          "Double-counting is prevented across financial activities and cash-flow items.",
          "Estimates do not represent guaranteed financial outcomes or credit advice."
        ]
      },
      "disclaimer": "This cash-flow projection is an informational calculation based on user-provided and unverified records. It does not constitute financial, investment, or credit advice and does not guarantee future account balances."
    }
  }
  ```
- **Validation:** Zod schema validation ensures amounts are non-negative integer minor units (paise). Excludes unconfirmed receipts from primary forecast.
- **Error Codes:** `400 Bad Request`, `401 Unauthorized` (for user-specific GET), `500 Internal Server Error`.
- **Status:** **Implemented & Verified** (Phase 5)

## 5. Create Payment Case
- **Endpoint:** `/api/payment-cases`
- **Method:** `POST`
- **Purpose:** Records a user-reported payment issue (e.g. failed, pending, delayed, debited but not credited), creates or links a FinancialActivity record, and provides immediate provider-tailored guidance and official dispute channels.
- **Headers:**
  - `x-user-id`: string (required) - Authenticated user identifier.
- **Request Schema:**
  ```json
  {
    "issueType": "FAILED" | "PENDING" | "DELAYED" | "DEBITED_NOT_CREDITED",
    "amount": "integer (positive, minor units / paise)",
    "currency": "string (optional, default 'INR')",
    "type": "EXPENSE" | "INCOME" (optional, default 'EXPENSE'),
    "date": "string (ISO 8601 DateTime)",
    "referenceNumber": "string (optional, alphanumeric 6-50 chars)",
    "nextActionDate": "string (optional, ISO 8601 DateTime)"
  }
  ```
- **Response Schema (Success - 201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "case": {
        "id": "string (UUID)",
        "financialActivityId": "string (UUID)",
        "issueType": "FAILED | PENDING | DELAYED | DEBITED_NOT_CREDITED",
        "resolutionStatus": "OPEN",
        "nextActionDate": "string (ISO 8601) | null",
        "createdAt": "string (ISO 8601)",
        "updatedAt": "string (ISO 8601)",
        "financialActivity": {
          "id": "string (UUID)",
          "userId": "string",
          "type": "EXPENSE | INCOME",
          "amount": 100000,
          "currency": "INR",
          "status": "FAILED | UNCONFIRMED",
          "date": "string (ISO 8601)",
          "referenceNumber": "string | null"
        }
      },
      "verification": {
        "reportedStatus": "FAILED | PENDING | DELAYED | DEBITED_NOT_CREDITED",
        "verifiedStatus": "UNVERIFIED",
        "isIndependentlyVerified": false,
        "verificationSource": "None (No direct bank integration)"
      },
      "guidance": {
        "title": "string",
        "explanation": "string",
        "expectedTimeline": "string",
        "recommendedActions": ["string"],
        "supportChannels": ["string"]
      },
      "disclaimer": "YUKTHI is an independent guidance and tracking assistant. YUKTHI does not have direct access to banking systems, does not verify transactions with your bank, and cannot reverse, settle, or refund transactions. Statuses shown are user-reported and not independently verified. Processing times and resolution procedures vary by payment provider and method. Never share OTPs, UPI PINs, or passwords with anyone, including support staff."
    }
  }
  ```
- **Validation:** Zod validation enforces allowed `issueType` enums, positive integer `amount` in minor units, valid ISO date strings, and rejection of sensitive credentials in `referenceNumber`.
- **Error Codes:**
  - `400 Bad Request`: Validation failure or sensitive credentials detected.
  - `401 Unauthorized`: Missing `x-user-id` header.
  - `500 Internal Server Error`: Unexpected server or database error.
- **Status:** **Implemented & Verified** (Phase 4)

## 6. List Payment Cases (History)
- **Endpoint:** `/api/payment-cases`
- **Method:** `GET`
- **Purpose:** Retrieves the authenticated user's payment cases and follow-up history.
- **Headers:**
  - `x-user-id`: string (required) - Authenticated user identifier.
- **Response Schema (Success - 200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "cases": [
        {
          "id": "string (UUID)",
          "financialActivityId": "string (UUID)",
          "issueType": "string",
          "resolutionStatus": "OPEN | IN_PROGRESS | RESOLVED | CLOSED",
          "nextActionDate": "string | null",
          "createdAt": "string",
          "updatedAt": "string",
          "financialActivity": {
            "id": "string",
            "type": "string",
            "amount": 100000,
            "currency": "INR",
            "status": "string",
            "date": "string",
            "referenceNumber": "string | null"
          },
          "isIndependentlyVerified": false
        }
      ],
      "disclaimer": "All listed cases reflect user-reported statuses. YUKTHI does not verify bank transaction states or execute reversals."
    }
  }
  ```
- **Error Codes:** `401 Unauthorized`, `500 Internal Server Error`.
- **Status:** **Implemented & Verified** (Phase 4)

## 7. Get Payment Case Details
- **Endpoint:** `/api/payment-cases/[id]`
- **Method:** `GET`
- **Purpose:** Retrieves details, history, and status-specific guidance for a specific payment case.
- **Headers:**
  - `x-user-id`: string (required) - Authenticated user identifier.
- **Response Schema (Success - 200 OK):**
  Same structure as case creation response including `case`, `verification`, `guidance`, and `disclaimer`.
- **Error Codes:**
  - `401 Unauthorized`: Missing user credentials.
  - `403 Forbidden`: User does not own this payment case.
  - `404 Not Found`: Case does not exist.
  - `500 Internal Server Error`.
- **Status:** **Implemented & Verified** (Phase 4)

## 8. Update Payment Case Follow-up Status
- **Endpoint:** `/api/payment-cases/[id]`
- **Method:** `PATCH`
- **Purpose:** Updates the follow-up resolution status, next action review date, or reference number for a payment case, validating permitted status transitions.
- **Headers:**
  - `x-user-id`: string (required) - Authenticated user identifier.
- **Request Schema:**
  ```json
  {
    "resolutionStatus": "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" (optional),
    "nextActionDate": "string (ISO 8601 DateTime) | null" (optional),
    "referenceNumber": "string (optional, alphanumeric 6-50 chars)"
  }
  ```
- **Permitted Status Transitions:**
  - `OPEN` -> `IN_PROGRESS`, `RESOLVED`, `CLOSED`
  - `IN_PROGRESS` -> `OPEN`, `RESOLVED`, `CLOSED`
  - `RESOLVED` -> `CLOSED`, `OPEN`
  - `CLOSED` -> `OPEN`
- **Response Schema (Success - 200 OK):**
  Updated payment case object with refreshed guidance, status transition note, and disclaimers.
- **Error Codes:**
  - `400 Bad Request`: Invalid transition or malformed payload.
  - `401 Unauthorized`: Missing user credentials.
  - `403 Forbidden`: User does not own this payment case.
  - `404 Not Found`: Case does not exist.
  - `500 Internal Server Error`.
- **Status:** **Implemented & Verified** (Phase 4)

## 9. Cash-Flow Items (List and Create)
- **Endpoint:** `/api/cash-flow/items`
- **Methods:** `GET`, `POST`
- **Purpose:** Manages upcoming expenses and expected income items for the user's cash-flow schedule.
- **GET Request:**
  - **Headers:** `x-user-id: string` (required).
  - **Response Schema (200 OK):**
    ```json
    {
      "success": true,
      "data": {
        "items": [
          {
            "id": "string (UUID)",
            "userId": "string",
            "amount": 800000,
            "currency": "INR",
            "isIncome": false,
            "isConfirmed": false,
            "dueDate": "2026-10-15T00:00:00.000Z",
            "createdAt": "string",
            "updatedAt": "string"
          }
        ]
      }
    }
    ```
- **POST Request:**
  - **Headers:** `x-user-id: string` (required).
  - **Request Schema:**
    ```json
    {
      "amount": 800000,
      "currency": "INR",
      "isIncome": false,
      "isConfirmed": false,
      "dueDate": "2026-10-15T00:00:00.000Z"
    }
    ```
  - **Validation:** Positive integer amount in minor units, valid ISO date if provided.
  - **Response Schema (201 Created):** Created `CashFlowItem` object.
  - **Error Codes:** `400 Bad Request`, `401 Unauthorized`, `500 Internal Server Error`.
  - **Status:** **Implemented & Verified** (Phase 5)

## 10. Update or Delete Cash-Flow Item
- **Endpoint:** `/api/cash-flow/items/[id]`
- **Methods:** `PATCH`, `DELETE`
- **Purpose:** Updates confirmation status (e.g. confirming an unconfirmed receipt), amount, or due date, or deletes an item.
- **Headers:** `x-user-id: string` (required).
- **PATCH Request Schema:**
  ```json
  {
    "amount": 800000,
    "isConfirmed": true,
    "dueDate": "2026-10-15T00:00:00.000Z"
  }
  ```
- **Response Schema (200 OK):** Updated item.
- **DELETE Response Schema (200 OK):** Deletion confirmation.
- **Error Codes:** `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal Server Error`.
- **Status:** **Implemented & Verified** (Phase 5)

## 11. Get Action Centre Items
- **Endpoint:** `/api/action-centre`
- **Method:** `GET`
- **Purpose:** Computes and retrieves a prioritized list of user follow-up actions and risk alerts by dynamically joining unresolved Payment Cases, Cash-Flow Shortfalls, Unconfirmed Receipts, and High-Risk Scam Assessments.
- **Headers:**
  - `x-user-id: string` (required).
- **Response Schema (Success - 200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "summary": {
        "totalActions": 2,
        "highUrgencyCount": 1,
        "mediumUrgencyCount": 1,
        "lowUrgencyCount": 0
      },
      "items": [
        {
          "id": "action-pc-uuid",
          "type": "PAYMENT_FOLLOW_UP",
          "title": "Follow up on delayed payment (₹2,000.00)",
          "description": "Payment marked as DELAYED is still pending resolution with bank.",
          "urgency": "HIGH",
          "status": "PENDING",
          "targetDate": "2026-10-10T10:00:00.000Z",
          "sourceEntity": {
            "entityType": "PAYMENT_CASE",
            "entityId": "case-uuid"
          },
          "actionPrompt": "Contact bank with reference UTR12345678",
          "metadata": {
            "amount": 200000,
            "currency": "INR",
            "issueType": "DELAYED"
          }
        }
      ]
    }
  }
  ```
- **Error Codes:** `401 Unauthorized`, `500 Internal Server Error`.
- **Status:** **Implemented & Verified** (Phase 6)

## 12. Resolve Action Centre Item
- **Endpoint:** `/api/action-centre/resolve`
- **Method:** `POST`
- **Purpose:** Atomically resolves an action item by delegating state updates to the underlying entity (e.g. marking PaymentCase as RESOLVED, confirming FinancialActivity status, or acknowledging notice) within an ACID transaction.
- **Headers:**
  - `x-user-id: string` (required).
- **Request Schema:**
  ```json
  {
    "actionId": "action-pc-uuid",
    "entityType": "PAYMENT_CASE | FINANCIAL_ACTIVITY | CASH_FLOW",
    "entityId": "uuid"
  }
  ```
- **Response Schema (Success - 200 OK):**
  ```json
  {
    "success": true,
    "message": "Action item resolved and underlying records updated",
    "data": {
      "actionId": "action-pc-uuid",
      "resolved": true,
      "updatedAt": "string"
    }
  }
  ```
- **Error Codes:** `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal Server Error`.
- **Status:** **Implemented & Verified** (Phase 6)


