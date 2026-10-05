import {
  addPurchase,
  getPurchase,
  getPurchases,
  removePurchase,
  updatePurchase,
  type Purchase,
} from '@/shared/lib/dbController/purchases';

export class PurchasesStore {
  private _purchases: Purchase[];

  constructor() {
    this._purchases = $state(getPurchases());
  }

  get purchases() {
    return this._purchases;
  }

  removePurchase = (id: number) => {
    removePurchase(id);
    this._purchases = this._purchases.filter((purchase) => purchase.id !== id);
  };

  addPurchase = (purchase: Omit<Purchase, 'id'>) => {
    const { id } = addPurchase(purchase);

    this._purchases.push({
      ...purchase,
      id,
    });
  };
}

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
    this._purchase = undefined;
  };

  updatePurchase = (purchase: Purchase) => {
    updatePurchase(purchase);
    this._purchase = purchase;
  };
}
