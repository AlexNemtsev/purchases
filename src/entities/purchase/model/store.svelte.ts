import { SvelteSet } from 'svelte/reactivity';

import {
  calculatePurchaseSummary,
  deletePurchaseCascade,
  sortPurchases,
  validatePurchase,
} from './purchase';
import type { Purchase } from './types';
import {
  DocumentStoreError,
  type DocumentStore,
  type StorageDocument,
} from '../../../shared/api/document-store';
import type { Operation } from '../../operation/@x/purchase';
import type { Receipt } from '../../receipt/@x/purchase';

export const createPurchaseStore = <
  T extends StorageDocument<Purchase, Receipt, Operation, { id: string }>,
>(
  documentStore: DocumentStore<T>
) => {
  const collection = documentStore.collection<Purchase>('purchases');
  let purchases = $state<Purchase[]>([]);
  let error = $state<DocumentStoreError | null>(null);
  const unsubscribe = collection.subscribe((snapshot) => {
    purchases = sortPurchases(snapshot.items);
    error = snapshot.error;
  });

  const assertValid = (purchase: Purchase) => {
    const errors = validatePurchase(purchase);

    if (errors.length > 0) {
      throw new Error(`Invalid purchase: ${errors.join(', ')}`);
    }
  };

  return {
    get purchases() {
      return purchases;
    },
    get error() {
      return error;
    },
    async add(purchase: Purchase) {
      assertValid(purchase);
      await collection.add(purchase);
    },
    async update(purchase: Purchase) {
      assertValid(purchase);
      await collection.update(purchase);
    },
    async summary(purchaseId: string) {
      const document = await documentStore.getDocument();
      const purchase = document.purchases.find((entry) => entry.id === purchaseId);

      if (!purchase) {
        throw new DocumentStoreError('invalid-document', `Purchase "${purchaseId}" was not found`);
      }

      const purchaseReceipts = document.receipts.filter(
        (receipt) => receipt.purchaseId === purchaseId
      );
      const receiptIds = new SvelteSet(purchaseReceipts.map((receipt) => receipt.id));
      const operations = document.operations.filter((operation) =>
        receiptIds.has(operation.receiptId)
      );

      return calculatePurchaseSummary(purchaseReceipts, operations);
    },
    async deletePurchase(purchaseId: string) {
      await documentStore.transaction((transaction) =>
        deletePurchaseCascade(transaction, purchaseId)
      );
    },
    destroy() {
      unsubscribe();
    },
  };
};
