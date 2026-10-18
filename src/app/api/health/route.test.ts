import { describe, it, expect } from 'vitest';
import { GET } from './route';

describe('Health Endpoint', () => {
  it('should return a 200 success response', async () => {
    const response = await GET();
    const json = await response.json();
    
    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.status).toBe('ok');
    expect(json.message).toBe('Service is healthy');
  });
});
