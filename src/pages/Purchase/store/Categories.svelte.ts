import type { SvelteMap } from 'svelte/reactivity';

import { getPurchaseCategories, type Category } from '@/shared/lib/dbController/categories';
import { getCategoryOperations } from '@/shared/lib/dbController/operations';
import type { Receipt } from '@/shared/lib/dbController/receipts';

interface OperationsSum {
  operationsTotal: number;
  discountTotal: number;
  discountPromille: number;
}

interface CalculatedCategory extends Category {
  operationsSum: OperationsSum;
}

export class Categories {
  private _categories: CalculatedCategory[];

  constructor(
    purchaseId: number,
    private getTotalDiscountPromille: () => number,
    private getReceipts: () => SvelteMap<number, Receipt>
  ) {
    this._categories = $state(this.getCategoriesWithOperations(purchaseId));
  }

  private getCategoriesWithOperations = (purchaseId: number): CalculatedCategory[] => {
    const categories = getPurchaseCategories(purchaseId);

    const operationsSum: CalculatedCategory[] = categories.map((category) => {
      const operations = getCategoryOperations(category.id);

      const operationSum: Omit<OperationsSum, 'discountPromille'> = operations.reduce(
        (acc, operation) => {
          let discountPromille: number;

          if (operation.discountSource.type === 'purchase') {
            discountPromille = this.getTotalDiscountPromille();
          } else {
            const receipt = this.getReceipts().get(operation.discountSource.receiptId);
            discountPromille = receipt?.discountPromille ?? 0;
          }

          acc.operationsTotal += operation.amountCents;
          acc.discountTotal += Math.round((operation.amountCents * discountPromille) / 1000);

          return acc;
        },
        { operationsTotal: 0, discountTotal: 0 }
      );

      const discountPromille = (operationSum.discountTotal * 1000) / operationSum.operationsTotal;

      return { ...category, operationsSum: { ...operationSum, discountPromille } };
    });

    return operationsSum;
  };

  get categories() {
    return this._categories;
  }
}
