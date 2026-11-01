import { MAX_AMOUNT_KOPECKS, MAX_PERMILLE } from '../../config';
import { roundDiv } from '../money';

export interface AmountDiscount {
  mode: 'amount';
  amountKopecks: number;
}

export interface PercentDiscount {
  mode: 'percent';
  permille: number;
}

export type Discount = AmountDiscount | PercentDiscount;

export type DiscountRate = { numerator: number; denominator: number } | null;

export type DiscountValidationError = 'invalid-value' | 'out-of-range';

export const validateDiscount = (discount: Discount): DiscountValidationError | null => {
  const value = discount.mode === 'amount' ? discount.amountKopecks : discount.permille;
  const maximum = discount.mode === 'amount' ? MAX_AMOUNT_KOPECKS : MAX_PERMILLE;

  if (!Number.isSafeInteger(value)) {
    return 'invalid-value';
  }

  if (value < 0 || value > maximum) {
    return 'out-of-range';
  }

  return null;
};

export const calculateDiscountValue = (discount: Discount, base: number): number => {
  const validationError = validateDiscount(discount);

  if (validationError) {
    throw new RangeError(`Invalid discount: ${validationError}`);
  }

  if (!Number.isSafeInteger(base)) {
    throw new RangeError('The discount base must be a safe integer');
  }

  if (discount.mode === 'amount') {
    return discount.amountKopecks;
  }

  return Number(roundDiv(BigInt(base) * BigInt(discount.permille), 1000n));
};
