export interface Operation {
  id: number;
  groupId: number;
  type: 'expense' | 'refund';
  amountCents: number;
  comment?: string;
}

const LS_KEY = 'operations';

const getOperations = (): Operation[] => {
  const operations = localStorage.getItem(LS_KEY);

  return operations ? JSON.parse(operations) : [];
};

export const getGroupOperations = (groupId: number): Operation[] => {
  return getOperations().filter((operation) => operation.groupId === groupId);
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

export const removeGroupOperations = (groupId: number): void => {
  const operations = getOperations();
  const newOperations = operations.filter((operation) => operation.groupId !== groupId);

  localStorage.setItem(LS_KEY, JSON.stringify(newOperations));
};

export const updateOperation = (operation: Omit<Operation, 'groupId'>): void => {
  const operations = getOperations();
  const newOperations = operations.map((op) =>
    op.id === operation.id ? { ...operation, groupId: op.groupId } : op
  );

  localStorage.setItem(LS_KEY, JSON.stringify(newOperations));
};
