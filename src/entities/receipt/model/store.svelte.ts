import {
  calculateReceiptSummary,
  removeByPurchase,
  removeReceiptCascade,
  sortReceipts,
  validateReceipt,
} from './receipt';
import type { Receipt } from './types';
import { DocumentStoreError, type DocumentStore, type StorageDocument } from '../../../shared/api';
import type { Operation } from '../../operation/@x/receipt';

export const createReceiptStore = <
  T extends StorageDocument<{ id: string }, Receipt, Operation, { id: string }>,
>(
  documentStore: DocumentStore<T>
) => {
  const collection = documentStore.collection<Receipt>('receipts');
  let receipts = $state<Receipt[]>([]);
  let error = $state<DocumentStoreError | null>(null);
  const unsubscribe = collection.subscribe((snapshot) => {
    receipts = sortReceipts(snapshot.items);
    error = snapshot.error;
  });

  const assertValid = (receipt: Receipt) => {
    const errors = validateReceipt(receipt);

    if (errors.length > 0) {
      throw new Error(`Invalid receipt: ${errors.join(', ')}`);
    }
  };

  return {
    get receipts() {
      return receipts;
    },
    get error() {
      return error;
    },
    async add(receipt: Receipt) {
      assertValid(receipt);
      await collection.add(receipt);
    },
    async update(receipt: Receipt) {
      assertValid(receipt);
      await collection.update(receipt);
    },
    async summary(receiptId: string) {
      const document = await documentStore.getDocument();
      const currentReceipt = document.receipts.find((entry) => entry.id === receiptId);

      if (!currentReceipt) {
        throw new DocumentStoreError('invalid-document', `Receipt "${receiptId}" was not found`);
      }

      const operations = document.operations.filter(
        (operation) => operation.receiptId === receiptId
      );

      return calculateReceiptSummary(currentReceipt, operations);
    },
    async remove(receiptId: string) {
      await documentStore.transaction((transaction) =>
        removeReceiptCascade(transaction, receiptId)
      );
    },
    async removeByPurchase(purchaseId: string) {
      await documentStore.transaction((transaction) => removeByPurchase(transaction, purchaseId));
    },
    destroy() {
      unsubscribe();
    },
  };
};
