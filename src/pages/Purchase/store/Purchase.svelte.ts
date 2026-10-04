import {
  getPurchase,
  removePurchase,
  updatePurchase,
  type Purchase,
} from '@/shared/lib/dbController/purchases';

export class PurchaseStore {
  private _purchase: Purchase | undefined;

  constructor(private readonly purchaseId: number) {
    this._purchase = $state(getPurchase(purchaseId));
  }

  get purchase() {
    return this._purchase;
  }

  removePurchase = () => {
    removePurchase(this.purchaseId);
  };

  updatePurchase = (purchase: Purchase) => {
    updatePurchase(purchase);
    this._purchase = purchase;
  };
}
