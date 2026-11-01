import { describe, expect, it } from 'vitest';

import { formatDateRu, isValidIsoDate, localTodayIso } from './index';

describe('ISO date helpers', () => {
  it('validates calendar dates, including leap years', () => {
    expect(isValidIsoDate('2024-02-29')).toBe(true);
    expect(isValidIsoDate('2025-02-29')).toBe(false);
    expect(isValidIsoDate('1900-02-29')).toBe(false);
    expect(isValidIsoDate('2000-02-29')).toBe(true);
    expect(isValidIsoDate('')).toBe(false);
    expect(isValidIsoDate('2024-2-09')).toBe(false);
  });

  it('uses the local date rather than converting to UTC', () => {
    expect(localTodayIso(new Date(2026, 0, 1, 0, 5))).toBe('2026-01-01');
  });

  it('formats a valid ISO date without timezone conversion', () => {
    expect(formatDateRu('2026-11-01')).toBe('01.11.2026');
    expect(() => formatDateRu('2026-02-30')).toThrow(RangeError);
  });
});
