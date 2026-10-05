import type { SvelteMap } from 'svelte/reactivity';

import {
  getCategoryOperations,
  addOperation,
  removeOperation,
  updateOperation,
  type Expense,
  type Refund,
  type Operation,
  type NewOperation,
} from '@/shared/lib/dbController/operations';
import type { Receipt } from '@/shared/lib/dbController/receipts';

interface DiscountedExpense extends Expense {
  discountAmountCents: number;
}

type DiscontedOperation = DiscountedExpense | Refund;

export class OperationsStore {
  private _operations: DiscontedOperation[];

  constructor(
    categoryId: number,
    private getTotalDiscountPromille: () => number,
    private getReceipts: () => SvelteMap<number, Receipt>
  ) {
    const operations = getCategoryOperations(categoryId);
    const discountedOperations: DiscontedOperation[] = operations.map(this.getDiscountedOperation);

    this._operations = $state(discountedOperations);
  }

  private getDiscountedOperation = (operation: Operation): DiscontedOperation => {
    if (operation.type === 'refund') {
      return operation;
    }

    let discountAmountCents: number;

    if (operation.discountSource.type === 'purchase') {
      discountAmountCents = this.getTotalDiscountPromille() * (operation.amountCents / 1000);
    } else {
      const receipt = this.getReceipts().get(operation.discountSource.receiptId);
      const discountPromille = receipt?.discountPromille ?? 0;
      discountAmountCents = discountPromille * (operation.amountCents / 1000);
    }

    return {
      ...operation,
      discountAmountCents,
    };
  };

  get operations() {
    return this._operations;
  }

  addOperation = (operation: NewOperation) => {
    const { id } = addOperation(operation);
    const discountedOperation = this.getDiscountedOperation({ ...operation, id });
    this._operations.push(discountedOperation);
  };

  removeOperation = (id: number) => {
    removeOperation(id);
    this._operations = this._operations.filter((operation) => operation.id !== id);
  };

  updateOperation = (operation: Operation) => {
    updateOperation(operation);
    const discountedOperation = this.getDiscountedOperation(operation);

    this._operations = this._operations.map((op) =>
      op.id === operation.id ? discountedOperation : op
    );
  };
}
