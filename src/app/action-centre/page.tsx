'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { Tooltip } from '@/components/ui/Tooltip';
import { apiClient } from '@/lib/apiClient';
import {
  getUrgencyBadge,
  getActivityStatusBadge,
  formatCurrency,
  formatDate,
  formatDateTime,
} from '@/lib/formatters';
import {
  ActionCentreData,
  ActionCentreItem,
  FinancialActivity,
} from '@/types/api';
import { useUserSession } from '@/hooks/useUserSession';

type FilterCategory = 'ALL' | 'PAYMENTS' | 'SCAMS' | 'CASH_FLOW';
type StatusFilter = 'ALL' | 'PENDING' | 'RESOLVED';

export default function ActionCentrePage() {
  const { userId } = useUserSession();
  const [data, setData] = useState<ActionCentreData | null>(null);
  const [activities, setActivities] = useState<FinancialActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('PENDING');
  const [activeTab, setActiveTab] = useState<'ACTIONS' | 'ACTIVITY_FEED'>('ACTIONS');

  const loadData = async () => {
    setIsLoading(true);
    setNotification(null);

    try {
      const [actionsRes, activitiesRes] = await Promise.all([
        apiClient.actionCentre.getItems(),
        apiClient.activities.list(),
      ]);

      if (actionsRes.success && actionsRes.data) {
        setData(actionsRes.data);
      }
      if (activitiesRes.success && activitiesRes.data?.activities) {
        setActivities(activitiesRes.data.activities);
      }
    } catch {
      setNotification({
        type: 'error',
        message: 'Failed to contact Action Centre service.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  const handleResolve = async (action: ActionCentreItem) => {
    setResolvingId(action.id);
    setNotification(null);

    // Determine target entity type and ID supported by resolveActionSchema
    const entityType: 'PAYMENT_CASE' | 'FINANCIAL_ACTIVITY' | 'CASH_FLOW' | 'RISK_ASSESSMENT' =
      action.sourceEntity?.entityType ||
      (action.paymentCaseId
        ? 'PAYMENT_CASE'
        : action.financialActivityId
        ? 'FINANCIAL_ACTIVITY'
        : 'CASH_FLOW');

    const entityId =
      action.sourceEntity?.entityId ||
      action.paymentCaseId ||
      action.financialActivityId ||
      action.id;

    try {
      const res = await apiClient.actionCentre.resolve({
        actionId: action.id,
        entityType,
        entityId,
      });

      if (res.success) {
        setNotification({
          type: 'success',
          message: `Task "${action.title}" marked as resolved. Related records updated.`,
        });
        await loadData();
      } else {
        setNotification({
          type: 'error',
          message: res.error || 'Failed to resolve task.',
        });
      }
    } catch {
      setNotification({
        type: 'error',
        message: 'Network error resolving task.',
      });
    } finally {
      setResolvingId(null);
    }
  };

  // Normalize action list
  const allActionItems: ActionCentreItem[] = data?.items || data?.actions || [];

  // Filter Action Items
  const filteredActions = allActionItems.filter((action) => {
    // Status Filter
    if (statusFilter !== 'ALL') {
      const isActionResolved = action.status === 'RESOLVED' || action.status === 'COMPLETED';
      if (statusFilter === 'PENDING' && isActionResolved) return false;
      if (statusFilter === 'RESOLVED' && !isActionResolved) return false;
    }

    // Category Filter
    if (categoryFilter === 'PAYMENTS') {
      const type = action.type || action.category || '';
      return type.includes('PAYMENT') || action.paymentCaseId;
    }
    if (categoryFilter === 'SCAMS') {
      const type = action.type || action.category || '';
      return type.includes('SCAM');
    }
    if (categoryFilter === 'CASH_FLOW') {
      const type = action.type || action.category || '';
      return type.includes('CASH_FLOW') || type.includes('RECEIPT');
    }

    return true;
  });

  // Filter Chronological Shared Activities
  const filteredActivities = activities.filter((act) => {
    if (categoryFilter === 'PAYMENTS') return Boolean(act.paymentCase);
    if (categoryFilter === 'SCAMS') return Boolean(act.riskAssessment);
    if (categoryFilter === 'CASH_FLOW') return true;
    return true;
  });

  return (
    <AppShell>
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Page Header */}
        <PageHeader
          title="Alerts & Actions"
          description="See important warnings and what you need to do next."
          breadcrumbs={[{ label: 'Alerts & Actions' }]}
          actions={
            <Button variant="outline" size="sm" onClick={loadData} isLoading={isLoading}>
              Refresh Updates
            </Button>
          }
        />

        {notification && (
          <Alert
            variant={notification.type === 'success' ? 'success' : 'danger'}
            onClose={() => setNotification(null)}
          >
            {notification.message}
          </Alert>
        )}

        {/* 1. Urgency Summary Metrics */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <CardSkeleton rows={1} />
            <CardSkeleton rows={1} />
            <CardSkeleton rows={1} />
            <CardSkeleton rows={1} />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-xs">
              <span className="text-xs uppercase font-semibold text-[#64748B]">Total Tasks</span>
              <div className="text-2xl font-bold text-[#0F172A] mt-1">
                {data?.summary.totalActions ?? 0}
              </div>
            </div>
            <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-4 shadow-xs">
              <span className="text-xs uppercase font-semibold text-[#991B1B]">High / Critical</span>
              <div className="text-2xl font-bold text-[#DC2626] mt-1">
                {data?.summary.highUrgencyCount ?? 0}
              </div>
            </div>
            <div className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-4 shadow-xs">
              <span className="text-xs uppercase font-semibold text-[#92400E]">Medium Priority</span>
              <div className="text-2xl font-bold text-[#D97706] mt-1">
                {data?.summary.mediumUrgencyCount ?? data?.summary.mediumCount ?? 0}
              </div>
            </div>
            <div className="rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] p-4 shadow-xs">
              <span className="text-xs uppercase font-semibold text-[#065F46]">Low / Routine</span>
              <div className="text-2xl font-bold text-[#059669] mt-1">
                {data?.summary.lowUrgencyCount ?? data?.summary.lowCount ?? 0}
              </div>
            </div>
          </div>
        )}

        {/* 2. View Switcher Tabs & Category Filters */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-3">
            {/* Perspective View Switcher */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('ACTIONS')}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${
                  activeTab === 'ACTIONS'
                    ? 'bg-[#0F2744] text-white shadow-xs'
                    : 'text-[#475569] hover:text-[#0F2744] hover:bg-[#F0F7FF]'
                }`}
              >
                Action Items ({filteredActions.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ACTIVITY_FEED')}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${
                  activeTab === 'ACTIVITY_FEED'
                    ? 'bg-[#0F2744] text-white shadow-xs'
                    : 'text-[#475569] hover:text-[#0F2744] hover:bg-[#F0F7FF]'
                }`}
              >
                Activity Feed ({filteredActivities.length})
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[#64748B] mr-1 hidden sm:inline">Filter:</span>
              {(['ALL', 'PAYMENTS', 'SCAMS', 'CASH_FLOW'] as FilterCategory[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${
                    categoryFilter === cat
                      ? 'bg-[#0F2744] text-white shadow-2xs'
                      : 'bg-white border border-[#CBD5E1] text-[#475569] hover:bg-[#F0F7FF] hover:border-[#93C5FD] hover:text-[#0F2744]'
                  }`}
                >
                  {cat === 'ALL'
                    ? 'All'
                    : cat === 'PAYMENTS'
                    ? 'Payments'
                    : cat === 'SCAMS'
                    ? 'Scam Checks'
                    : 'Cash Flow'}
                </button>
              ))}

              {activeTab === 'ACTIONS' && (
                <div className="ml-2 pl-2 border-l border-[#CBD5E1] flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('PENDING')}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium cursor-pointer ${
                      statusFilter === 'PENDING'
                        ? 'bg-[#059669] text-white'
                        : 'text-[#64748B] hover:bg-[#F1F5F9]'
                    }`}
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium cursor-pointer ${
                      statusFilter === 'ALL'
                        ? 'bg-[#64748B] text-white'
                        : 'text-[#64748B] hover:bg-[#F1F5F9]'
                    }`}
                  >
                    All
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 3. Action Items Checklist Tab */}
          {activeTab === 'ACTIONS' && (
            <div className="space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  <div className="h-24 bg-white rounded-xl border border-[#E2E8F0] animate-pulse" />
                  <div className="h-24 bg-white rounded-xl border border-[#E2E8F0] animate-pulse" />
                </div>
              ) : filteredActions.length === 0 ? (
                <EmptyState
                  title="No Action Items Found"
                  description="All tasks matching this filter are resolved. Great job keeping your financial follow-ups organized!"
                  action={
                    <Button variant="outline" size="sm" onClick={() => { setCategoryFilter('ALL'); setStatusFilter('ALL'); }}>
                      Reset Filters
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-3">
                  {filteredActions.map((action) => {
                    const badge = getUrgencyBadge(action.urgency);
                    const isResolved = action.status === 'RESOLVED' || action.status === 'COMPLETED';

                    return (
                      <div
                        key={action.id}
                        className={`rounded-2xl border ${
                          isResolved ? 'border-[#E2E8F0] bg-[#F8FAFC] opacity-75' : 'border-[#E2E8F0] bg-white'
                        } p-5 shadow-xs hover:border-[#93C5FD] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4`}
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={badge.variant}>{badge.label}</Badge>
                            <span className="text-xs font-mono font-medium text-[#64748B]">
                              {(action.type || action.category || 'TASK').replace(/_/g, ' ')}
                            </span>
                            {action.targetDate && (
                              <span className="text-xs text-[#DC2626] font-medium">
                                Target: {formatDate(action.targetDate)}
                              </span>
                            )}
                            {isResolved && (
                              <Badge variant="success" size="sm">
                                Resolved
                              </Badge>
                            )}
                          </div>

                          <h3 className="text-base font-bold text-[#0F2744]">
                            {action.title}
                          </h3>

                          <p className="text-xs text-[#475569] leading-relaxed">
                            {action.description}
                          </p>

                          <div className="pt-0.5 text-xs text-[#0284C7] font-semibold flex items-center gap-1.5">
                            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span>Action: {action.actionPrompt || action.recommendedAction}</span>
                          </div>
                        </div>

                        {/* Actions Control */}
                        <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#F1F5F9]">
                          {/* Module Link */}
                          {action.sourceEntity?.entityType === 'PAYMENT_CASE' || action.paymentCaseId ? (
                            <Link href="/payment-assistant">
                              <Button variant="outline" size="sm">
                                View Case
                              </Button>
                            </Link>
                          ) : action.sourceEntity?.entityType === 'CASH_FLOW' ? (
                            <Link href="/cash-flow">
                              <Button variant="outline" size="sm">
                                Cash Flow
                              </Button>
                            </Link>
                          ) : action.sourceEntity?.entityType === 'RISK_ASSESSMENT' ? (
                            <Link href="/scam-checker">
                              <Button variant="outline" size="sm">
                                Scam Tool
                              </Button>
                            </Link>
                          ) : null}

                          {/* External Portal if provided */}
                          {action.externalUrl && (
                            <a
                              href={action.externalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="outline" size="sm">
                                Official Portal
                              </Button>
                            </a>
                          )}

                          {/* Mark Resolved Button */}
                          {!isResolved && (
                            <Button
                              variant="primary"
                              size="sm"
                              isLoading={resolvingId === action.id}
                              onClick={() => handleResolve(action)}
                            >
                              Mark Resolved
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 4. Chronological Shared Activity Feed Tab */}
          {activeTab === 'ACTIVITY_FEED' && (
            <div className="space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  <div className="h-16 bg-white rounded-xl border border-[#E2E8F0] animate-pulse" />
                  <div className="h-16 bg-white rounded-xl border border-[#E2E8F0] animate-pulse" />
                </div>
              ) : filteredActivities.length === 0 ? (
                <EmptyState
                  title="No Shared Activities Recorded"
                  description="Transactions, payment cases, and fraud checks recorded across modules will appear here chronologically."
                />
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E2E8F0]">
                  {filteredActivities.map((act) => {
                    const statusBadge = getActivityStatusBadge(act.status);

                    // Module destination mapping
                    const moduleHref = act.paymentCase
                      ? '/payment-assistant'
                      : act.riskAssessment
                      ? '/scam-checker'
                      : '/cash-flow';

                    return (
                      <div key={act.id} className="relative group">
                        {/* Timeline Node Dot */}
                        <div
                          className={`absolute -left-6 top-1.5 w-5 h-5 rounded-full border-2 border-white shadow-xs flex items-center justify-center ${
                            act.type === 'INCOME'
                              ? 'bg-[#059669]'
                              : act.paymentCase
                              ? 'bg-[#0284C7]'
                              : 'bg-[#DC2626]'
                          }`}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        </div>

                        {/* Activity Card */}
                        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-xs hover:border-[#CBD5E1] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-bold ${
                                  act.type === 'INCOME' ? 'text-[#059669]' : 'text-[#DC2626]'
                                }`}
                              >
                                {act.type}
                              </span>
                              <Badge variant={statusBadge.variant} size="sm">
                                {statusBadge.label}
                              </Badge>
                              {act.paymentCase && (
                                <Badge variant="warning" size="sm">
                                  Disputed Case
                                </Badge>
                              )}
                              {act.riskAssessment && (
                                <Badge variant="danger" size="sm">
                                  Risk Checked
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-baseline gap-2">
                              <span className="font-extrabold text-base text-[#0B192C]">
                                {formatCurrency(act.amount)}
                              </span>
                              {act.referenceNumber && (
                                <span className="font-mono text-xs text-[#64748B]">
                                  Ref: {act.referenceNumber}
                                </span>
                              )}
                            </div>

                            <div className="text-[11px] text-[#94A3B8]">
                              {formatDateTime(act.date)}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Link href={moduleHref}>
                              <Button variant="outline" size="sm">
                                Open in Module &rarr;
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Disclaimer Notice */}
        <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white text-xs text-[#64748B] space-y-1 leading-relaxed">
          <strong>Notice:</strong> {data?.disclaimer ||
            'Alerts & Actions prioritizes user-reported follow-ups and cash-flow projections. YUKTHI does not automatically verify bank records, execute reversals, or guarantee financial outcomes.'}
        </div>
      </div>
    </AppShell>
  );
}
