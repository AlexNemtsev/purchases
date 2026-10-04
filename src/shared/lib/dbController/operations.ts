export interface Operation {
  id: number;
  categoryId: number;
  type: 'expense' | 'refund';
  amountCents: number;
  comment?: string;
  discountFromPurchaseId?: number;
  discountFromReceiptId?: number;
}

const LS_KEY = 'operations';

const getOperations = (): Operation[] => {
  const operations = localStorage.getItem(LS_KEY);

  return operations ? JSON.parse(operations) : [];
};

export const getCategoryOperations = (categoryId: number): Operation[] => {
  return getOperations().filter((operation) => operation.categoryId === categoryId);
};

export const addOperation = (operation: Omit<Operation, 'id'>): void => {
  const operations = getOperations();
  const lastId = operations.length ? operations[operations.length - 1].id : 0;

  operations.push({ ...operation, id: lastId + 1 });

  localStorage.setItem(LS_KEY, JSON.stringify(operations));
};

export const removeOperation = (id: number): void => {
  const operations = getOperations();
  const newOperations = operations.filter((operation) => operation.id !== id);

  localStorage.setItem(LS_KEY, JSON.stringify(newOperations));
};

export const removeCategoryOperations = (groupId: number): void => {
  const operations = getOperations();
  const newOperations = operations.filter((operation) => operation.categoryId !== groupId);

  localStorage.setItem(LS_KEY, JSON.stringify(newOperations));
};

export const updateCategory = (operation: Omit<Operation, 'groupId'>): void => {
  const operations = getOperations();
  const newOperations = operations.map((op) =>
    op.id === operation.id ? { ...operation, categoryId: op.categoryId } : op
  );

  localStorage.setItem(LS_KEY, JSON.stringify(newOperations));
};
