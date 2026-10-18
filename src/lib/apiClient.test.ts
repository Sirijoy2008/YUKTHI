import { describe, it, expect, beforeEach, vi } from 'vitest';
import { apiClient, getSessionUserId, setSessionUserId } from './apiClient';

describe('API Client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setSessionUserId('user-123');
  });

  describe('Session Management', () => {
    it('defaults to user-123 in non-browser or unset environment', () => {
      expect(getSessionUserId()).toBe('user-123');
    });

    it('updates session user ID when setSessionUserId is called', () => {
      // Mock window and localStorage
      const storage: Record<string, string> = {};
      const mockLocalStorage = {
        getItem: (k: string) => storage[k] || null,
        setItem: (k: string, v: string) => {
          storage[k] = v;
        },
      };

      vi.stubGlobal('window', {
        dispatchEvent: vi.fn(),
      });
      vi.stubGlobal('localStorage', mockLocalStorage);

      setSessionUserId('custom-user-999');
      expect(getSessionUserId()).toBe('custom-user-999');

      vi.unstubAllGlobals();
    });
  });

  describe('API Endpoints Calling', () => {
    it('invokes scam checker endpoint correctly', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            riskLevel: 'Low',
            indicators: [],
            details: [],
            recommendations: ['Safe'],
            disclaimer: 'Disclaimer note',
          },
        }),
      });

      vi.stubGlobal('fetch', mockFetch);

      const res = await apiClient.scamChecker.analyze('Hello salary credited');
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/scam-checker/analyze',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ message: 'Hello salary credited' }),
        })
      );
      expect(res.success).toBe(true);
      expect(res.data?.riskLevel).toBe('Low');

      vi.unstubAllGlobals();
    });

    it('injects x-user-id header in authenticated requests', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: { activities: [] },
        }),
      });

      vi.stubGlobal('fetch', mockFetch);

      const res = await apiClient.activities.list();
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/activities',
        expect.objectContaining({
          method: 'GET',
        })
      );

      const headers = mockFetch.mock.calls[0][1].headers as Headers;
      expect(headers.get('x-user-id')).toBe('user-123');
      expect(res.success).toBe(true);

      vi.unstubAllGlobals();
    });

    it('handles network errors gracefully without crashing', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network offline'));
      vi.stubGlobal('fetch', mockFetch);

      const res = await apiClient.health.check();
      expect(res.success).toBe(false);
      expect(res.error).toBe('Network offline');

      vi.unstubAllGlobals();
    });

    it('detects offline browser state and immediately rejects without making fetch', async () => {
      const mockFetch = vi.fn();
      vi.stubGlobal('fetch', mockFetch);
      vi.stubGlobal('navigator', { onLine: false });

      const res = await apiClient.health.check();
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('NETWORK_ERROR');
      expect(res.error).toContain('offline');
      expect(mockFetch).not.toHaveBeenCalled();

      vi.unstubAllGlobals();
    });

    it('prevents duplicate concurrent mutations with identical signature', async () => {
      let resolveFirst: (val: any) => void = () => {};
      const firstPromise = new Promise((resolve) => {
        resolveFirst = resolve;
      });

      const mockFetch = vi.fn().mockImplementation(() => firstPromise);
      vi.stubGlobal('fetch', mockFetch);

      // Launch first mutation
      const firstCall = apiClient.scamChecker.analyze('duplicate check message');

      // Attempt rapid second mutation before first finishes
      const duplicateCall = await apiClient.scamChecker.analyze('duplicate check message');

      expect(duplicateCall.success).toBe(false);
      expect(duplicateCall.errorCode).toBe('CONFLICT');
      expect(duplicateCall.error).toContain('already in progress');

      // Now resolve first
      resolveFirst({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: {} }),
      });
      await firstCall;

      vi.unstubAllGlobals();
    });

    it('handles non-JSON error responses gracefully (e.g., HTML 500 from proxy)', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        headers: new Headers({ 'x-request-id': 'req-bad-gateway' }),
        json: async () => {
          throw new Error('Unexpected token < in JSON at position 0');
        },
      });

      vi.stubGlobal('fetch', mockFetch);

      const res = await apiClient.health.check();
      expect(res.success).toBe(false);
      expect(res.error).toContain('Server temporarily unavailable');
      expect(res.errorCode).toBe('INTERNAL_SERVER_ERROR');
      expect(res.requestId).toBe('req-bad-gateway');

      vi.unstubAllGlobals();
    });

    it('handles request timeout via AbortController and maps to TIMEOUT_ERROR', async () => {
      const abortErr = new Error('The user aborted a request.');
      abortErr.name = 'AbortError';

      const mockFetch = vi.fn().mockRejectedValue(abortErr);
      vi.stubGlobal('fetch', mockFetch);

      const res = await apiClient.health.check();
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('TIMEOUT_ERROR');
      expect(res.error).toContain('timed out');

      vi.unstubAllGlobals();
    });
  });
});
