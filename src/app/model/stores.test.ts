import { describe, expect, it } from 'vitest';

import { createCategoryStore, type Category } from '../../entities/category';
import { createOperationStore, type Operation } from '../../entities/operation';
import { createPurchaseStore, type Purchase } from '../../entities/purchase';
import { createReceiptStore, type Receipt } from '../../entities/receipt';
import { createInMemoryDocumentStore, type StorageDocument } from '../../shared/api';

type TestDocument = StorageDocument<Purchase, Receipt, Operation, Category>;

const createEmptyDocument = (): TestDocument => ({
  schemaVersion: 1,
  purchases: [],
  receipts: [],
  operations: [],
  categories: [],
});

const createStore = (initialDocument: TestDocument = createEmptyDocument()) =>
  createInMemoryDocumentStore<TestDocument>(
    {
      createEmptyDocument,
    },
    initialDocument
  );

const purchase: Purchase = {
  id: 'purchase-1',
  title: 'Закупка',
  date: '2026-11-01',
  createdAt: '2026-11-01T10:00:00.000Z',
  updatedAt: '2026-11-01T10:00:00.000Z',
};

const receipt: Receipt = {
  id: 'receipt-1',
  purchaseId: 'purchase-1',
  amountKopecks: 100_000,
  discountParts: [{ mode: 'percent', permille: 100, percentBase: 'original' }],
  comment: '',
  createdAt: '2026-11-01T10:01:00.000Z',
  updatedAt: '2026-11-01T10:01:00.000Z',
};

const category: Category = {
  id: 'category-1',
  title: 'Продукты',
  comment: '',
  archived: false,
  createdAt: '2026-11-01T10:00:00.000Z',
  updatedAt: '2026-11-01T10:00:00.000Z',
};

const operation: Operation = {
  id: 'operation-1',
  receiptId: 'receipt-1',
  categoryId: 'category-1',
  amountKopecks: 100_000,
  comment: '',
  createdAt: '2026-11-01T10:02:00.000Z',
  updatedAt: '2026-11-01T10:02:00.000Z',
};

describe('entity stores', () => {
  it('coordinates CRUD, summaries, and purchase cascade in one document', async () => {
    const documentStore = createStore();
    const categories = createCategoryStore(documentStore);
    const purchases = createPurchaseStore(documentStore);
    const receipts = createReceiptStore(documentStore);
    const operations = createOperationStore(documentStore);

    await categories.add(category);
    await purchases.add(purchase);
    await receipts.add(receipt);
    await operations.add(operation, true);

    expect(await purchases.summary('purchase-1')).toEqual({
      gross: 100_000,
      net: 90_000,
      discount: 10_000,
      rate: 100,
      refundTotal: 0,
    });

    expect((await receipts.summary('receipt-1')).operationsNetKopecks).toBe(90_000);

    await purchases.deletePurchase('purchase-1');

    expect(await documentStore.getDocument()).toEqual({
      ...createEmptyDocument(),
      categories: [category],
    });

    categories.destroy();
    purchases.destroy();
    receipts.destroy();
    operations.destroy();
    documentStore.destroy();
  });

  it('archives/restores categories and rejects duplicate titles', async () => {
    const documentStore = createStore();
    const categories = createCategoryStore(documentStore);

    await categories.add(category);

    await expect(
      categories.add({ ...category, id: 'category-2', title: ' продукты ' })
    ).rejects.toThrow('duplicate-title');

    await categories.archive('category-1');
    expect(categories.categories[0].archived).toBe(true);

    await categories.restore('category-1');
    expect(categories.categories[0].archived).toBe(false);
    expect(await documentStore.collection<Category>('categories').getAll()).toHaveLength(1);

    categories.destroy();
    documentStore.destroy();
  });

  it('preserves the current archived category in the operation edit path', async () => {
    const documentStore = createStore({
      ...createEmptyDocument(),
      categories: [{ ...category, archived: true }],
      operations: [operation],
    });
    const operations = createOperationStore(documentStore);

    await operations.update(operation, false, 'category-1');

    await expect(operations.add({ ...operation, id: 'operation-2' }, false)).rejects.toThrow(
      'category-inactive'
    );

    operations.destroy();
    documentStore.destroy();
  });
});
