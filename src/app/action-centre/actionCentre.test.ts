import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/lib/apiClient';
import { formatCurrency, formatDate, getUrgencyBadge, getActivityStatusBadge } from '@/lib/formatters';
import { ActionCentreData, FinancialActivity } from '@/types/api';

describe('Action Centre and Shared Activity Frontend Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Action Centre Data Fetching & Urgency Mapping', () => {
    it('fetches prioritized action items and calculates summary metrics', async () => {
      const mockActionData: ActionCentreData = {
        summary: {
          totalActions: 3,
          highUrgencyCount: 1,
          mediumUrgencyCount: 1,
          lowUrgencyCount: 1,
        },
        items: [
          {
            id: 'act-1',
            type: 'PAYMENT_DISPUTE_FOLLOW_UP',
            title: 'Follow up on failed UPI transfer',
            description: 'Bank has not credited ₹2,500 within T+1 window.',
            urgency: 'HIGH',
            status: 'PENDING',
            paymentCaseId: 'case-101',
            actionPrompt: 'Contact bank nodal grievance officer',
            sourceEntity: {
              entityType: 'PAYMENT_CASE',
              entityId: 'case-101',
            },
          },
          {
            id: 'act-2',
            type: 'SUSPICIOUS_MESSAGE_REVIEW',
            title: 'Verify urgent KYC SMS claim',
            description: 'Detected high risk phishing APK link in message.',
            urgency: 'MEDIUM',
            status: 'PENDING',
            actionPrompt: 'Block sender and do not open links',
            sourceEntity: {
              entityType: 'RISK_ASSESSMENT',
              entityId: 'scam-202',
            },
          },
          {
            id: 'act-3',
            type: 'CASH_FLOW_SHORTFALL_WARNING',
            title: 'Upcoming rent expense may exceed balance',
            description: 'Projected shortfall of ₹5,000 on 15th.',
            urgency: 'LOW',
            status: 'RESOLVED',
            actionPrompt: 'Plan budget allocation',
            sourceEntity: {
              entityType: 'CASH_FLOW',
              entityId: 'cf-303',
            },
          },
        ],
        disclaimer: 'The Action Centre prioritizes user-reported follow-ups and cash-flow projections.',
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: mockActionData }),
      });

      vi.stubGlobal('fetch', mockFetch);

      const response = await apiClient.actionCentre.getItems();

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/action-centre',
        expect.objectContaining({ method: 'GET' })
      );
      expect(response.success).toBe(true);
      expect(response.data?.items).toHaveLength(3);
      expect(response.data?.summary.totalActions).toBe(3);
      expect(response.data?.summary.highUrgencyCount).toBe(1);

      // Verify badges
      const highBadge = getUrgencyBadge('HIGH');
      expect(highBadge.variant).toBe('warning');
      expect(highBadge.label).toBe('High Priority');

      const criticalBadge = getUrgencyBadge('CRITICAL');
      expect(criticalBadge.variant).toBe('danger');
      expect(criticalBadge.label).toBe('Critical');

      const lowBadge = getUrgencyBadge('LOW');
      expect(lowBadge.variant).toBe('neutral');

      vi.unstubAllGlobals();
    });
  });

  describe('Shared Activity Feed Integration', () => {
    it('fetches shared chronological activities and maps originating modules', async () => {
      const mockActivities: FinancialActivity[] = [
        {
          id: 'fa-1',
          userId: 'user-123',
          type: 'EXPENSE',
          status: 'CONFIRMED',
          amount: 450000, // ₹4,500
          currency: 'INR',
          date: '2026-10-09T10:00:00.000Z',
          referenceNumber: 'UPI-987654',
          createdAt: '2026-10-09T10:00:00.000Z',
          updatedAt: '2026-10-09T10:00:00.000Z',
          paymentCase: {
            id: 'case-101',
            issueType: 'DEBITED_NOT_CREDITED',
            resolutionStatus: 'OPEN',
          },
        },
        {
          id: 'fa-2',
          userId: 'user-123',
          type: 'INCOME',
          status: 'CONFIRMED',
          amount: 2500000, // ₹25,000
          currency: 'INR',
          date: '2026-10-08T15:30:00.000Z',
          createdAt: '2026-10-08T15:30:00.000Z',
          updatedAt: '2026-10-08T15:30:00.000Z',
        },
        {
          id: 'fa-3',
          userId: 'user-123',
          type: 'EXPENSE',
          status: 'UNCONFIRMED',
          amount: 100000,
          currency: 'INR',
          date: '2026-10-07T09:00:00.000Z',
          createdAt: '2026-10-07T09:00:00.000Z',
          updatedAt: '2026-10-07T09:00:00.000Z',
          riskAssessment: {
            id: 'scam-202',
            riskLevel: 'High',
          },
        },
      ];

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: { activities: mockActivities, total: 3 },
        }),
      });

      vi.stubGlobal('fetch', mockFetch);

      const response = await apiClient.activities.list();

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/activities',
        expect.objectContaining({ method: 'GET' })
      );
      expect(response.success).toBe(true);
      expect(response.data?.activities).toHaveLength(3);

      // Verify originating module navigation logic
      const getModuleHref = (act: FinancialActivity) => {
        if (act.paymentCase) return '/payment-assistant';
        if (act.riskAssessment) return '/scam-checker';
        return '/cash-flow';
      };

      expect(getModuleHref(mockActivities[0])).toBe('/payment-assistant');
      expect(getModuleHref(mockActivities[1])).toBe('/cash-flow');
      expect(getModuleHref(mockActivities[2])).toBe('/scam-checker');

      // Verify formatted currency display
      expect(formatCurrency(mockActivities[0].amount)).toBe('₹4,500');
      expect(formatCurrency(mockActivities[0].amount, { showPaise: true })).toBe('₹4,500.00');

      vi.unstubAllGlobals();
    });
  });

  describe('Filtering Logic', () => {
    const sampleItems = [
      {
        id: '1',
        title: 'UPI Reversal Pending',
        category: 'PAYMENT_FOLLOWUP',
        status: 'PENDING',
        paymentCaseId: 'pc-1',
      },
      {
        id: '2',
        title: 'Electricity Bill',
        category: 'CASH_FLOW_UPCOMING_EXPENSE',
        status: 'RESOLVED',
      },
      {
        id: '3',
        title: 'Suspicious Lottery SMS',
        category: 'SCAM_ALERT',
        status: 'PENDING',
      },
    ];

    it('filters action items by category and status', () => {
      // Filter category: PAYMENTS
      const paymentItems = sampleItems.filter((i) =>
        i.category.includes('PAYMENT') || i.paymentCaseId
      );
      expect(paymentItems).toHaveLength(1);
      expect(paymentItems[0].id).toBe('1');

      // Filter category: SCAMS
      const scamItems = sampleItems.filter((i) => i.category.includes('SCAM'));
      expect(scamItems).toHaveLength(1);
      expect(scamItems[0].id).toBe('3');

      // Filter status: PENDING
      const pendingItems = sampleItems.filter((i) => i.status === 'PENDING');
      expect(pendingItems).toHaveLength(2);

      // Filter status: RESOLVED
      const resolvedItems = sampleItems.filter((i) => i.status === 'RESOLVED');
      expect(resolvedItems).toHaveLength(1);
      expect(resolvedItems[0].id).toBe('2');
    });
  });

  describe('Action Resolution Workflow', () => {
    it('calls POST /api/action-centre/resolve with correct entityType and entityId', async () => {
      const mockResolveResponse = {
        success: true,
        data: {
          actionId: 'act-101',
          resolvedAt: '2026-10-10T12:00:00.000Z',
          status: 'RESOLVED',
          entityType: 'PAYMENT_CASE',
          entityId: 'case-555',
        },
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResolveResponse,
      });

      vi.stubGlobal('fetch', mockFetch);

      const response = await apiClient.actionCentre.resolve({
        actionId: 'act-101',
        entityType: 'PAYMENT_CASE',
        entityId: 'case-555',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/action-centre/resolve',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            actionId: 'act-101',
            entityType: 'PAYMENT_CASE',
            entityId: 'case-555',
          }),
        })
      );

      expect(response.success).toBe(true);
      expect(response.data?.status).toBe('RESOLVED');

      vi.unstubAllGlobals();
    });

    it('handles resolution error response cleanly', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: 'Action item does not exist or is already resolved',
        }),
      });

      vi.stubGlobal('fetch', mockFetch);

      const response = await apiClient.actionCentre.resolve({
        actionId: 'act-invalid',
        entityType: 'PAYMENT_CASE',
        entityId: 'case-999',
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe(
        'Action item does not exist or is already resolved'
      );

      vi.unstubAllGlobals();
    });
  });
});
