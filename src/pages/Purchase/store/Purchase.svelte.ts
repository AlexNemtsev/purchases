import { SvelteMap } from 'svelte/reactivity';

import { getPurchaseCategories, type Category } from '@/shared/lib/dbController/categories';
import { getCategoryOperations } from '@/shared/lib/dbController/operations';
import {
  getPurchase,
  removePurchase,
  updatePurchase,
  type Purchase,
} from '@/shared/lib/dbController/purchases';
import {
  addReceipt,
  getPurchaseReceipts,
  removeReceipt,
  updateReceipt,
  type Receipt,
} from '@/shared/lib/dbController/receipts';

interface OperationsSum {
  operationsTotal: number;
  discountTotal: number;
  discountPromille: number;
}

interface CalculatedCategory extends Category {
  operationsSum: OperationsSum;
}

export class PurchaseStore {
  private _purchase: Purchase | undefined;

  private _receipts: Receipt[];
  private _receiptsMap: SvelteMap<number, Receipt>;
  private _receiptsSum: number;
  private _totalDiscountCents: number;
  private _totalDiscountPromille: number;

  private _categories: CalculatedCategory[];

  constructor(private readonly purchaseId: number) {
    this._purchase = $state(getPurchase(purchaseId));

    const receipts = new SvelteMap<number, Receipt>();
    getPurchaseReceipts(purchaseId).forEach((receipt) => receipts.set(receipt.id, receipt));
    this._receiptsMap = $state(receipts);

    this._receipts = $derived(Object.values(this._receiptsMap).toSorted((a, b) => a.id - b.id));

    this._receiptsSum = $derived(
      this._receipts.reduce((sum, receipt) => sum + receipt.amountCents, 0)
    );

    this._totalDiscountCents = $derived(
      this._receipts.reduce((sum, receipt) => sum + receipt.discountAmountCents, 0)
    );

    this._totalDiscountPromille = $derived(
      Math.round((this._totalDiscountCents * 1000) / this._receiptsSum)
    );

    this._categories = $state(this.getCategoriesWithOperations(purchaseId));
  }

  get purchase() {
    return this._purchase;
  }

  get receipts() {
    return this._receipts;
  }

  get receiptsSum() {
    return this._receiptsSum;
  }

  get totalDiscountCents() {
    return this._totalDiscountCents;
  }

  get totalDiscountPromille() {
    return this._totalDiscountPromille;
  }

  get categories() {
    return this._categories;
  }

  private getCategoriesWithOperations = (purchaseId: number): CalculatedCategory[] => {
    const categories = getPurchaseCategories(purchaseId);

    const operationsSum: CalculatedCategory[] = categories.map((category) => {
      const operations = getCategoryOperations(category.id);

      const operationSum: Omit<OperationsSum, 'discountPromille'> = operations.reduce(
        (acc, operation) => {
          let discountPromille: number;

          if (operation.discountSource.type === 'purchase') {
            discountPromille = this._totalDiscountPromille;
          } else {
            const receipt = this._receiptsMap.get(operation.discountSource.receiptId);
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

  removePurchase = () => {
    removePurchase(this.purchaseId);
  };

  updatePurchase = (purchase: Purchase) => {
    updatePurchase(purchase);
    this._purchase = purchase;
  };

  addReceipt = (receipt: Omit<Receipt, 'id'>) => {
    const { id } = addReceipt(receipt);
    this._receiptsMap.set(id, { ...receipt, id });
  };

  removeReceipt = (id: number) => {
    removeReceipt(id);
    this._receiptsMap.delete(id);
  };

  updateReceipt = (receipt: Receipt) => {
    updateReceipt(receipt);
    this._receiptsMap.set(receipt.id, receipt);
  };
}
