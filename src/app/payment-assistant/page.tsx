'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { FormField } from '@/components/ui/FormField';
import { Alert } from '@/components/ui/Alert';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { apiClient } from '@/lib/apiClient';
import {
  formatCurrency,
  formatDate,
  rupeesToPaise,
} from '@/lib/formatters';
import {
  PaymentCaseItem,
  PaymentIssueType,
  ResolutionStatus,
} from '@/types/api';
import { useUserSession } from '@/hooks/useUserSession';

const ISSUE_TYPE_LABELS: Record<PaymentIssueType, string> = {
  DEBITED_NOT_CREDITED: 'Debited but Not Credited',
  DELAYED: 'Delayed Incoming Transfer',
  PENDING: 'Transaction Stuck in Pending',
  FAILED: 'Failed / Timed Out Payment',
};

export interface TransactionStatusInfo {
  state: 'PENDING' | 'DELAYED' | 'FAILED' | 'DEBITED_NOT_CREDITED' | 'SUCCESS' | 'CLOSED';
  title: string;
  pillLabel: string;
  badgeVariant: 'warning' | 'danger' | 'success' | 'info';
  bgClass: string;
  borderClass: string;
  textClass: string;
  accentClass: string;
  icon: string;
  meaning: string;
  nextStep: string;
  guidelineNote: string;
  reasonTitle?: string;
  reasonDescription?: string;
  statutoryRule?: string;
}

export function getTransactionStatusInfo(c: PaymentCaseItem): TransactionStatusInfo {
  if (c.resolutionStatus === 'RESOLVED' || c.financialActivity?.status === 'CONFIRMED') {
    return {
      state: 'SUCCESS',
      title: 'Payment Succeeded / Resolved',
      pillLabel: '✓ Resolved',
      badgeVariant: 'success',
      bgClass: 'bg-[#F0FDF4]',
      borderClass: 'border-[#BBF7D0]',
      textClass: 'text-[#166534]',
      accentClass: 'bg-[#16A34A]',
      icon: '✓',
      meaning: 'The payment was completed or your bank has credited the refund back to your account.',
      nextStep: 'No further action needed. Keep your bank statement or SMS for your records.',
      guidelineNote: 'Transaction resolved.',
      reasonTitle: 'Payment Resolved',
      reasonDescription: 'The recipient received the funds or the bank completed an auto-reversal to your account.',
      statutoryRule: 'Transaction successfully closed.',
    };
  }

  if (c.resolutionStatus === 'CLOSED') {
    return {
      state: 'CLOSED',
      title: 'Dispute Closed',
      pillLabel: 'Closed',
      badgeVariant: 'info',
      bgClass: 'bg-[#F8FAFC]',
      borderClass: 'border-[#CBD5E1]',
      textClass: 'text-[#475569]',
      accentClass: 'bg-[#64748B]',
      icon: '📁',
      meaning: 'This payment check record has been closed.',
      nextStep: 'You can submit a new check anytime if you experience another payment issue.',
      guidelineNote: 'Case archived.',
      reasonTitle: 'Tracking Concluded',
      reasonDescription: 'This payment check record has been closed.',
      statutoryRule: 'Case archived.',
    };
  }

  switch (c.issueType) {
    case 'PENDING':
      return {
        state: 'PENDING',
        title: 'Payment Pending / Processing',
        pillLabel: '⏳ Processing',
        badgeVariant: 'warning',
        bgClass: 'bg-[#FFFBEB]',
        borderClass: 'border-[#FDE68A]',
        textClass: 'text-[#92400E]',
        accentClass: 'bg-[#D97706]',
        icon: '⏳',
        meaning:
          'Your bank initiated the transfer, but confirmation has not yet arrived from the payment network. Most pending transfers clear automatically within 2 to 24 hours.',
        nextStep:
          'Wait 2 to 24 hours before retrying the payment to prevent accidental duplicate payments.',
        guidelineNote:
          'Regulatory guidelines recommend banks resolve pending switch transfers within 24 hours.',
        reasonTitle: 'What this means:',
        reasonDescription:
          'Your bank initiated the transfer, but confirmation has not yet arrived from the payment network. Most pending transfers clear automatically within 2 to 24 hours.',
        statutoryRule: 'Standard resolution window is 2 to 24 hours.',
      };

    case 'DELAYED':
      return {
        state: 'DELAYED',
        title: 'Transfer Delayed',
        pillLabel: '⏱️ Delayed',
        badgeVariant: 'warning',
        bgClass: 'bg-[#FFF7ED]',
        borderClass: 'border-[#FED7AA]',
        textClass: 'text-[#9A3412]',
        accentClass: 'bg-[#EA580C]',
        icon: '⏱️',
        meaning:
          'The transfer is in transit between banks. High server traffic or batch clearance intervals can cause delays in crediting.',
        nextStep:
          'Allow up to 1 working day for processing. If money has not arrived, ask the receiver to verify their bank statement.',
        guidelineNote:
          'Interbank transfers typically settle within standard working hours.',
        reasonTitle: 'What this means:',
        reasonDescription:
          'The transfer is in transit between banks. High server traffic or batch clearance intervals can cause delays in crediting.',
        statutoryRule: 'Interbank transfers typically settle within standard working hours.',
      };

    case 'DEBITED_NOT_CREDITED':
      return {
        state: 'DEBITED_NOT_CREDITED',
        title: 'Money Deducted, Not Received',
        pillLabel: '⚠️ Needs Attention',
        badgeVariant: 'danger',
        bgClass: 'bg-[#FEF2F2]',
        borderClass: 'border-[#FECACA]',
        textClass: 'text-[#991B1B]',
        accentClass: 'bg-[#DC2626]',
        icon: '⚠️',
        meaning:
          'Money was deducted from your account, but the recipient bank has not confirmed receipt due to a session timeout.',
        nextStep:
          'Wait 1 to 2 business days for the automated bank refund. If funds are not returned, contact your bank with your 12-digit UTR reference number.',
        guidelineNote:
          'Under RBI guidelines, banks follow standard auto-reversal timelines (typically T+1 working days). If delayed beyond guidelines, you may request compensation from your bank.',
        reasonTitle: 'What this means:',
        reasonDescription:
          'Money was deducted from your account, but the recipient bank has not confirmed receipt due to a session timeout.',
        statutoryRule:
          'RBI guidelines recommend auto-reversal within T+1 working days.',
      };

    case 'FAILED':
    default:
      return {
        state: 'FAILED',
        title: 'Payment Failed',
        pillLabel: '❌ Failed',
        badgeVariant: 'danger',
        bgClass: 'bg-[#FEF2F2]',
        borderClass: 'border-[#FECACA]',
        textClass: 'text-[#991B1B]',
        accentClass: 'bg-[#DC2626]',
        icon: '❌',
        meaning:
          'The payment could not be completed. Any deducted amount is held in transit and typically returns automatically to your bank account.',
        nextStep:
          'Check your bank account for an auto-reversal within 1 to 2 business days. If funds are not refunded, contact your bank.',
        guidelineNote:
          'RBI framework expects failed transactions to be reversed within T+1 working days.',
        reasonTitle: 'What this means:',
        reasonDescription:
          'The payment could not be completed. Any deducted amount is held in transit and typically returns automatically to your bank account.',
        statutoryRule:
          'RBI framework expects failed transactions to be reversed within T+1 working days.',
      };
  }
}

export default function PaymentAssistantPage() {
  const { userId } = useUserSession();
  const [cases, setCases] = useState<PaymentCaseItem[]>([]);
  const [disclaimer, setDisclaimer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(true);
  const [selectedCase, setSelectedCase] = useState<PaymentCaseItem | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Form State
  const [issueType, setIssueType] = useState<PaymentIssueType>('DEBITED_NOT_CREDITED');
  const [rupeesAmount, setRupeesAmount] = useState<string>('');
  const [refNumber, setRefNumber] = useState<string>('');
  const [transactionDate, setTransactionDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  const loadCases = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.paymentCases.list();
      if (res.success && res.data) {
        const rawList = (res.data.cases || (res.data as any).paymentCases || []) as any[];
        const normalized: PaymentCaseItem[] = rawList.map((item: any) => {
          if (item && item.case) {
            return {
              ...item.case,
              notes: item.case.notes || item.case.issueDescription || null,
              guidance: item.guidance || item.case.guidance,
              verification: item.verification,
              disclaimer: item.disclaimer,
            };
          }
          return item;
        });
        setCases(normalized);
        if (res.data.disclaimer) setDisclaimer(res.data.disclaimer);
      } else {
        setError(res.error || 'Failed to load payment cases.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error contacting payment service.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, [userId]);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent duplicate submission

    setFormError(null);

    const parsedRupees = parseFloat(rupeesAmount);
    if (isNaN(parsedRupees) || parsedRupees <= 0) {
      setFormError('Please enter a valid positive transaction amount in INR. Example: ₹500.');
      return;
    }

    // Security check: Never submit credentials
    const cleanRef = refNumber.trim();
    const cleanNotes = notes.trim();
    const containsSecret = /pin|otp|password|cvv/i;
    if (containsSecret.test(cleanRef) || containsSecret.test(cleanNotes)) {
      setFormError(
        'Security Alert: Your reference number or notes appear to contain sensitive credentials (PIN, OTP, password, or CVV). Please remove them before continuing.'
      );
      return;
    }

    const amountInPaise = rupeesToPaise(parsedRupees);
    setIsSubmitting(true);

    try {
      let isoDate = new Date().toISOString();
      if (transactionDate) {
        const parsed = new Date(transactionDate);
        if (!isNaN(parsed.getTime())) {
          isoDate = parsed.toISOString();
        }
      }

      const res = await apiClient.paymentCases.create({
        issueType,
        amount: amountInPaise,
        date: isoDate,
        referenceNumber: cleanRef || null,
        notes: cleanNotes || null,
      });

      if (res.success) {
        setShowForm(false);
        setRupeesAmount('');
        setRefNumber('');
        setTransactionDate('');
        setNotes('');
        await loadCases();
      } else {
        const userFriendlyMsg = res.error || 'Unable to check this payment right now.';
        setFormError(`${userFriendlyMsg} What you can do next: check your transaction reference number or retry after a moment.`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error creating case.';
      setFormError(`${msg} Please check your connection and retry.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (caseId: string, newStatus: ResolutionStatus) => {
    if (isUpdatingStatus) return; // Prevent duplicate concurrent status update
    setIsUpdatingStatus(true);
    try {
      const res = await apiClient.paymentCases.update(caseId, {
        resolutionStatus: newStatus,
      });

      if (res.success) {
        await loadCases();
        if (selectedCase && selectedCase.id === caseId) {
          setSelectedCase({
            ...selectedCase,
            resolutionStatus: newStatus,
          });
        }
      } else {
        setError(res.error || 'Failed to update case status. Please refresh and retry.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error while updating case status.';
      setError(`${msg} Please check your connection and retry.`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Header */}
        <PageHeader
          title="Payment Help"
          description="Get help with failed, delayed, or missing payments."
          breadcrumbs={[{ label: 'Payment Help' }]}
          actions={
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setShowForm((prev) => !prev);
                setFormError(null);
              }}
            >
              {showForm ? 'Hide Payment Check' : '+ Check a Payment'}
            </Button>
          }
        />

        {error && (
          <Alert variant="danger" title="Service Alert" onClose={() => setError(null)}>
            <div className="flex items-center justify-between gap-4">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={loadCases}>
                Retry
              </Button>
            </div>
          </Alert>
        )}

        {/* 1. Payment Check Section */}
        {showForm && (
          <div className="rounded-2xl border border-[#CBD5E1] bg-white p-6 shadow-sm space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center gap-3 pb-4 border-b border-[#F1F5F9]">
              <div className="w-9 h-9 rounded-xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center font-bold text-base shrink-0">
                ₹
              </div>
              <div>
                <h2 className="text-base font-bold text-[#0F2744]">Payment Check</h2>
                <p className="text-xs text-[#64748B]">
                  Enter your payment details below to check the status.
                </p>
              </div>
            </div>

            {formError && (
              <Alert variant="danger" onClose={() => setFormError(null)}>
                {formError}
              </Alert>
            )}

            <form onSubmit={handleCreateCase} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Payment Issue" required>
                  <Select
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value as PaymentIssueType)}
                  >
                    <option value="DEBITED_NOT_CREDITED">Money deducted, but receiver did not get it</option>
                    <option value="DELAYED">Money sent, but delayed or not received</option>
                    <option value="PENDING">Payment is pending or processing</option>
                    <option value="FAILED">Payment failed or timed out</option>
                  </Select>
                </FormField>

                <FormField label="Amount (₹)" required>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="e.g. 500"
                    value={rupeesAmount}
                    onChange={(e) => setRupeesAmount(e.target.value)}
                    required
                  />
                </FormField>

                <FormField label="Payment Date & Time">
                  <Input
                    type="datetime-local"
                    value={transactionDate}
                    onChange={(e) => setTransactionDate(e.target.value)}
                  />
                </FormField>

                <FormField label="UTR / Reference Number">
                  <Input
                    placeholder="e.g. 12-digit number (429381726354)"
                    maxLength={50}
                    value={refNumber}
                    onChange={(e) => setRefNumber(e.target.value)}
                  />
                </FormField>

                <div className="md:col-span-2">
                  <FormField label="Notes / App Used (Optional)">
                    <Input
                      placeholder="e.g. Paid via Google Pay to merchant"
                      maxLength={500}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </FormField>
                </div>
              </div>

              {/* Safety Notice */}
              <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B] flex items-center gap-2.5">
                <svg className="w-4 h-4 text-[#DC2626] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  <strong>Safe & Secure:</strong> Never enter your UPI PIN, banking password, or OTP. YUKTHI will never ask for your secret PIN.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F1F5F9]">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setShowForm(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button variant="primary" type="submit" isLoading={isSubmitting}>
                  Check Payment
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Results / Tracked Payment Checks */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#0F2744]">Payment Status & Results</h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                {cases.length} payment check(s) recorded
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <CardSkeleton rows={2} />
              <CardSkeleton rows={2} />
            </div>
          ) : cases.length === 0 ? (
            <EmptyState
              title="No Payment Checks Yet"
              description="If you experienced a failed, delayed, or missing payment, click '+ Check a Payment' to verify your status and next steps."
              action={
                <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
                  + Check a Payment
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {cases.map((c) => {
                const statusInfo = getTransactionStatusInfo(c);
                const amount = c.financialActivity?.amount ?? c.amount;
                const utr = c.referenceNumber || c.financialActivity?.referenceNumber || 'Not provided';
                const nextStep = c.guidance?.recommendedSteps?.[0] || statusInfo.nextStep;
                const portal = c.guidance?.officialPortals?.[0];

                return (
                  <div
                    key={c.id}
                    className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs hover:border-[#93C5FD] transition-all space-y-4"
                  >
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#F1F5F9]">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-sm font-bold shrink-0">
                          {statusInfo.icon}
                        </span>
                        <div>
                          <h3 className="font-bold text-sm text-[#0F2744]">
                            {statusInfo.title}
                          </h3>
                          <span className="text-xs text-[#64748B]">
                            {formatDate(c.createdAt)} • Ref: {utr}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-bold text-base text-[#0F2744]">
                          {amount ? formatCurrency(amount) : '—'}
                        </span>
                        <Badge variant={statusInfo.badgeVariant}>{statusInfo.pillLabel}</Badge>
                      </div>
                    </div>

                    {/* What this means */}
                    <div className={`p-3.5 rounded-xl border ${statusInfo.borderClass} ${statusInfo.bgClass} space-y-1.5`}>
                      <span className="font-bold text-xs text-[#0F2744] block">
                        What this means:
                      </span>
                      <p className="text-xs text-[#334155] leading-relaxed">
                        {statusInfo.meaning}
                      </p>
                    </div>

                    {/* Next step you should take */}
                    <div className="p-3.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#166534]">
                          Next step you should take:
                        </span>
                        {portal && (
                          <a
                            href={portal.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-[#0D9488] hover:underline flex items-center gap-1"
                          >
                            <span>{portal.name}</span>
                            <span>&rarr;</span>
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-[#1E293B] leading-relaxed">
                        {nextStep}
                      </p>
                    </div>

                    {/* Regulatory Guideline Note */}
                    <div className="flex items-start gap-2 text-[11px] text-[#64748B] pt-0.5">
                      <span className="text-xs shrink-0">ℹ️</span>
                      <p className="leading-relaxed">
                        <strong>Guideline:</strong> {statusInfo.guidelineNote} Status is based on reported details and unverified with core bank systems.
                      </p>
                    </div>

                    {/* Notes if provided */}
                    {c.notes && (
                      <div className="text-xs text-[#475569] bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0]">
                        <span className="font-semibold text-[11px] text-[#64748B] block mb-0.5">Your Note:</span>
                        <span>"{c.notes}"</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#F1F5F9]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs text-[#64748B] font-medium">Update status:</span>
                        {(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as ResolutionStatus[]).map((st) => (
                          <button
                            key={st}
                            disabled={isUpdatingStatus || c.resolutionStatus === st}
                            onClick={() => handleUpdateStatus(c.id, st)}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                              c.resolutionStatus === st
                                ? 'bg-[#0F2744] text-white font-semibold'
                                : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
                            }`}
                          >
                            {st === 'RESOLVED' ? '✓ Mark as Resolved' : st === 'IN_PROGRESS' ? 'In Progress' : st === 'CLOSED' ? 'Closed' : 'Open'}
                          </button>
                        ))}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedCase(c)}
                      >
                        View Details &rarr;
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Case Details Modal */}
        {selectedCase && (() => {
          const statusInfo = getTransactionStatusInfo(selectedCase);
          const amount = selectedCase.financialActivity?.amount ?? selectedCase.amount;
          const utr = selectedCase.referenceNumber || selectedCase.financialActivity?.referenceNumber || 'Not provided';
          const steps = selectedCase.guidance?.recommendedSteps && selectedCase.guidance.recommendedSteps.length > 0
            ? selectedCase.guidance.recommendedSteps
            : [statusInfo.nextStep];

          return (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="case-details-title"
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
            >
              <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-5 border-b border-[#F1F5F9] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-base font-bold">
                      {statusInfo.icon}
                    </span>
                    <div>
                      <h3 id="case-details-title" className="text-base font-bold text-[#0F2744]">
                        {statusInfo.title}
                      </h3>
                      <p className="text-xs text-[#64748B]">
                        Amount: {amount ? formatCurrency(amount) : '—'} • Ref: {utr}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedCase(null)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-[#F1F5F9] transition-colors"
                    aria-label="Close"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-4">
                  {/* Status & Meaning */}
                  <div className={`p-4 rounded-xl border ${statusInfo.borderClass} ${statusInfo.bgClass} space-y-2`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#0F2744]">
                        What this means
                      </span>
                      <Badge variant={statusInfo.badgeVariant}>{statusInfo.pillLabel}</Badge>
                    </div>
                    <p className="text-xs text-[#334155] leading-relaxed">
                      {statusInfo.meaning}
                    </p>
                  </div>

                  {/* Payment Details summary */}
                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2.5">
                    <span className="font-bold text-xs text-[#0F2744] block">
                      Payment Details
                    </span>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[#64748B] block text-[11px]">Issue</span>
                        <span className="font-semibold text-[#0F172A]">
                          {ISSUE_TYPE_LABELS[selectedCase.issueType] || selectedCase.issueType}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#64748B] block text-[11px]">Amount</span>
                        <span className="font-bold text-[#0F172A]">
                          {amount ? formatCurrency(amount) : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#64748B] block text-[11px]">Reference (UTR)</span>
                        <span className="font-mono text-[#0F172A]">{utr}</span>
                      </div>
                      <div>
                        <span className="text-[#64748B] block text-[11px]">Date</span>
                        <span className="text-[#0F172A]">{formatDate(selectedCase.createdAt)}</span>
                      </div>
                    </div>
                    {selectedCase.notes && (
                      <div className="pt-2 border-t border-[#E2E8F0] text-xs">
                        <span className="text-[#64748B] block text-[11px] mb-0.5">Your Note:</span>
                        <p className="text-[#334155] italic">"{selectedCase.notes}"</p>
                      </div>
                    )}
                  </div>

                  {/* Next Steps */}
                  <div className="space-y-2">
                    <span className="font-bold text-xs text-[#0F2744] block">
                      Next Steps
                    </span>
                    <ol className="space-y-2 text-xs text-[#334155]">
                      {steps.map((step, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0]"
                        >
                          <span className="w-5 h-5 rounded-full bg-[#16A34A] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Official Grievance Portals */}
                  {selectedCase.guidance?.officialPortals && selectedCase.guidance.officialPortals.length > 0 && (
                    <div className="space-y-2">
                      <span className="font-bold text-xs text-[#0F2744] block">
                        Official Portals & Helplines
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {selectedCase.guidance.officialPortals.map((p, idx) => (
                          <a
                            key={idx}
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3 rounded-xl border border-[#E2E8F0] hover:border-[#0284C7] bg-white transition-colors block text-xs space-y-1"
                          >
                            <div className="font-bold text-[#0284C7] flex items-center justify-between">
                              <span>{p.name}</span>
                              <span className="text-[10px]">&rarr;</span>
                            </div>
                            <p className="text-[11px] text-[#64748B] line-clamp-2">
                              {p.description}
                            </p>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Status update controls */}
                  <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                    <span className="font-bold text-xs text-[#0F2744] block">
                      Update Status
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as ResolutionStatus[]).map((status) => (
                        <Button
                          key={status}
                          variant={selectedCase.resolutionStatus === status ? 'primary' : 'outline'}
                          size="sm"
                          disabled={isUpdatingStatus || selectedCase.resolutionStatus === status}
                          onClick={() => handleUpdateStatus(selectedCase.id, status)}
                        >
                          {status === 'RESOLVED' ? '✓ Resolved' : status === 'IN_PROGRESS' ? 'In Progress' : status === 'CLOSED' ? 'Closed' : 'Open'}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Transparent notice */}
                  <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] text-[#64748B] leading-relaxed">
                    <strong>Notice:</strong> YUKTHI provides guidance based on regulatory frameworks. YUKTHI does not access banking credentials or execute direct bank reversals.
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[#F1F5F9] bg-[#F8FAFC] flex justify-end">
                  <Button variant="secondary" size="sm" onClick={() => setSelectedCase(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </AppShell>
  );
}
