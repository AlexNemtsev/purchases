import { removeCategoryOperations } from './operations';

export interface Category {
  id: number;
  purchaseId: number;
  title: string;
  comment?: string;
}

const LS_KEY = 'category';

const getCategories = (): Category[] => {
  const categories = localStorage.getItem(LS_KEY);

  return categories ? JSON.parse(categories) : [];
};

export const getCategory = (id: number): Category | undefined => {
  const categories = getCategories();

  return categories.find((cat) => cat.id === id);
};

export const getPurchaseCategories = (purchaseId: number): Category[] => {
  const categories = getCategories();

  return categories.filter((cat) => cat.purchaseId === purchaseId);
};

export const addCategory = (category: Omit<Category, 'id'>) => {
  const categories = getCategories();
  const lastId = categories.length ? categories[categories.length - 1].id : 0;
  const id = lastId + 1;

  categories.push({ ...category, id });

  localStorage.setItem(LS_KEY, JSON.stringify(categories));

  return { id };
};

export const removeCategory = (id: number): void => {
  const categories = getCategories();
  const newCategories = categories.filter((cat) => cat.id !== id);

  localStorage.setItem(LS_KEY, JSON.stringify(newCategories));
  removeCategoryOperations(id);
};

export const removePurchaseCategories = (purchaseId: number): void => {
  const categories = getCategories();
  const newCategories = categories.filter((cat) => cat.purchaseId !== purchaseId);

  localStorage.setItem(LS_KEY, JSON.stringify(newCategories));
};

export const updateCategory = (category: Category): void => {
  const categories = getCategories();
  const newCategories = categories.map((cat) => (cat.id === category.id ? category : cat));

  localStorage.setItem(LS_KEY, JSON.stringify(newCategories));
};
