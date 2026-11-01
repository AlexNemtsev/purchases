import { describe, expect, it } from 'vitest';

import {
  calculateReceiptDiscount,
  calculateReceiptEffectiveRate,
  calculateReceiptSummary,
  formatEffectivePermille,
  removeReceiptCascade,
  sortReceipts,
  validateReceipt,
} from './receipt';
import type { Receipt } from './types';
import type { Operation } from '../../operation/@x/receipt';

const receipt = (overrides: Partial<Receipt> = {}): Receipt => ({
  id: 'receipt-1',
  purchaseId: 'purchase-1',
  amountKopecks: 500_000,
  discountParts: [{ mode: 'amount', amountKopecks: 0 }],
  comment: '',
  createdAt: '',
  updatedAt: '',
  ...overrides,
});

const operation = (overrides: Partial<Operation> = {}): Operation => ({
  id: 'operation-1',
  receiptId: 'receipt-1',
  categoryId: 'category-1',
  amountKopecks: 10_000,
  comment: '',
  createdAt: '',
  updatedAt: '',
  ...overrides,
});

describe('receipt discount calculations', () => {
  it('calculates no discount and an exact effective rate', () => {
    const data = receipt();

    expect(calculateReceiptDiscount(data)).toEqual({ parts: [0], total: 0 });
    expect(calculateReceiptEffectiveRate(data)).toEqual({ numerator: 0, denominator: 500_000 });
    expect(formatEffectivePermille(data)).toBe(0);
  });

  it('calculates a single percentage or fixed discount', () => {
    expect(
      calculateReceiptDiscount(
        receipt({ discountParts: [{ mode: 'percent', permille: 100, percentBase: 'original' }] })
      ).total
    ).toBe(50_000);

    expect(
      calculateReceiptEffectiveRate(
        receipt({ discountParts: [{ mode: 'amount', amountKopecks: 25_000 }] })
      )
    ).toEqual({ numerator: 25_000, denominator: 500_000 });
  });

  it('calculates two percentage discounts against original and after-previous bases', () => {
    const originalBase = receipt({
      discountParts: [
        { mode: 'percent', permille: 100, percentBase: 'original' },
        { mode: 'percent', permille: 50, percentBase: 'original' },
      ],
    });
    const afterPreviousBase = receipt({
      discountParts: [
        { mode: 'percent', permille: 100, percentBase: 'original' },
        { mode: 'percent', permille: 50, percentBase: 'afterPrevious' },
      ],
    });

    expect(calculateReceiptDiscount(originalBase)).toEqual({
      parts: [50_000, 25_000],
      total: 75_000,
    });

    expect(calculateReceiptDiscount(afterPreviousBase)).toEqual({
      parts: [50_000, 22_500],
      total: 72_500,
    });
  });

  it('supports fixed second discounts and discounts above one hundred percent', () => {
    expect(
      calculateReceiptDiscount(
        receipt({
          discountParts: [
            { mode: 'amount', amountKopecks: 1_000 },
            { mode: 'amount', amountKopecks: 2_000 },
          ],
        })
      ).total
    ).toBe(3_000);

    const oversized = receipt({
      amountKopecks: 100_000,
      discountParts: [{ mode: 'amount', amountKopecks: 120_000 }],
    });
    const summary = calculateReceiptSummary(oversized, [operation({ amountKopecks: 50_000 })]);

    expect(summary.discountKopecks).toBe(120_000);
    expect(summary.operationsNetKopecks).toBe(-10_000);
  });

  it('returns a null rate for a zero amount and applies no operation receipt discount', () => {
    const zero = receipt({
      amountKopecks: 0,
      discountParts: [{ mode: 'amount', amountKopecks: 1_000 }],
    });

    expect(calculateReceiptEffectiveRate(zero)).toBeNull();
    expect(formatEffectivePermille(zero)).toBeNull();
    expect(calculateReceiptSummary(zero, [operation()]).operationsNetKopecks).toBe(10_000);
  });
});

describe('receipt summary and validation', () => {
  it('compares gross operation amounts and excludes refunds from reconciliation', () => {
    const summary = calculateReceiptSummary(receipt({ amountKopecks: 200_000 }), [
      operation({ amountKopecks: 200_000, refundKopecks: 50_000 }),
    ]);

    expect(summary.differenceKopecks).toBe(0);
    expect(summary.hasDifference).toBe(false);
  });

  it('warns when gross amounts differ and does not warn for empty receipts', () => {
    const receiptData = receipt({ amountKopecks: 200_000 });

    expect(calculateReceiptSummary(receiptData, [operation()]).hasDifference).toBe(true);
    expect(calculateReceiptSummary(receiptData, []).hasDifference).toBe(false);
    expect(calculateReceiptSummary(receiptData, []).differenceKopecks).toBe(0);
  });

  it('validates amount, discount parts, and first percent base', () => {
    expect(validateReceipt(receipt())).toEqual([]);
    expect(validateReceipt(receipt({ amountKopecks: 0 }))).toContain('invalid-amount');

    expect(
      validateReceipt(
        receipt({
          discountParts: [{ mode: 'percent', permille: 100, percentBase: 'afterPrevious' }],
        })
      )
    ).toContain('invalid-percent-base');

    expect(
      validateReceipt(
        receipt({
          discountParts: [{ mode: 'percent', permille: 10_001, percentBase: 'original' }],
        })
      )
    ).toContain('invalid-discount');
  });

  it('sorts by createdAt with stable insertion ordering for equal timestamps', () => {
    expect(
      sortReceipts([
        receipt({ id: 'later', createdAt: '2026-01-02' }),
        receipt({ id: 'first', createdAt: '2026-01-01' }),
        receipt({ id: 'tie', createdAt: '2026-01-02' }),
      ]).map(({ id }) => id)
    ).toEqual(['first', 'later', 'tie']);
  });

  it('deletes a receipt and its operations without affecting unrelated receipts', () => {
    const document = {
      receipts: [receipt(), receipt({ id: 'receipt-2' })],
      operations: [operation(), operation({ id: 'operation-2', receiptId: 'receipt-2' })],
    };

    removeReceiptCascade({ document }, 'receipt-1');
    expect(document.receipts.map(({ id }) => id)).toEqual(['receipt-2']);
    expect(document.operations.map(({ id }) => id)).toEqual(['operation-2']);
  });
});
