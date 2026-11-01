import { describe, expect, it } from 'vitest';

import {
  autoTitle,
  calculatePurchaseSummary,
  deletePurchaseCascade,
  retitleOnDateChange,
  sortPurchases,
  validatePurchase,
} from './purchase';
import type { Purchase } from './types';
import type { Operation } from '../../operation/@x/purchase';
import type { Receipt } from '../../receipt/@x/purchase';

const purchase = (overrides: Partial<Purchase> = {}): Purchase => ({
  id: 'purchase-1',
  title: 'Закупка от 01.11.2026',
  date: '2026-11-01',
  createdAt: '2026-11-01T10:00:00.000Z',
  updatedAt: '',
  ...overrides,
});

const receipt = (overrides: Partial<Receipt> = {}): Receipt => ({
  id: 'receipt-1',
  purchaseId: 'purchase-1',
  amountKopecks: 100_000,
  discountParts: [{ mode: 'percent', permille: 100, percentBase: 'original' }],
  comment: '',
  createdAt: '',
  updatedAt: '',
  ...overrides,
});

const operation = (overrides: Partial<Operation> = {}): Operation => ({
  id: 'operation-1',
  receiptId: 'receipt-1',
  categoryId: 'category-1',
  amountKopecks: 100_000,
  comment: '',
  createdAt: '',
  updatedAt: '',
  ...overrides,
});

describe('purchase domain', () => {
  it('creates and updates automatic titles only when the title remains automatic', () => {
    expect(autoTitle('2026-11-01')).toBe('Закупка от 01.11.2026');

    expect(retitleOnDateChange(purchase(), '2026-11-02')).toMatchObject({
      date: '2026-11-02',
      title: 'Закупка от 02.11.2026',
    });

    expect(retitleOnDateChange(purchase({ title: 'Моя закупка' }), '2026-11-02').title).toBe(
      'Моя закупка'
    );
  });

  it('validates required title and real ISO dates', () => {
    expect(validatePurchase(purchase())).toEqual([]);
    expect(validatePurchase(purchase({ title: '  ' }))).toContain('invalid-title');
    expect(validatePurchase(purchase({ date: '2026-02-29' }))).toContain('invalid-date');
  });

  it('sorts by date descending and then createdAt descending', () => {
    expect(
      sortPurchases([
        purchase({ id: 'a', date: '2026-10-31', createdAt: '2026-10-31T12:00:00Z' }),
        purchase({ id: 'b', date: '2026-11-01', createdAt: '2026-11-01T09:00:00Z' }),
        purchase({ id: 'c', date: '2026-11-01', createdAt: '2026-11-01T11:00:00Z' }),
      ]).map(({ id }) => id)
    ).toEqual(['c', 'b', 'a']);
  });

  it('calculates purchase totals only from operations and includes refunds', () => {
    const result = calculatePurchaseSummary(
      [receipt(), receipt({ id: 'empty', amountKopecks: 500_000 })],
      [
        operation(),
        operation({
          id: 'refunded',
          amountKopecks: 50_000,
          refundKopecks: 10_000,
          operationDiscount: { mode: 'amount', amountKopecks: 5_000 },
        }),
      ]
    );

    expect(result).toEqual({
      gross: 140_000,
      net: 121_500,
      discount: 18_500,
      rate: 132,
      refundTotal: 10_000,
    });
  });

  it('deletes a purchase, its receipts, and their operations in one document mutation', () => {
    const document = {
      purchases: [purchase()],
      receipts: [receipt()],
      operations: [operation()],
    };

    deletePurchaseCascade({ document }, 'purchase-1');
    expect(document).toEqual({ purchases: [], receipts: [], operations: [] });
  });
});
