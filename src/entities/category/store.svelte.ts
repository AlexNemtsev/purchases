import {
  getCategories,
  removeCategory,
  type Category,
  updateCategory,
  addCategory,
} from '@/shared/lib/dbController/categories';

export class CategoriesStore {
  private _categories: Category[];

  private sortCategories = () => {
    this._categories = this._categories.toSorted((a, b) => a.title.localeCompare(b.title));
  };

  constructor() {
    this._categories = $state(getCategories());
    this.sortCategories();
  }

  get categories() {
    return this._categories;
  }

  removeCategory = (id: number) => {
    removeCategory(id);
    this._categories = this._categories.filter((category) => category.id !== id);
  };

  addCategory = (category: Omit<Category, 'id'>) => {
    const { id } = addCategory(category);
    this._categories.push({ ...category, id });
    this.sortCategories();
  };

  updateCategory = (category: Category) => {
    updateCategory(category);
    this._categories = getCategories();
    this.sortCategories();
  };
}
