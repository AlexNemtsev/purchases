import {
  addPurchase,
  getPurchases,
  type Purchase,
  removePurchase,
} from '@/shared/lib/dbController/purchase';
import { getReceipts } from '@/shared/lib/dbController/receipts';

interface ReceiptsSum {
  receiptTotal: number;
  discountTotal: number;
  discountPromille: number;
}

interface CalculatedPurchase extends Purchase {
  receiptsSum: ReceiptsSum;
}

export class Purchases {
  private _purchases: CalculatedPurchase[];

  constructor() {
    this._purchases = $state.raw(this.getPurchasesWithReceipts());
  }

  get purchases() {
    return this._purchases;
  }

  private getPurchasesWithReceipts = (): CalculatedPurchase[] => {
    const purchases = getPurchases();
    const receipts = getReceipts();

    const receiptsSums = receipts.reduce((acc, receipt) => {
      if (!acc.has(receipt.purchaseId)) {
        acc.set(receipt.purchaseId, { receiptTotal: 0, discountTotal: 0, discountPromille: 0 });
      }

      const sum = acc.get(receipt.purchaseId)!;
      sum.receiptTotal += receipt.amountCents;
      sum.discountTotal += receipt.discountAmountCents;
      sum.discountPromille += Math.round((sum.discountTotal * 1000) / sum.receiptTotal);

      return acc;
      // используется $state.raw
      // eslint-disable-next-line svelte/prefer-svelte-reactivity
    }, new Map<number, ReceiptsSum>());

    purchases.sort((a, b) => b.id - a.id);

    return purchases.map((purchase) => {
      const sum = receiptsSums.get(purchase.id)!;

      return { ...purchase, receiptsSum: sum };
    });
  };

  removePurchase = (id: number) => {
    removePurchase(id);
    this._purchases = this.getPurchasesWithReceipts();
  };

  addPurchase = (purchase: Omit<Purchase, 'id'>) => {
    addPurchase(purchase);
    this._purchases = this.getPurchasesWithReceipts();
  };
}
