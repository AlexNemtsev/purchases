import { describe, expect, it } from 'vitest';

import { calculateDiscountValue, validateDiscount } from './index';
import { MAX_AMOUNT_KOPECKS, MAX_PERMILLE } from '../../config/limits';

describe('calculateDiscountValue', () => {
  it('returns fixed discounts unchanged', () => {
    expect(calculateDiscountValue({ mode: 'amount', amountKopecks: 250 }, 1000)).toBe(250);
  });

  it('calculates percentages with integer rounding, including a negative base', () => {
    expect(calculateDiscountValue({ mode: 'percent', permille: 125 }, 1000)).toBe(125);
    expect(calculateDiscountValue({ mode: 'percent', permille: 125 }, -1000)).toBe(-125);
    expect(calculateDiscountValue({ mode: 'percent', permille: 5 }, 100)).toBe(1);
  });

  it('does not lose precision for maximum-sized operands', () => {
    expect(
      calculateDiscountValue({ mode: 'percent', permille: MAX_PERMILLE }, MAX_AMOUNT_KOPECKS)
    ).toBe(MAX_AMOUNT_KOPECKS * 10);
  });
});

describe('validateDiscount', () => {
  it('enforces non-negative values and configured limits', () => {
    expect(validateDiscount({ mode: 'amount', amountKopecks: 0 })).toBeNull();
    expect(validateDiscount({ mode: 'amount', amountKopecks: MAX_AMOUNT_KOPECKS })).toBeNull();
    expect(validateDiscount({ mode: 'amount', amountKopecks: -1 })).toBe('out-of-range');

    expect(validateDiscount({ mode: 'amount', amountKopecks: MAX_AMOUNT_KOPECKS + 1 })).toBe(
      'out-of-range'
    );

    expect(validateDiscount({ mode: 'percent', permille: MAX_PERMILLE })).toBeNull();

    expect(validateDiscount({ mode: 'percent', permille: MAX_PERMILLE + 1 })).toBe('out-of-range');

    expect(validateDiscount({ mode: 'percent', permille: 0.5 })).toBe('invalid-value');
  });
});
