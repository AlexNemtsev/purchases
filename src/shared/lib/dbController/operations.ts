export interface Expense {
  id: number;
  categoryId: number;
  type: 'expense';
  amountCents: number;
  comment?: string;
  discountSource: { type: 'purchase' } | { type: 'receipt'; receiptId: number };
}

export interface Refund {
  id: number;
  categoryId: number;
  type: 'refund';
  amountCents: number;
  comment?: string;
}

export type Operation = Expense | Refund;

export type NewOperation = Omit<Expense, 'id'> | Omit<Refund, 'id'>;

const LS_KEY = 'operations';

const getOperations = (): Operation[] => {
  const operations = localStorage.getItem(LS_KEY);

  return operations ? JSON.parse(operations) : [];
};

export const getCategoryOperations = (categoryId: number): Operation[] => {
  return getOperations().filter((operation) => operation.categoryId === categoryId);
};

export const addOperation = (operation: NewOperation) => {
  const operations = getOperations();
  const lastId = operations.length ? operations[operations.length - 1].id : 0;
  const id = lastId + 1;

  operations.push({ ...operation, id });

  localStorage.setItem(LS_KEY, JSON.stringify(operations));

  return { id };
};

export const removeOperation = (id: number): void => {
  const operations = getOperations();
  const newOperations = operations.filter((operation) => operation.id !== id);

  localStorage.setItem(LS_KEY, JSON.stringify(newOperations));
};

export const removeCategoryOperations = (categoryId: number): void => {
  const operations = getOperations();
  const newOperations = operations.filter((operation) => operation.categoryId !== categoryId);

  localStorage.setItem(LS_KEY, JSON.stringify(newOperations));
};

export const updateOperation = (operation: Operation): void => {
  const operations = getOperations();
  const newOperations = operations.map((op) => (op.id === operation.id ? operation : op));

  localStorage.setItem(LS_KEY, JSON.stringify(newOperations));
};
