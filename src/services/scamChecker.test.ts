import { describe, it, expect } from 'vitest';
import { analyzeMessage } from './scamChecker';

describe('Scam Checker Service', () => {
  it('should flag urgent messages requesting OTP as High risk', () => {
    const result = analyzeMessage('Urgent: Your account will be blocked. Share your OTP immediately.');
    expect(result.riskLevel).toBe('High');
    expect(result.indicators.some(i => i.id === 'URGENCY')).toBe(true);
    expect(result.indicators.some(i => i.id === 'OTP_REQUEST')).toBe(true);
  });

  it('should flag links as Medium risk', () => {
    const result = analyzeMessage('Check out this link: http://bit.ly/12345');
    expect(result.riskLevel).toBe('Medium');
    expect(result.indicators.some(i => i.id === 'SUSPICIOUS_LINK')).toBe(true);
  });

  it('should return Low risk for harmless messages', () => {
    const result = analyzeMessage('Hey, what time are we meeting tomorrow?');
    expect(result.riskLevel).toBe('Low');
    expect(result.indicators.length).toBe(0);
  });

  it('should handle empty input safely', () => {
    const result = analyzeMessage('');
    expect(result.riskLevel).toBe('Low');
    expect(result.indicators.length).toBe(0);
  });
  
  it('should flag unexpected money claims', () => {
    const result = analyzeMessage('You have won a cash prize! Click here to claim.');
    expect(result.riskLevel).toBe('High');
    expect(result.indicators.some(i => i.id === 'UNEXPECTED_MONEY')).toBe(true);
  });
});
