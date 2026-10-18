export type PaymentIssueType = 'FAILED' | 'PENDING' | 'DELAYED' | 'DEBITED_NOT_CREDITED';

export interface OfficialPortal {
  name: string;
  url: string;
  description: string;
}

export interface PaymentGuidance {
  title: string;
  explanation: string;
  expectedTimeline: string;
  tatCategory: string;
  estimatedResolutionHours: number;
  statutoryCompensation: string;
  recommendedActions: string[];
  recommendedSteps: string[];
  supportChannels: string[];
  officialPortals: OfficialPortal[];
  escalationWarning?: string;
}

export const PAYMENT_ASSISTANT_DISCLAIMER =
  "YUKTHI is an independent guidance and tracking assistant. YUKTHI does not have direct access to banking systems, does not verify transactions with your bank, and cannot reverse, settle, or refund transactions. Statuses shown are user-reported and not independently verified. Processing times and resolution procedures vary by payment provider and method. Never share OTPs, UPI PINs, or passwords with anyone, including support staff.";

const GUIDANCE_MAP: Record<PaymentIssueType, PaymentGuidance> = {
  FAILED: {
    title: "Payment Failed",
    explanation:
      "The payment attempt was declined or terminated. If your bank account was debited, the transaction amount is held in transit and scheduled for an automated reversal by the remitting bank or payment gateway.",
    expectedTimeline:
      "UPI reversals typically complete within T+1 working days per NPCI guidelines. IMPS, NEFT, and card transaction reversals usually reflect within 2 to 5 business days depending on interbank settlement cycles.",
    tatCategory: "T+1 Working Days (Auto-Reversal)",
    estimatedResolutionHours: 24,
    statutoryCompensation: "₹100/day customer compensation mandated under RBI DPSS framework if reversal exceeds T+1 business days.",
    recommendedActions: [
      "Do not retry the transaction repeatedly to prevent accidental duplicate debits.",
      "Check your mini-statement or net banking transaction history to verify if an automatic reversal has already been credited.",
      "Record the 12-digit UTR or transaction ID from your SMS or banking alert for dispute reference.",
      "If the debited amount is not refunded within 5 banking working days, lodge a formal dispute with your remitting bank."
    ],
    recommendedSteps: [
      "Do not retry the transaction repeatedly to prevent accidental duplicate debits.",
      "Check mini-statement or bank app to verify if automatic reversal already credited.",
      "Record the 12-digit UTR / transaction ID from your SMS or banking alert.",
      "If debited amount is not refunded within T+1 days, lodge formal dispute with remitting bank."
    ],
    supportChannels: [
      "Your remitting bank's 24x7 customer support helpline (phone number printed on the back of your debit card)",
      "In-app support of your payment application (e.g., BHIM, Google Pay, PhonePe, Paytm)",
      "National Payments Corporation of India (NPCI) Dispute Redressal Portal at npci.org.in",
      "RBI Banking Ombudsman portal (cms.rbi.org.in) for grievances unresolved after 30 days"
    ],
    officialPortals: [
      {
        name: "NPCI UPI Dispute Redressal",
        url: "https://www.npci.org.in/what-we-do/upi/dispute-redressal-mechanism",
        description: "Official National Payments Corporation of India portal for tracking failed or stuck UPI transactions."
      },
      {
        name: "RBI Complaint Management System (CMS)",
        url: "https://cms.rbi.org.in",
        description: "Statutory Banking Ombudsman portal to file complaints against banks for delayed reversals."
      },
      {
        name: "DigiSaathi 24x7 Helpline",
        url: "https://digisaathi.info",
        description: "Consortium helpline (14431 / 1800 891 3333) for digital payment products and grievance guidance."
      }
    ],
    escalationWarning: "If auto-reversal is not completed within T+1 days, bank is statutory liable to compensate ₹100 per day."
  },
  PENDING: {
    title: "Payment Pending",
    explanation:
      "The payment is in an intermediate state awaiting final confirmation between your issuing bank, the interbank payment switch, and the beneficiary bank.",
    expectedTimeline:
      "Most pending UPI and IMPS payments either settle or decline automatically within 2 to 24 hours. Card transactions may take up to 48 hours for batch clearing.",
    tatCategory: "2 to 24 Hours (Switch Clearing)",
    estimatedResolutionHours: 12,
    statutoryCompensation: "Auto-declines and initiates reversal within 24 hours if switch confirmation is not received.",
    recommendedActions: [
      "Wait for the transaction timeout window (at least 2 hours) before re-attempting payment to prevent duplicate debits.",
      "Check your bank SMS or mobile banking notifications to observe whether your account was debited.",
      "Contact the recipient and advise them to check their account balance, as funds sometimes credit before status updates in your payment app.",
      "Keep the transaction reference number handy while waiting for the final settlement status."
    ],
    recommendedSteps: [
      "Wait for the transaction timeout window (at least 2 hours) before re-attempting payment.",
      "Check bank SMS / notifications to confirm whether money was actually debited.",
      "Ask beneficiary to verify their account balance as credits can happen before app status syncs.",
      "Retain UPI reference number while waiting for switch reconciliation."
    ],
    supportChannels: [
      "In-app 'Check Status' or 'Help with this transaction' button inside your payment application",
      "Remitting bank customer care helpline"
    ],
    officialPortals: [
      {
        name: "NPCI Dispute Redressal Portal",
        url: "https://www.npci.org.in/what-we-do/upi/dispute-redressal-mechanism",
        description: "Official NPCI portal for tracking pending transactions and switch clearance status."
      },
      {
        name: "DigiSaathi Payment Helpline",
        url: "https://digisaathi.info",
        description: "24x7 initiative by NPCI & RBI for guidance on pending digital payments (Dial 14431)."
      }
    ],
    escalationWarning: "Avoid sending a repeat payment immediately; pending transactions can clear and cause duplicate debits."
  },
  DELAYED: {
    title: "Payment Delayed",
    explanation:
      "The payment is experiencing processing delays due to network congestion, batch processing intervals (such as NEFT settlement batches), or temporary bank core banking server latency.",
    expectedTimeline:
      "NEFT transactions process in half-hour batches during operating hours. UPI and IMPS transactions normally resolve once server congestion subsides, usually within 2 to 12 hours.",
    tatCategory: "2 to 12 Hours (Batch Settlement)",
    estimatedResolutionHours: 8,
    statutoryCompensation: "Standard batch settlement cycle; eligible for banking grievance escalation if delayed >24 hours.",
    recommendedActions: [
      "Verify the payment mode used (UPI, IMPS, NEFT, or RTGS) as settlement cycles vary significantly.",
      "Share the 12-digit UPI reference number (UTR) with the recipient so their bank branch can trace incoming credits.",
      "Avoid initiating a second payment until the delayed transaction either confirms or reverses.",
      "If more than 24 hours elapse without credit or reversal, request a transaction status tracker from your bank."
    ],
    recommendedSteps: [
      "Identify exact transfer route (UPI vs IMPS vs NEFT batch) to determine expected clearance.",
      "Share 12-digit UTR with the beneficiary so their receiving bank branch can trace clearing queues.",
      "Do not re-initiate payment until this transaction's status stabilizes to avoid duplicate deduction.",
      "Request a bank status tracker if delay exceeds 24 hours."
    ],
    supportChannels: [
      "Remitting bank branch manager or customer grievance desk",
      "Beneficiary bank customer service with the provided UTR number",
      "Payment service provider dispute desk"
    ],
    officialPortals: [
      {
        name: "RBI Banking Ombudsman (CMS)",
        url: "https://cms.rbi.org.in",
        description: "Escalation forum if bank fails to provide transaction trace after 24 hours."
      },
      {
        name: "NPCI UPI Portal",
        url: "https://www.npci.org.in/what-we-do/upi/dispute-redressal-mechanism",
        description: "Status verification for interbank UPI switch transfers."
      }
    ],
    escalationWarning: "If transfer is not completed after 24 hours, bank must furnish written transaction acknowledgment."
  },
  DEBITED_NOT_CREDITED: {
    title: "Amount Debited but Recipient Not Credited",
    explanation:
      "Money was successfully deducted from your bank account, but the beneficiary's bank has not yet credited their account. This occurs during interbank reconciliation delays where the beneficiary switch has not acknowledged the credit.",
    expectedTimeline:
      "Under Reserve Bank of India (RBI) Harmonisation of Turnaround Time (TAT) regulations, failed interbank transactions where account is debited must be reversed within T+1 working days. Penalty compensation of ₹100 per day applies for delays beyond the mandated TAT.",
    tatCategory: "T+1 Working Days (Mandatory Auto-Reversal)",
    estimatedResolutionHours: 24,
    statutoryCompensation: "Mandatory ₹100 per day penalty payable by bank to customer for every day of delay beyond T+1.",
    recommendedActions: [
      "Obtain and note down the 12-digit UPI Transaction Reference (UTR) number from your bank statement or app receipt.",
      "Provide the UTR number to the recipient to check with their bank branch's clearing department.",
      "Raise an in-app dispute with your UPI application under 'Money debited but not received by recipient'.",
      "If unresolved after T+1 business days, submit a formal written complaint with your bank citing the UTR, timestamp, and amount."
    ],
    recommendedSteps: [
      "Obtain and copy the 12-digit UPI Transaction Reference (UTR) number from your bank statement.",
      "Share UTR with the recipient to confirm with their receiving bank's credit department.",
      "Lodge an in-app complaint in your payment app citing 'Money debited but not credited to recipient'.",
      "If not reversed within T+1 days, demand RBI mandated ₹100/day delay compensation via bank grievance desk."
    ],
    supportChannels: [
      "In-app dispute redressal in your UPI application (BHIM, Google Pay, PhonePe, Paytm, etc.)",
      "Remitting bank grievance redressal cell / Nodal Officer",
      "Beneficiary bank customer support desk with UTR reference",
      "RBI Complaint Management System (CMS) at cms.rbi.org.in"
    ],
    officialPortals: [
      {
        name: "NPCI Dispute Redressal Mechanism",
        url: "https://www.npci.org.in/what-we-do/upi/dispute-redressal-mechanism",
        description: "Official NPCI portal to raise complaint for UPI transactions debited but not credited."
      },
      {
        name: "RBI Complaint Management System (CMS)",
        url: "https://cms.rbi.org.in",
        description: "Lodge statutory claim for ₹100/day compensation if bank fails to auto-reverse in T+1 days."
      },
      {
        name: "National Consumer Helpline (NCH)",
        url: "https://consumerhelpline.gov.in",
        description: "Government consumer redressal portal (Toll-free 1915) for deficient financial services."
      }
    ],
    escalationWarning: "Under RBI circular DPSS.CO.PD No.629/02.01.014/2019-20, customer is entitled to ₹100 per day auto-compensation if not reversed by T+1."
  }
};

export function getPaymentGuidance(issueType: PaymentIssueType): PaymentGuidance {
  const guidance = GUIDANCE_MAP[issueType];
  if (!guidance) {
    return GUIDANCE_MAP.PENDING;
  }
  return guidance;
}

export function getVerificationStatus(reportedStatus: string) {
  return {
    reportedStatus,
    verifiedStatus: "UNVERIFIED" as const,
    isIndependentlyVerified: false,
    verificationSource: "None (No direct bank integration configured)"
  };
}

/**
 * Validates that reference numbers or text inputs do NOT contain sensitive banking credentials
 * such as OTPs, UPI PINs, ATM PINs, CVV, or passwords.
 */
export function containsSensitiveCredentials(text?: string | null): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  
  // Explicit prohibited keywords
  const sensitiveKeywords = [
    'otp',
    'pin',
    'password',
    'passcode',
    'cvv',
    'cvc',
    'mpin',
    'upipin',
    'atm pin'
  ];
  
  for (const keyword of sensitiveKeywords) {
    if (lower.includes(keyword)) {
      return true;
    }
  }

  return false;
}
