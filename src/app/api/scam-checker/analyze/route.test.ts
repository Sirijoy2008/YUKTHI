import { describe, it, expect, vi } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

describe('Scam Checker API Endpoint', () => {
  it('should return 400 for empty body', async () => {
    const req = new NextRequest('http://localhost/api/scam-checker/analyze', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    
    const res = await POST(req);
    const json = await res.json();
    
    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toBeDefined();
  });

  it('should return 400 for message exceeding 2000 characters', async () => {
    const req = new NextRequest('http://localhost/api/scam-checker/analyze', {
      method: 'POST',
      body: JSON.stringify({ message: 'a'.repeat(2001) }),
    });
    
    const res = await POST(req);
    const json = await res.json();
    
    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toBe("Message exceeds maximum length of 2000 characters");
  });

  it('should successfully analyze a valid message', async () => {
    const req = new NextRequest('http://localhost/api/scam-checker/analyze', {
      method: 'POST',
      body: JSON.stringify({ message: 'Urgent: Please share your OTP' }),
    });
    
    const res = await POST(req);
    const json = await res.json();
    
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.riskLevel).toBe('High');
    expect(json.data.indicators).toContain('Urgent Demand');
    expect(json.data.indicators).toContain('Request for Sensitive Information');
    expect(json.data.disclaimer).toBeDefined();
  });
});
