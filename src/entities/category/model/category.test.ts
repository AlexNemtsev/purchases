import { describe, expect, it } from 'vitest';

import {
  categoryForOperation,
  calculateCategorySummary,
  selectableCategories,
  sortCategories,
  validateCategoryTitle,
} from './category';
import type { Category } from './types';
import type { Operation } from '../../operation/@x/category';
import type { Receipt } from '../../receipt/@x/category';

const category = (id: string, title: string, archived = false): Category => ({
  id,
  title,
  comment: '',
  archived,
  createdAt: '',
  updatedAt: '',
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

const receipt: Receipt = {
  id: 'receipt-1',
  purchaseId: 'purchase-1',
  amountKopecks: 100_000,
  discountParts: [{ mode: 'percent', permille: 100, percentBase: 'original' }],
  comment: '',
  createdAt: '',
  updatedAt: '',
};

describe('category domain', () => {
  it('validates unique trimmed case-insensitive titles including archived categories', () => {
    const categories = [category('a', '  Еда  ', true)];

    expect(validateCategoryTitle(' еда ', categories)).toContain('duplicate-title');
    expect(validateCategoryTitle('Транспорт', categories)).toEqual([]);
    expect(validateCategoryTitle('  ', categories)).toContain('invalid-title');
    expect(validateCategoryTitle('Еда', categories, 'a')).toEqual([]);
  });

  it('sorts selectable categories with Russian locale rules', () => {
    expect(
      selectableCategories([category('я', 'Ягоды'), category('а', 'Арбуз')]).map(
        ({ title }) => title
      )
    ).toEqual(['Арбуз', 'Ягоды']);
  });

  it('sorts categories in Russian alphabetical order', () => {
    expect(
      sortCategories([category('1', 'Ягоды'), category('2', 'Арбуз')]).map((x) => x.title)
    ).toEqual(['Арбуз', 'Ягоды']);
  });

  it('shows archived current categories separately from active selection options', () => {
    const categories = [category('active', 'Активная'), category('archived', 'Архивная', true)];

    expect(selectableCategories(categories).map(({ id }) => id)).toEqual(['active']);

    expect(categoryForOperation(categories, 'archived')).toMatchObject({
      id: 'archived',
      archived: true,
    });
  });

  it('calculates category gross and net from operations with receipt discounts', () => {
    expect(
      calculateCategorySummary(
        [
          operation(),
          operation({
            id: 'refunded',
            amountKopecks: 50_000,
            refundKopecks: 10_000,
          }),
        ],
        new Map([['receipt-1', receipt]])
      )
    ).toEqual({ gross: 140_000, net: 126_000 });
  });
});
