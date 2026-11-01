import { describe, expect, it } from 'vitest';

import { formatMoney, formatPermille, parseMoney, parsePermille, roundDiv } from './index';
import { MAX_AMOUNT_KOPECKS, MAX_PERMILLE } from '../../config';

describe('roundDiv', () => {
  it('rounds half away from zero', () => {
    expect(roundDiv(1n, 2n)).toBe(1n);
    expect(roundDiv(-1n, 2n)).toBe(-1n);
    expect(roundDiv(3n, 2n)).toBe(2n);
    expect(roundDiv(-3n, 2n)).toBe(-2n);
  });

  it('rejects a non-positive denominator', () => {
    expect(() => roundDiv(1n, 0n)).toThrow(RangeError);
    expect(() => roundDiv(1n, -1n)).toThrow(RangeError);
  });

  it('keeps precision for very large integer products', () => {
    const maximum = BigInt(MAX_AMOUNT_KOPECKS);

    expect(roundDiv(maximum * maximum, maximum)).toBe(maximum);
  });
});

describe('parseMoney', () => {
  it('parses comma or point decimals and grouped digits without floating point', () => {
    expect(parseMoney('1 234,5')).toBe(123_450);
    expect(parseMoney('1\u202f234.56')).toBe(123_456);
    expect(parseMoney('0,01')).toBe(1);
    expect(parseMoney('0')).toBe(0);
  });

  it('rejects malformed, over-precise, negative, and over-limit values', () => {
    expect(parseMoney('0,001')).toBeNull();
    expect(parseMoney('12 34')).toBeNull();
    expect(parseMoney('-1')).toBeNull();
    expect(parseMoney(String(MAX_AMOUNT_KOPECKS / 100 + 1))).toBeNull();
    expect(parseMoney('')).toBeNull();
  });
});

describe('parsePermille', () => {
  it('parses one fractional digit as tenths of a percent', () => {
    expect(parsePermille('12,5')).toBe(125);
    expect(parsePermille('12.5')).toBe(125);
    expect(parsePermille('0')).toBe(0);
  });

  it('rejects negatives, extra fractional digits, and values above the limit', () => {
    expect(parsePermille('12,55')).toBeNull();
    expect(parsePermille('-1')).toBeNull();
    expect(parsePermille(String(MAX_PERMILLE / 10 + 0.1))).toBeNull();
  });
});

describe('formatting', () => {
  it('formats money and percentages using Russian conventions', () => {
    expect(formatMoney(123_456)).toBe('1\u00a0234,56 ₽');
    expect(formatMoney(-1)).toBe('-0,01 ₽');
    expect(formatPermille(125)).toBe('12,5 %');
    expect(formatPermille(120)).toBe('12 %');
  });
});
