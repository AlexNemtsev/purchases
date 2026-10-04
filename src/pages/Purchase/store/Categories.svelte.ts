import {
  addCategory,
  getPurchaseCategories,
  removeCategory,
  updateCategory,
  type Category,
} from '@/shared/lib/dbController/categories';

export class Categories {
  private _categories: Category[];

  constructor(private readonly purchaseId: number) {
    this._categories = $state(getPurchaseCategories(purchaseId));
  }

  get categories() {
    return this._categories;
  }

  addCategory = (category: Omit<Category, 'id'>) => {
    const { id } = addCategory(category);
    this._categories.push({ ...category, id });
  };

  removeCategory = (id: number) => {
    removeCategory(id);
    this._categories = this._categories.filter((cat) => cat.id !== id);
  };

  updateCategory = (category: Category) => {
    updateCategory(category);
    this._categories = this._categories.map((cat) => (cat.id === category.id ? category : cat));
  };
}
