import { describe, expect, it } from 'vitest';

import {
  calculateOperationNet,
  removeByReceipts,
  sortOperations,
  validateOperation,
} from './operation';
import type { Operation } from './types';

const operation = (overrides: Partial<Operation> = {}): Operation => ({
  id: 'operation-1',
  receiptId: 'receipt-1',
  categoryId: 'category-1',
  amountKopecks: 40_000,
  comment: '',
  createdAt: '',
  updatedAt: '',
  ...overrides,
});

describe('calculateOperationNet', () => {
  it('applies the exact receipt discount rate', () => {
    expect(calculateOperationNet(operation(), { numerator: 1500, denominator: 10_000 })).toEqual({
      base: 40_000,
      operationDiscount: 0,
      receiptDiscount: 6_000,
      net: 34_000,
      warnings: [],
    });
  });

  it('applies operation percentage discount before receipt discount', () => {
    const result = calculateOperationNet(
      operation({ operationDiscount: { mode: 'percent', permille: 100 } }),
      { numerator: 1500, denominator: 10_000 }
    );

    expect(result).toEqual({
      base: 40_000,
      operationDiscount: 4_000,
      receiptDiscount: 5_400,
      net: 30_600,
      warnings: [],
    });
  });

  it('applies fixed operation discounts and reports negative net', () => {
    const result = calculateOperationNet(
      operation({ operationDiscount: { mode: 'amount', amountKopecks: 50_000 } }),
      null
    );

    expect(result.operationDiscount).toBe(50_000);
    expect(result.net).toBe(-10_000);
    expect(result.warnings).toContain('negative-net');
  });

  it('subtracts full and partial refunds before applying discounts', () => {
    const fullRefund = calculateOperationNet(
      operation({ amountKopecks: 100_000, refundKopecks: 100_000 }),
      null
    );
    const partialRefund = calculateOperationNet(
      operation({ amountKopecks: 100_000, refundKopecks: 30_000 }),
      { numerator: 1000, denominator: 10_000 }
    );

    expect(fullRefund.base).toBe(0);
    expect(fullRefund.net).toBe(0);

    expect(partialRefund).toMatchObject({
      base: 70_000,
      receiptDiscount: 7_000,
      net: 63_000,
    });
  });

  it('warns when refund exceeds expense without auto-correction', () => {
    const result = calculateOperationNet(
      operation({ amountKopecks: 100_000, refundKopecks: 120_000 }),
      null
    );

    expect(result.base).toBe(-20_000);
    expect(result.net).toBe(-20_000);
    expect(result.warnings).toEqual(['negative-net', 'refund-exceeds-expense']);
  });

  it('rounds each receipt discount independently using integer arithmetic', () => {
    const rate = { numerator: 1000, denominator: 30_000 };
    const results = [1, 2, 3].map(() =>
      calculateOperationNet(operation({ amountKopecks: 10_000 }), rate)
    );

    expect(results.map((result) => result.receiptDiscount)).toEqual([333, 333, 333]);
    expect(results.reduce((sum, result) => sum + result.receiptDiscount, 0)).toBe(999);
  });

  it('sorts by createdAt while preserving insertion order for ties', () => {
    expect(
      sortOperations([
        operation({ id: 'later', createdAt: '2026-01-02' }),
        operation({ id: 'first', createdAt: '2026-01-01' }),
        operation({ id: 'tie', createdAt: '2026-01-02' }),
      ]).map(({ id }) => id)
    ).toEqual(['first', 'later', 'tie']);
  });

  it('removes all operations from selected receipts and leaves other receipts intact', () => {
    const document = {
      operations: [
        operation({ id: 'a', receiptId: 'receipt-a' }),
        operation({ id: 'b', receiptId: 'receipt-b' }),
        operation({ id: 'c', receiptId: 'receipt-a' }),
      ],
    };

    removeByReceipts({ document }, ['receipt-a']);
    expect(document.operations.map(({ id }) => id)).toEqual(['b']);
  });
});

describe('validateOperation', () => {
  it('requires a valid positive amount and category', () => {
    expect(validateOperation(operation(), true)).toEqual([]);
    expect(validateOperation(operation({ amountKopecks: 0 }), true)).toContain('invalid-amount');
    expect(validateOperation(operation({ categoryId: '' }), true)).toContain('category-required');
    expect(validateOperation(operation(), false)).toContain('category-inactive');
  });

  it('allows the existing archived category to remain until explicitly changed', () => {
    expect(validateOperation(operation(), false, 'category-1')).toEqual([]);

    expect(
      validateOperation(operation({ categoryId: 'category-2' }), false, 'category-1')
    ).toContain('category-inactive');
  });

  it('validates refunds and discounts', () => {
    const errors = validateOperation(
      operation({
        refundKopecks: 0,
        operationDiscount: { mode: 'percent', permille: 10_001 },
      }),
      true
    );

    expect(errors).toContain('invalid-refund');
    expect(errors).toContain('invalid-discount');
  });
});
