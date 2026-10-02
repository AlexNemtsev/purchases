import { removeGroupOperations } from './operations';

export interface Group {
  id: number;
  purchaseId: number;
  title: string;
  comment?: string;
}

const LS_KEY = 'groups';

const getGroups = (): Group[] => {
  const groups = localStorage.getItem(LS_KEY);

  return groups ? JSON.parse(groups) : [];
};

export const getPurchaseGroups = (purchaseId: number): Group[] => {
  const groups = getGroups();

  return groups.filter((group) => group.purchaseId === purchaseId);
};

export const addGroup = (group: Omit<Group, 'id'>): void => {
  const groups = getGroups();
  const lastId = groups.length ? groups[groups.length - 1].id : 0;

  groups.push({ ...group, id: lastId + 1 });

  localStorage.setItem(LS_KEY, JSON.stringify(groups));
};

export const removeGroup = (id: number): void => {
  const groups = getGroups();
  const newGroups = groups.filter((group) => group.id !== id);

  localStorage.setItem(LS_KEY, JSON.stringify(newGroups));
  removeGroupOperations(id);
};

export const removePurchaseGroups = (purchaseId: number): void => {
  const groups = getGroups();
  const newGroups = groups.filter((group) => group.purchaseId !== purchaseId);

  localStorage.setItem(LS_KEY, JSON.stringify(newGroups));
};

export const updateGroup = (group: Group): void => {
  const groups = getGroups();
  const newGroups = groups.map((g) =>
    g.id === group.id ? { ...group, purchaseId: g.purchaseId } : g
  );

  localStorage.setItem(LS_KEY, JSON.stringify(newGroups));
};
