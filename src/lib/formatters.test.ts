import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  paiseToRupees,
  rupeesToPaise,
  formatDate,
  getRiskLevelBadge,
  getUrgencyBadge,
  getActivityStatusBadge,
  getResolutionStatusBadge,
} from './formatters';

describe('Formatters and UI Utilities', () => {
  describe('Currency & Minor Units (Paise to INR)', () => {
    it('should format 0 paise as ₹0', () => {
      expect(formatCurrency(0)).toBe('₹0');
    });

    it('should format null or undefined gracefully as ₹0', () => {
      expect(formatCurrency(null)).toBe('₹0');
      expect(formatCurrency(undefined)).toBe('₹0');
    });

    it('should format 500,000 paise as ₹5,000', () => {
      expect(formatCurrency(500000)).toBe('₹5,000');
    });

    it('should format 10,000,000 paise using Indian numbering system (₹1,00,000)', () => {
      expect(formatCurrency(10000000)).toBe('₹1,00,000');
    });

    it('should show fractional paise when amount has non-zero paise remainder', () => {
      expect(formatCurrency(150050)).toBe('₹1,500.50');
    });

    it('should convert rupees to paise accurately', () => {
      expect(rupeesToPaise(5000)).toBe(500000);
      expect(rupeesToPaise(49.99)).toBe(4999);
    });

    it('should convert paise to rupees accurately', () => {
      expect(paiseToRupees(500000)).toBe(5000);
      expect(paiseToRupees(4999)).toBe(49.99);
    });
  });

  describe('Date Formatter', () => {
    it('should return dash for null or empty dates', () => {
      expect(formatDate(null)).toBe('—');
      expect(formatDate('')).toBe('—');
      expect(formatDate('invalid-date')).toBe('—');
    });

    it('should format ISO string to readable date', () => {
      const formatted = formatDate('2026-10-10T12:00:00.000Z');
      expect(formatted).toContain('2026');
      expect(formatted).toContain('Oct');
    });
  });

  describe('Badge Color & Variant Mappings', () => {
    it('maps RiskLevel correctly', () => {
      expect(getRiskLevelBadge('Low').variant).toBe('success');
      expect(getRiskLevelBadge('Medium').variant).toBe('warning');
      expect(getRiskLevelBadge('High').variant).toBe('danger');
    });

    it('maps Urgency correctly', () => {
      expect(getUrgencyBadge('CRITICAL').variant).toBe('danger');
      expect(getUrgencyBadge('HIGH').variant).toBe('warning');
      expect(getUrgencyBadge('MEDIUM').variant).toBe('info');
      expect(getUrgencyBadge('LOW').variant).toBe('neutral');
    });

    it('maps ActivityStatus correctly', () => {
      expect(getActivityStatusBadge('CONFIRMED').variant).toBe('success');
      expect(getActivityStatusBadge('UNCONFIRMED').variant).toBe('warning');
      expect(getActivityStatusBadge('FAILED').variant).toBe('danger');
    });

    it('maps ResolutionStatus correctly', () => {
      expect(getResolutionStatusBadge('RESOLVED').variant).toBe('success');
      expect(getResolutionStatusBadge('IN_PROGRESS').variant).toBe('info');
      expect(getResolutionStatusBadge('OPEN').variant).toBe('warning');
      expect(getResolutionStatusBadge('ESCALATED').variant).toBe('danger');
    });
  });
});
