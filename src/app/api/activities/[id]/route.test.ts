import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PATCH } from './route';
import { NextRequest } from 'next/server';
import * as financialActivityService from '@/services/financialActivity';

vi.mock('@/services/financialActivity', async () => {
  const actual = await vi.importActual<any>('@/services/financialActivity');
  return {
    ...actual,
    updateFinancialActivityStatus: vi.fn(),
  };
});

describe('Single Financial Activity Route (/api/activities/[id])', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if x-user-id header is missing', async () => {
    const req = new NextRequest('http://localhost/api/activities/act-1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'CONFIRMED' })
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: 'act-1' }) });
    expect(res.status).toBe(401);
  });

  it('should return 400 for invalid status', async () => {
    const req = new NextRequest('http://localhost/api/activities/act-1', {
      method: 'PATCH',
      headers: { 'x-user-id': 'user-1' },
      body: JSON.stringify({ status: 'INVALID_STATUS' })
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: 'act-1' }) });
    expect(res.status).toBe(400);
  });

  it('should return 404 if activity is not found', async () => {
    vi.mocked(financialActivityService.updateFinancialActivityStatus).mockRejectedValueOnce(
      new financialActivityService.FinancialActivityNotFoundError('Not found')
    );

    const req = new NextRequest('http://localhost/api/activities/missing', {
      method: 'PATCH',
      headers: { 'x-user-id': 'user-1' },
      body: JSON.stringify({ status: 'CONFIRMED' })
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: 'missing' }) });
    expect(res.status).toBe(404);
  });

  it('should return 403 if user is unauthorized', async () => {
    vi.mocked(financialActivityService.updateFinancialActivityStatus).mockRejectedValueOnce(
      new financialActivityService.FinancialActivityForbiddenError('Forbidden')
    );

    const req = new NextRequest('http://localhost/api/activities/act-1', {
      method: 'PATCH',
      headers: { 'x-user-id': 'other-user' },
      body: JSON.stringify({ status: 'CONFIRMED' })
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: 'act-1' }) });
    expect(res.status).toBe(403);
  });

  it('should return 200 on successful status update', async () => {
    vi.mocked(financialActivityService.updateFinancialActivityStatus).mockResolvedValueOnce({
      id: 'act-1',
      status: 'CONFIRMED'
    } as any);

    const req = new NextRequest('http://localhost/api/activities/act-1', {
      method: 'PATCH',
      headers: { 'x-user-id': 'user-1' },
      body: JSON.stringify({ status: 'CONFIRMED' })
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: 'act-1' }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.status).toBe('CONFIRMED');
  });
});
