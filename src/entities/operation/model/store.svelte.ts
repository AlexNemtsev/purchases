import { removeByReceipts, sortOperations, validateOperation } from './operation';
import type { Operation } from './types';
import { DocumentStoreError, type DocumentStore, type StorageDocument } from '../../../shared/api';

export const createOperationStore = <
  T extends StorageDocument<{ id: string }, { id: string }, Operation, { id: string }>,
>(
  documentStore: DocumentStore<T>
) => {
  const collection = documentStore.collection<Operation>('operations');
  let operations = $state<Operation[]>([]);
  let error = $state<DocumentStoreError | null>(null);
  const unsubscribe = collection.subscribe((snapshot) => {
    operations = sortOperations(snapshot.items);
    error = snapshot.error;
  });

  const assertValid = (
    operation: Operation,
    categoryIsActive: boolean,
    currentCategoryId?: string
  ) => {
    const errors = validateOperation(operation, categoryIsActive, currentCategoryId);

    if (errors.length > 0) {
      throw new Error(`Invalid operation: ${errors.join(', ')}`);
    }
  };

  return {
    get operations() {
      return operations;
    },
    get error() {
      return error;
    },
    async add(operation: Operation, categoryIsActive: boolean) {
      assertValid(operation, categoryIsActive);
      await collection.add(operation);
    },
    async update(operation: Operation, categoryIsActive: boolean, currentCategoryId?: string) {
      assertValid(operation, categoryIsActive, currentCategoryId);
      await collection.update(operation);
    },
    async remove(operationId: string) {
      await collection.remove(operationId);
    },
    async removeByReceipts(receiptIds: readonly string[]) {
      await documentStore.transaction((transaction) => removeByReceipts(transaction, receiptIds));
    },
    destroy() {
      unsubscribe();
    },
  };
};
