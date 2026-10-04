export interface Receipt {
  id: number;
  purchaseId: number;
  amountCents: number;
  discountMode: 'amount' | 'percent';
  discountAmountCents: number;
  discountPromille: number;
  comment?: string;
}

const LS_KEY = 'receipts';

export const getReceipts = (): Receipt[] => {
  const receipts = localStorage.getItem(LS_KEY);

  return receipts ? JSON.parse(receipts) : [];
};

export const getPurchaseReceipts = (purchaseId: number): Receipt[] => {
  const receipts = getReceipts();

  return receipts.filter((receipt) => receipt.purchaseId === purchaseId);
};

export const addReceipt = (receipt: Omit<Receipt, 'id'>) => {
  const receipts = getReceipts();
  const lastId = receipts.length ? receipts[receipts.length - 1].id : 0;
  const id = lastId + 1;

  receipts.push({ ...receipt, id });

  localStorage.setItem(LS_KEY, JSON.stringify(receipts));

  return { id };
};

export const removeReceipt = (id: number): void => {
  const receipts = getReceipts();
  const newReceipts = receipts.filter((receipt) => receipt.id !== id);

  localStorage.setItem(LS_KEY, JSON.stringify(newReceipts));
};

export const removePurchaseReceipts = (purchaseId: number): void => {
  const receipts = getReceipts();
  const newReceipts = receipts.filter((receipt) => receipt.purchaseId !== purchaseId);

  localStorage.setItem(LS_KEY, JSON.stringify(newReceipts));
};

export const updateReceipt = (receipt: Receipt): void => {
  const receipts = getReceipts();
  const newReceipts = receipts.map((r) => (r.id === receipt.id ? receipt : r));

  localStorage.setItem(LS_KEY, JSON.stringify(newReceipts));
};
