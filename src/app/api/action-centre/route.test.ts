import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { POST as resolvePOST } from './resolve/route';
import { NextRequest } from 'next/server';
import * as actionCentreService from '@/services/actionCentre';

vi.mock('@/services/actionCentre', async () => {
  const actual = await vi.importActual<any>('@/services/actionCentre');
  return {
    ...actual,
    getActionCentreItems: vi.fn(),
    resolveActionCentreItem: vi.fn(),
  };
});

describe('Action Centre Routes (/api/action-centre)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/action-centre', () => {
    it('should return 401 if x-user-id header is missing', async () => {
      const req = new NextRequest('http://localhost/api/action-centre', { method: 'GET' });
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it('should return 200 with summary and action items', async () => {
      vi.mocked(actionCentreService.getActionCentreItems).mockResolvedValueOnce({
        summary: {
          totalActions: 2,
          highUrgencyCount: 1,
          mediumUrgencyCount: 1,
          lowUrgencyCount: 0
        },
        items: [
          {
            id: 'action-1',
            type: 'PAYMENT_FOLLOW_UP',
            title: 'Follow up on payment',
            description: 'Payment delayed',
            urgency: 'HIGH',
            status: 'PENDING',
            targetDate: null,
            sourceEntity: { entityType: 'PAYMENT_CASE', entityId: 'c-1' },
            actionPrompt: 'Contact bank'
          }
        ],
        disclaimer: 'Action Centre disclaimer...'
      });

      const req = new NextRequest('http://localhost/api/action-centre', {
        method: 'GET',
        headers: { 'x-user-id': 'user-1' }
      });

      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.summary.totalActions).toBe(2);
      expect(json.data.items).toHaveLength(1);
    });
  });

  describe('POST /api/action-centre/resolve', () => {
    it('should return 401 if x-user-id header is missing', async () => {
      const req = new NextRequest('http://localhost/api/action-centre/resolve', {
        method: 'POST',
        body: JSON.stringify({
          actionId: 'action-1',
          entityType: 'PAYMENT_CASE',
          entityId: 'c-1'
        })
      });
      const res = await resolvePOST(req);
      expect(res.status).toBe(401);
    });

    it('should return 400 on missing fields', async () => {
      const req = new NextRequest('http://localhost/api/action-centre/resolve', {
        method: 'POST',
        headers: { 'x-user-id': 'user-1' },
        body: JSON.stringify({ actionId: 'action-1' }) // missing entityType, entityId
      });
      const res = await resolvePOST(req);
      expect(res.status).toBe(400);
    });

    it('should return 200 on successful resolution', async () => {
      vi.mocked(actionCentreService.resolveActionCentreItem).mockResolvedValueOnce({
        entityType: 'PAYMENT_CASE',
        entityId: 'c-1',
        resolved: true,
        updatedAt: '2026-10-09T10:00:00.000Z'
      });

      const req = new NextRequest('http://localhost/api/action-centre/resolve', {
        method: 'POST',
        headers: { 'x-user-id': 'user-1' },
        body: JSON.stringify({
          actionId: 'action-1',
          entityType: 'PAYMENT_CASE',
          entityId: 'c-1'
        })
      });

      const res = await resolvePOST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.resolved).toBe(true);
    });
  });
});
