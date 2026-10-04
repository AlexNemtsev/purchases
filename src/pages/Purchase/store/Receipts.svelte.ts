import {
  getPurchaseReceipts,
  addReceipt,
  type Receipt,
  removeReceipt,
  updateReceipt,
} from '@/shared/lib/dbController/receipts';

export class Receipts {
  private _receipts: Receipt[];
  private _receiptsSum: number;
  private _totalDiscountCents: number;
  private _totalDiscountPromille: number;

  constructor(private readonly purchaseId: number) {
    this._receipts = $state(getPurchaseReceipts(purchaseId));

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
    this._receipts.push({ ...receipt, id });
  };

  removeReceipt = (id: number) => {
    removeReceipt(id);
    this._receipts = this._receipts.filter((receipt) => receipt.id !== id);
  };

  updateReceipt = (receipt: Receipt) => {
    updateReceipt(receipt);
    this._receipts = this._receipts.map((r) => (r.id === receipt.id ? receipt : r));
  };
}
