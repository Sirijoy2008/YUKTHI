'use client';

import React, { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { FinancialMetricCard } from '@/components/financial/FinancialMetricCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { DataTable } from '@/components/ui/DataTable';
import { CardSkeleton, Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Tooltip } from '@/components/ui/Tooltip';
import { apiClient } from '@/lib/apiClient';
import {
  formatCurrency,
  formatDate,
  getActivityStatusBadge,
  getUrgencyBadge,
  getResolutionStatusBadge,
  getRiskLevelBadge,
} from '@/lib/formatters';
import {
  CashFlowForecastData,
  ActionCentreData,
  FinancialActivity,
  PaymentCaseItem,
} from '@/types/api';
import { useUserSession } from '@/hooks/useUserSession';

export default function DashboardPage() {
  const { userId, userName, isLoaded: isSessionLoaded } = useUserSession();
  const [forecast, setForecast] = useState<CashFlowForecastData | null>(null);
  const [actionsData, setActionsData] = useState<ActionCentreData | null>(null);
  const [activities, setActivities] = useState<FinancialActivity[]>([]);
  const [paymentCases, setPaymentCases] = useState<PaymentCaseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const [timeGreeting, setTimeGreeting] = useState('Welcome');

  const fetchDashboardData = () => {
    const currentHour = new Date().getHours();
    setTimeGreeting(
      currentHour < 12
        ? 'Good morning'
        : currentHour < 17
        ? 'Good afternoon'
        : 'Good evening'
    );
    setIsLoading(true);
    setError(null);

    Promise.all([
      apiClient.cashFlow.getForecast(),
      apiClient.actionCentre.getItems(),
      apiClient.activities.list(),
      apiClient.paymentCases.list(),
    ])
      .then(([forecastRes, actionsRes, activitiesRes, casesRes]) => {
        startTransition(() => {
          if (forecastRes.success && forecastRes.data) {
            setForecast(forecastRes.data);
          } else if (forecastRes.error) {
            // keep null to indicate no backend projection available
            setForecast(null);
          }

          if (actionsRes.success && actionsRes.data) {
            setActionsData(actionsRes.data);
          }

          if (activitiesRes.success && activitiesRes.data?.activities) {
            setActivities(activitiesRes.data.activities);
          }

          if (casesRes.success && casesRes.data?.paymentCases) {
            setPaymentCases(casesRes.data.paymentCases);
          }
        });
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to connect to backend services.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchDashboardData();
  }, [userId]);

  // Extract recent scam checks linked via activities
  const recentScamChecks = activities
    .filter((a) => a.riskAssessment)
    .map((a) => ({
      activityId: a.id,
      date: a.date,
      referenceNumber: a.referenceNumber,
      riskAssessment: a.riskAssessment as { id: string; riskLevel: string },
    }));

  return (
    <AppShell>
      {/* Background Ambience Layer based on the design */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden lg:left-64 select-none"
      >
        {/* Soft light blue and off-white base gradient matching YUKTHI */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#F0F7FF] via-[#F8FAFC] to-[#F1F5F9]" />

        {/* The abstract particle wave & floating sphere design from the image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.25] transition-opacity duration-300"
          style={{
            backgroundImage: "url('/dashboard-bg-light.png')",
          }}
        />

        {/* Subtle organic depth layer from the original design */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.04] mix-blend-multiply"
          style={{
            backgroundImage: "url('/dashboard-bg.jpg')",
          }}
        />

        {/* Soft radial fading overlay so it merges naturally without hard edges */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 90% 80% at 50% 25%, transparent 20%, rgba(248, 250, 252, 0.45) 55%, #F8FAFC 90%)',
          }}
        />

        {/* Subtle linear edge fades */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#F8FAFC] to-transparent opacity-80" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#F8FAFC] to-transparent" />
      </div>

      <div className="relative z-10 space-y-8">
        {/* Header with Personalized Greeting & Quick Actions */}
        <PageHeader
          title={`Home — ${timeGreeting}, ${isSessionLoaded && userName ? userName : 'User'}`}
          description="See your money overview and important updates."
          breadcrumbs={[{ label: 'Home' }]}
        />

        {error && (
          <Alert
            variant="danger"
            title="Service Alert"
            onClose={() => setError(null)}
          >
            <div className="flex items-center justify-between gap-4">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={fetchDashboardData}>
                Retry
              </Button>
            </div>
          </Alert>
        )}

        {/* 1. Real Financial Overview Cards with Tooltips */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#334155]">
                Your Money Overview
              </h2>
              <Tooltip content="All figures are calculated safely from your confirmed records with exact paisa precision.">
                <svg className="w-4 h-4 text-[#94A3B8] cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </Tooltip>
            </div>
            <span className="text-xs text-[#64748B]">INR (₹)</span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : forecast ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Available Funds */}
              <Tooltip
                content="Real balance currently confirmed on hand. Does not include pending receipts."
                className="w-full"
              >
                <FinancialMetricCard
                  className="w-full"
                  title="Available Funds"
                  amountPaise={forecast.availableFunds}
                  subtitle="Confirmed and immediately accessible"
                  variant="default"
                  badge={<Badge variant="info">Primary</Badge>}
                />
              </Tooltip>

              {/* Upcoming Expenses */}
              <Tooltip
                content="Committed outgoing payments scheduled before the next income cycle."
                className="w-full"
              >
                <FinancialMetricCard
                  className="w-full"
                  title="Upcoming Expenses"
                  amountPaise={forecast.upcomingExpenses}
                  subtitle="Committed outgoing obligations"
                  variant="warning"
                  badge={<Badge variant="warning">Payables</Badge>}
                />
              </Tooltip>

              {/* Projected Shortfall or Surplus */}
              <Tooltip
                content={
                  forecast.isShortfall
                    ? 'Expected deficit: available funds are insufficient to cover committed expenses.'
                    : 'Conservative surplus available after covering scheduled expenses.'
                }
                className="w-full"
              >
                <FinancialMetricCard
                  className="w-full"
                  title={forecast.isShortfall ? 'Expected Shortfall' : 'Projected Net'}
                  amountPaise={forecast.isShortfall ? forecast.shortfallAmount : forecast.netCashFlow}
                  subtitle={
                    forecast.isShortfall
                      ? 'Action needed to prevent payment default'
                      : 'Conservative balance surplus'
                  }
                  variant={forecast.isShortfall ? 'danger' : 'success'}
                  badge={
                    <Badge variant={forecast.isShortfall ? 'danger' : 'success'}>
                      {forecast.isShortfall ? 'Deficit' : 'Healthy'}
                    </Badge>
                  }
                />
              </Tooltip>

              {/* Unconfirmed Receipts */}
              <Tooltip
                content="Pending incoming receipts. Strictly segregated from available funds until verified by bank/user."
                className="w-full"
              >
                <FinancialMetricCard
                  className="w-full"
                  title="Unconfirmed Receipts"
                  amountPaise={forecast.unconfirmedUpcomingIncome}
                  subtitle="Excluded from primary forecast"
                  variant="info"
                  badge={<Badge variant="neutral">Segregated</Badge>}
                />
              </Tooltip>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#CBD5E1] bg-white p-6 text-center text-[#64748B]">
              <p className="text-sm">
                No cash-flow forecast calculated yet for this account.
              </p>
              <Link href="/cash-flow" className="mt-2 inline-block">
                <Button variant="outline" size="sm">
                  Set Up Cash-Flow Items
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* 2. Action Centre Preview & Payment Issue Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Action Centre Preview (2 Cols) */}
          <div className="lg:col-span-2 rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-xs hover:border-[#93C5FD] transition-all duration-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold text-[#0F2744]">Action Centre Preview</h2>
                {actionsData?.summary && (
                  <Badge variant={actionsData.summary.highUrgencyCount > 0 ? 'danger' : 'neutral'}>
                    {actionsData.summary.totalActions} Open Task(s)
                  </Badge>
                )}
              </div>
              <Link
                href="/action-centre"
                className="text-xs font-semibold text-[#0284C7] hover:text-[#0F2744] flex items-center gap-1 transition-colors"
              >
                Open Action Centre &rarr;
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : actionsData?.actions && actionsData.actions.length > 0 ? (
              <div className="divide-y divide-[#F1F5F9]">
                {actionsData.actions.slice(0, 3).map((action) => {
                  const badge = getUrgencyBadge(action.urgency);
                  return (
                    <div
                      key={action.id}
                      className="py-3.5 flex items-start justify-between gap-4 first:pt-0 last:pb-0"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={badge.variant} size="sm">
                            {badge.label}
                          </Badge>
                          <span className="text-sm font-semibold text-[#0F2744]">
                            {action.title}
                          </span>
                        </div>
                        <p className="text-xs text-[#64748B] line-clamp-1">
                          {action.description}
                        </p>
                        <p className="text-xs text-[#0284C7] font-medium pt-0.5">
                          Action: {action.recommendedAction}
                        </p>
                      </div>
                      <Link href="/action-centre" className="shrink-0">
                        <Button variant="ghost" size="sm">
                          Resolve
                        </Button>
                      </Link>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-[#64748B] py-6 text-center">
                All financial follow-up tasks are resolved. Your Action Centre is clear.
              </p>
            )}
          </div>

          {/* Payment Issue Status Overview (1 Col) */}
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-xs hover:border-[#93C5FD] transition-all duration-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <h2 className="text-base font-bold text-[#0F2744]">Payment Disputes</h2>
              <Link
                href="/payment-assistant"
                className="text-xs font-semibold text-[#0284C7] hover:text-[#0F2744] transition-colors"
              >
                View all &rarr;
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : paymentCases.length > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-center pb-2">
                  <div className="p-2.5 rounded-lg bg-[#FFFBEB] border border-[#FDE68A]">
                    <span className="text-[10px] uppercase font-bold text-[#92400E]">Active Cases</span>
                    <div className="text-lg font-bold text-[#D97706]">
                      {paymentCases.filter((c) => c.resolutionStatus !== 'RESOLVED').length}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0]">
                    <span className="text-[10px] uppercase font-bold text-[#065F46]">Resolved</span>
                    <div className="text-lg font-bold text-[#059669]">
                      {paymentCases.filter((c) => c.resolutionStatus === 'RESOLVED').length}
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-[#F1F5F9] text-xs">
                  {paymentCases.slice(0, 3).map((pc) => {
                    const badge = getResolutionStatusBadge(pc.resolutionStatus);
                    return (
                      <div key={pc.id} className="py-2.5 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-[#0F172A] block">
                            {pc.issueType.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[11px] text-[#64748B]">
                            {pc.amount ? formatCurrency(pc.amount) : 'Amount unstated'}
                          </span>
                        </div>
                        <Badge variant={badge.variant} size="sm">
                          {badge.label}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="py-6 text-center space-y-2">
                <p className="text-xs text-[#64748B]">
                  No payment disputes logged for this account.
                </p>
                <Link href="/payment-assistant">
                  <Button variant="outline" size="sm">
                    Report Issue
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* 3. Recent Scam-Check Results Section (if any detected via activities) */}
        {recentScamChecks.length > 0 && (
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#0F172A]">Recent Scam Assessments</h2>
                <Badge variant="neutral">{recentScamChecks.length} Evaluated</Badge>
              </div>
              <Link
                href="/scam-checker"
                className="text-xs font-semibold text-[#0D9488] hover:text-[#0F766E]"
              >
                Scan new message &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentScamChecks.slice(0, 3).map((check) => {
                const badge = getRiskLevelBadge(check.riskAssessment.riskLevel as 'Low' | 'Medium' | 'High');
                return (
                  <div
                    key={check.activityId}
                    className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant={badge.variant} size="sm">
                        {badge.label}
                      </Badge>
                      <span className="text-[11px] text-[#64748B]">
                        {formatDate(check.date)}
                      </span>
                    </div>
                    <div className="text-xs text-[#334155] font-medium">
                      Reference: {check.referenceNumber || 'N/A'}
                    </div>
                    <p className="text-[11px] text-[#64748B] italic">
                      Evaluated using rule-based keyword heuristics.
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. Recent Shared Financial Activities Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#0F172A]">Recent Financial Activity</h2>
              <p className="text-xs text-[#64748B]">
                Cross-module activity ledger synchronizing payments, fraud records, and cash flow.
              </p>
            </div>
            <Link href="/cash-flow">
              <Button variant="outline" size="sm">
                View Ledger
              </Button>
            </Link>
          </div>

          <DataTable
            isLoading={isLoading}
            data={activities}
            keyExtractor={(act) => act.id}
            emptyMessage="No financial activities logged yet. Report an incoming/outgoing payment or check a message to begin."
            columns={[
              {
                key: 'date',
                header: 'Date',
                render: (act) => formatDate(act.date),
              },
              {
                key: 'type',
                header: 'Type',
                render: (act) => (
                  <span
                    className={`font-semibold text-xs ${
                      act.type === 'INCOME' ? 'text-[#059669]' : 'text-[#DC2626]'
                    }`}
                  >
                    {act.type}
                  </span>
                ),
              },
              {
                key: 'amount',
                header: 'Amount',
                render: (act) => (
                  <span className="font-semibold text-sm">
                    {formatCurrency(act.amount)}
                  </span>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (act) => {
                  const badge = getActivityStatusBadge(act.status);
                  return (
                    <Badge variant={badge.variant} size="sm">
                      {badge.label}
                    </Badge>
                  );
                },
              },
              {
                key: 'referenceNumber',
                header: 'Reference',
                render: (act) => (
                  <span className="font-mono text-xs text-[#64748B]">
                    {act.referenceNumber || '—'}
                  </span>
                ),
              },
            ]}
          />
        </div>
      </div>
    </AppShell>
  );
}
