export interface Operation {
  id: number;
  receiptId: number;
  categoryId: number;
  type: 'expense' | 'refund';
  amountCents: number;
  comment?: string;
}

export type NewOperation = Omit<Operation, 'id'>;

const LS_KEY = 'operations';

const getOperations = (): Operation[] => {
  const operations = localStorage.getItem(LS_KEY);

  return operations ? JSON.parse(operations) : [];
};

export const getReceiptOperations = (receiptId: number): Operation[] => {
  return getOperations().filter((operation) => operation.receiptId === receiptId);
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

export const removeReceiptOperations = (receiptId: number): void => {
  const operations = getOperations();
  const newOperations = operations.filter((operation) => operation.receiptId !== receiptId);

  localStorage.setItem(LS_KEY, JSON.stringify(newOperations));
};

export const updateOperation = (operation: Operation): void => {
  const operations = getOperations();
  const newOperations = operations.map((op) => (op.id === operation.id ? operation : op));

  localStorage.setItem(LS_KEY, JSON.stringify(newOperations));
};
