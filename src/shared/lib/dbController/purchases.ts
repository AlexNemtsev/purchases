import { removePurchaseCategories } from './categories';
import { removePurchaseReceipts } from './receipts';

export interface Purchase {
  id: number;
  title: string;
  date: string;
}

const LS_KEY = 'purchases';

export const getPurchases = (): Purchase[] => {
  const purchases = localStorage.getItem(LS_KEY);

  return purchases ? JSON.parse(purchases) : [];
};

export const getPurchase = (id: number): Purchase | undefined => {
  const purchases = getPurchases();

  return purchases.find((purchase) => purchase.id === id);
};

export const addPurchase = (purchase: Omit<Purchase, 'id'>) => {
  const purchases = getPurchases();
  const lastId = purchases.length ? purchases[purchases.length - 1].id : 0;
  const id = lastId + 1;

  purchases.push({ ...purchase, id });

  localStorage.setItem(LS_KEY, JSON.stringify(purchases));

  return { id };
};

export const removePurchase = (id: number): void => {
  const purchases = getPurchases();
  const newPurchases = purchases.filter((purchase) => purchase.id !== id);

  localStorage.setItem(LS_KEY, JSON.stringify(newPurchases));
  removePurchaseCategories(id);
  removePurchaseReceipts(id);
};

export const updatePurchase = (purchase: Purchase): void => {
  const purchases = getPurchases();
  const newPurchases = purchases.map((p) => (p.id === purchase.id ? purchase : p));

  localStorage.setItem(LS_KEY, JSON.stringify(newPurchases));
};
