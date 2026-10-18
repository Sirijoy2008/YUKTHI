/**
 * Formatters and UI Utilities for YUKTHI
 * Handles Indian Rupee (INR) currency formatting from paise (integer minor units),
 * dates, and status color tokens.
 */

import { ActionUrgency, ActivityStatus, PaymentIssueType, ResolutionStatus, RiskLevel } from '@/types/api';

/**
 * Converts paise (integer) to rupees (number with decimal)
 */
export function paiseToRupees(paise: number): number {
  return Number((paise / 100).toFixed(2));
}

/**
 * Converts rupees to paise (safe integer)
 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Formats an amount in paise to Indian Rupee string (e.g., ₹5,000 or ₹1,50,000)
 */
export function formatCurrency(
  paise: number | null | undefined,
  options?: {
    showPaise?: boolean;
    currencySymbol?: string;
  }
): string {
  if (paise === null || paise === undefined || isNaN(paise)) {
    return '₹0';
  }

  const symbol = options?.currencySymbol ?? '₹';
  const showPaise = options?.showPaise ?? (paise % 100 !== 0);
  const rupees = paise / 100;

  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: showPaise ? 2 : 0,
    maximumFractionDigits: showPaise ? 2 : 0,
  }).format(rupees);

  return `${symbol}${formatted}`;
}

/**
 * Formats an ISO 8601 date string to Indian English friendly format (e.g. 10 Oct 2026)
 */
export function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Formats date with time (e.g. 10 Oct 2026, 05:30 PM)
 */
export function formatDateTime(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Status style mapping for Risk Level
 */
export function getRiskLevelBadge(riskLevel: RiskLevel): {
  label: string;
  variant: 'success' | 'warning' | 'danger' | 'neutral';
} {
  switch (riskLevel) {
    case 'Low':
      return { label: 'Low Risk', variant: 'success' };
    case 'Medium':
      return { label: 'Medium Risk', variant: 'warning' };
    case 'High':
      return { label: 'High Risk', variant: 'danger' };
    default:
      return { label: riskLevel, variant: 'neutral' };
  }
}

/**
 * Status style mapping for Urgency
 */
export function getUrgencyBadge(urgency: ActionUrgency): {
  label: string;
  variant: 'danger' | 'warning' | 'info' | 'neutral';
} {
  switch (urgency) {
    case 'CRITICAL':
      return { label: 'Critical', variant: 'danger' };
    case 'HIGH':
      return { label: 'High Priority', variant: 'warning' };
    case 'MEDIUM':
      return { label: 'Medium', variant: 'info' };
    case 'LOW':
      return { label: 'Low', variant: 'neutral' };
    default:
      return { label: urgency, variant: 'neutral' };
  }
}

/**
 * Status style mapping for Financial Activity
 */
export function getActivityStatusBadge(status: ActivityStatus): {
  label: string;
  variant: 'success' | 'warning' | 'danger' | 'neutral';
} {
  switch (status) {
    case 'CONFIRMED':
      return { label: 'Confirmed', variant: 'success' };
    case 'UNCONFIRMED':
      return { label: 'Unconfirmed / Pending', variant: 'warning' };
    case 'FAILED':
      return { label: 'Failed', variant: 'danger' };
    default:
      return { label: status, variant: 'neutral' };
  }
}

/**
 * Status style mapping for Payment Resolution
 */
export function getResolutionStatusBadge(status: ResolutionStatus): {
  label: string;
  variant: 'success' | 'warning' | 'info' | 'danger' | 'neutral';
} {
  switch (status) {
    case 'RESOLVED':
      return { label: 'Resolved', variant: 'success' };
    case 'IN_PROGRESS':
      return { label: 'In Progress', variant: 'info' };
    case 'OPEN':
      return { label: 'Open', variant: 'warning' };
    case 'CLOSED':
      return { label: 'Closed', variant: 'neutral' };
    case 'ESCALATED':
      return { label: 'Escalated', variant: 'danger' };
    default:
      return { label: status, variant: 'neutral' };
  }
}
