import { SvelteMap } from 'svelte/reactivity';

import {
  addReceipt,
  getPurchaseReceipts,
  removeReceipt,
  updateReceipt,
  type Receipt,
} from '@/shared/lib/dbController/receipts';

export class ReceiptsStore {
  private _receipts: Receipt[];
  private _receiptsMap: SvelteMap<number, Receipt>;
  private _receiptsSum: number;
  private _totalDiscountCents: number;
  private _totalDiscountPromille: number;

  constructor(purchaseId: number) {
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
  }

  get receipts() {
    return this._receipts;
  }

  get receiptsMap() {
    return this._receiptsMap;
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
