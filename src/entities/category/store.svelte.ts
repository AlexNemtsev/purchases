import {
  removeCategory,
  type Category,
  getCategory,
  updateCategory,
  getPurchaseCategories,
} from '@/shared/lib/dbController/categories';

export class CategoryStore {
  private _category: Category | undefined;

  constructor(categoryId: number) {
    this._category = $state(getCategory(categoryId));
  }

  get category() {
    return this._category;
  }

  updateCategory = (category: Category) => {
    updateCategory(category);
    this._category = category;
  };

  removeCategory = (id: number) => {
    removeCategory(id);
  };
}

export class CategoriesStore {
  private _categories: Category[];

  constructor(purchaseId: number) {
    this._categories = $state(getPurchaseCategories(purchaseId));
  }

  get categories() {
    return this._categories;
  }

  removeCategory = (id: number) => {
    removeCategory(id);
    this._categories = this._categories.filter((category) => category.id !== id);
  };
}
