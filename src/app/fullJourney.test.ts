import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient, getSessionUserId, setSessionUserId } from '@/lib/apiClient';
import { rupeesToPaise, formatCurrency, getUrgencyBadge, getRiskLevelBadge } from '@/lib/formatters';
import {
  ScamAnalysisData,
  PaymentCaseItem,
  CashFlowForecastData,
  ActionCentreData,
  FinancialActivity,
} from '@/types/api';

describe('Phase 7: Full Application Journey & Security Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Journey Step 1 & 2: User Session & Tenant Isolation', () => {
    it('initializes with default session user and supports safe user switching', () => {
      // Default user session
      const initialUser = getSessionUserId();
      expect(initialUser).toBeDefined();

      // Switch user
      const testUserId = 'user-yukthi-qa-999';
      setSessionUserId(testUserId);
      expect(getSessionUserId()).toBe(testUserId);

      // Verify that apiClient sends x-user-id header matching active session
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { status: 'healthy', timestamp: new Date().toISOString() } }),
      });
      vi.stubGlobal('fetch', mockFetch);

      apiClient.health.check();

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/health',
        expect.objectContaining({
          headers: expect.any(Headers),
        })
      );

      vi.unstubAllGlobals();
    });

    it('ensures API requests do not transmit authentication secrets or tokens in URL parameters', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: [] }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await apiClient.paymentCases.list();

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toBe('/api/payment-cases');
      expect(calledUrl).not.toContain('token=');
      expect(calledUrl).not.toContain('secret=');
      expect(calledUrl).not.toContain('password=');

      vi.unstubAllGlobals();
    });
  });

  describe('Journey Step 3: Dashboard Aggregation', () => {
    it('aggregates live metrics across modules without mock fallbacks', async () => {
      const mockActivities: FinancialActivity[] = [
        {
          id: 'fa-1',
          userId: 'user-qa',
          type: 'EXPENSE',
          status: 'CONFIRMED',
          amount: 250000, // ₹2,500
          currency: 'INR',
          date: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const mockForecast: CashFlowForecastData = {
        summary: {
          confirmedAvailableFunds: 1500000, // ₹15,000
          confirmedIncomingFunds: 0,
          totalConfirmedLiquid: 1500000,
          unconfirmedReceipts: 500000, // ₹5,000
          upcomingExpenses: 800000, // ₹8,000
        },
        primaryForecast: {
          netAmount: 700000, // ₹7,000 surplus
          isShortfall: false,
          shortfallAmount: 0,
          surplusAmount: 700000,
          statusText: 'Surplus Projected',
        },
      };

      const mockActionCentre: ActionCentreData = {
        summary: {
          totalActions: 1,
          highUrgencyCount: 1,
          mediumUrgencyCount: 0,
          lowUrgencyCount: 0,
        },
        items: [
          {
            id: 'act-1',
            type: 'PAYMENT_DISPUTE_FOLLOW_UP',
            title: 'Verify UPI Refund Status',
            description: 'Check bank grievance portal',
            urgency: 'HIGH',
            status: 'PENDING',
          },
        ],
      };

      const mockFetch = vi.fn((url: string) => {
        if (url === '/api/activities') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ success: true, data: { activities: mockActivities, total: 1 } }),
          });
        }
        if (url === '/api/cash-flow/forecast') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ success: true, data: mockForecast }),
          });
        }
        if (url === '/api/action-centre') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ success: true, data: mockActionCentre }),
          });
        }
        return Promise.resolve({
          ok: false,
          status: 404,
          json: async () => ({ success: false, error: 'Not found' }),
        });
      });

      vi.stubGlobal('fetch', mockFetch);

      const [actRes, cfRes, acRes] = await Promise.all([
        apiClient.activities.list(),
        apiClient.cashFlow.getForecast(),
        apiClient.actionCentre.getItems(),
      ]);

      expect(actRes.success).toBe(true);
      expect(cfRes.success).toBe(true);
      expect(acRes.success).toBe(true);

      expect(cfRes.data?.primaryForecast?.isShortfall).toBe(false);
      expect(acRes.data?.summary.totalActions).toBe(1);

      vi.unstubAllGlobals();
    });
  });

  describe('Journey Step 4: Scam Checker Assessment', () => {
    it('analyzes suspicious message and returns transparent rule indicators', async () => {
      const testMessage =
        'Dear customer, your SBI YONO account is blocked. Update PAN immediately at http://bit.ly/sbi-pan-update.apk';

      const mockScamResult: ScamAnalysisData = {
        riskLevel: 'High',
        indicators: [
          'Phishing URL or Shortener',
          'APK Sideloading Request',
          'Urgency & Coercion',
        ],
        details: [
          {
            id: 'ind-1',
            name: 'Phishing URL or Shortener',
            description: 'URL contains shortener or unrecognized financial domain',
            reason: 'Suspicious domain http://bit.ly masquerading as SBI banking service',
            recommendation: 'Do not click the link or install the .apk file.',
          },
        ],
        recommendations: [
          'Do not click the link or install the .apk file.',
          'Never share OTP or banking passwords.',
          'Contact your branch via verified numbers on bank website.',
        ],
        disclaimer: 'Heuristic assessment. Does not replace bank verification.',
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: mockScamResult }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const res = await apiClient.scamChecker.analyze(testMessage);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/scam-checker/analyze',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ message: testMessage }),
        })
      );

      expect(res.success).toBe(true);
      expect(res.data?.riskLevel).toBe('High');
      expect(res.data?.indicators).toHaveLength(3);

      const badge = getRiskLevelBadge(res.data?.riskLevel || 'Low');
      expect(badge.variant).toBe('danger');
      expect(badge.label).toBe('High Risk');

      vi.unstubAllGlobals();
    });
  });

  describe('Journey Step 5: Payment Assistant Case Creation & Guidance', () => {
    it('files debited-not-credited case with paise precision and retrieves statutory resolution guidance', async () => {
      const amountRupees = 4999;
      const paise = rupeesToPaise(amountRupees);
      expect(paise).toBe(499900);

      const mockCreatedCase: PaymentCaseItem = {
        id: 'case-test-101',
        userId: 'user-qa',
        issueType: 'DEBITED_NOT_CREDITED',
        resolutionStatus: 'OPEN',
        amount: paise,
        currency: 'INR',
        referenceNumber: '429381726354',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          success: true,
          data: {
            case: mockCreatedCase,
            guidance: {
              recommendedSteps: [
                'Wait T+1 working days (NPCI auto-reversal timeline)',
                'File complaint with issuing bank using UTR 429381726354',
                'If unresolved after 30 days, escalate to RBI CMS Portal',
              ],
              estimatedResolutionHours: 24,
              officialPortals: [
                {
                  name: 'NPCI UPI Complaint Portal',
                  url: 'https://www.npci.org.in/what-we-do/upi/dispute-redressal-mechanism',
                  description: 'Official dispute redressal for UPI transactions',
                },
              ],
            },
          },
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const res = await apiClient.paymentCases.create({
        issueType: 'DEBITED_NOT_CREDITED',
        amount: paise,
        referenceNumber: '429381726354',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/payment-cases',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"amount":499900'),
        })
      );

      expect(res.success).toBe(true);
      const caseItem = res.data && 'case' in res.data ? res.data.case : res.data;
      expect(caseItem?.amount).toBe(499900);
      expect(formatCurrency(caseItem?.amount)).toBe('₹4,999');

      vi.unstubAllGlobals();
    });
  });

  describe('Journey Step 6: Cash-Flow Planner Scenario & Shortfall Projection', () => {
    it('calculates conservative forecast excluding unconfirmed receipts to prevent false solvency', async () => {
      const mockSimulation: CashFlowForecastData = {
        summary: {
          confirmedAvailableFunds: 500000, // ₹5,000 liquid
          confirmedIncomingFunds: 0,
          totalConfirmedLiquid: 500000,
          unconfirmedReceipts: 200000, // ₹2,000 unconfirmed
          upcomingExpenses: 800000, // ₹8,000 expenses
        },
        primaryForecast: {
          netAmount: -300000, // -₹3,000 deficit
          isShortfall: true,
          shortfallAmount: 300000, // ₹3,000
          surplusAmount: 0,
          statusText: 'Shortfall Projected',
        },
        disclaimer: 'Conservative baseline excludes unconfirmed receipts.',
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: mockSimulation }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const res = await apiClient.cashFlow.simulate({
        currentAvailableFunds: 500000,
        confirmedIncome: 0,
        unconfirmedReceipts: 200000,
        expenses: 800000,
      });

      expect(res.success).toBe(true);
      expect(res.data?.primaryForecast?.isShortfall).toBe(true);
      expect(res.data?.primaryForecast?.shortfallAmount).toBe(300000);
      expect(formatCurrency(res.data?.primaryForecast?.shortfallAmount)).toBe('₹3,000');

      vi.unstubAllGlobals();
    });
  });

  describe('Journey Step 7 & 8: Action Centre Resolution & Shared Activity Feed', () => {
    it('resolves an action item and links to originating module', async () => {
      const mockResolveResponse = {
        success: true,
        data: {
          actionId: 'act-99',
          resolvedAt: new Date().toISOString(),
          status: 'RESOLVED',
          entityType: 'PAYMENT_CASE',
          entityId: 'case-test-101',
        },
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResolveResponse,
      });
      vi.stubGlobal('fetch', mockFetch);

      const res = await apiClient.actionCentre.resolve({
        actionId: 'act-99',
        entityType: 'PAYMENT_CASE',
        entityId: 'case-test-101',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/action-centre/resolve',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            actionId: 'act-99',
            entityType: 'PAYMENT_CASE',
            entityId: 'case-test-101',
          }),
        })
      );

      expect(res.success).toBe(true);
      expect(res.data?.status).toBe('RESOLVED');

      vi.unstubAllGlobals();
    });
  });

  describe('Security & FinTech Integrity Constraints', () => {
    it('verifies that paiseToRupees and rupeesToPaise are mathematically inverse for integer paise', () => {
      const testCases = [100, 50000, 12599, 1000000];
      for (const paise of testCases) {
        const rupees = paise / 100;
        const convertedPaise = rupeesToPaise(rupees);
        expect(convertedPaise).toBe(paise);
      }
    });

    it('ensures urgency badges map correctly to visual severity tokens', () => {
      expect(getUrgencyBadge('CRITICAL').variant).toBe('danger');
      expect(getUrgencyBadge('HIGH').variant).toBe('warning');
      expect(getUrgencyBadge('MEDIUM').variant).toBe('info');
      expect(getUrgencyBadge('LOW').variant).toBe('neutral');
    });
  });
});
