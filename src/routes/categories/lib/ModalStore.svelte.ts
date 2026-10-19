import type { CategoriesStore } from '@/entities/category/store.svelte';
import type { Category } from '@/shared/lib/dbController/categories';

interface Modal {
  open: boolean;
  title: string;
  comment?: string;
  id: number;
  mode: 'create' | 'edit';
}

export class ModalStore {
  private initState: Modal = { open: false, id: 0, title: '', comment: '', mode: 'create' };
  private _modalState: Modal = $state(this.initState);

  constructor(private categories: CategoriesStore) {}

  get modalState() {
    return this._modalState;
  }

  resetModal = () => {
    this._modalState = this.initState;
  };

  onAddButtonClick = () => {
    this._modalState.mode = 'create';
    this._modalState.open = true;
  };

  onCardClick = (category: Category) => {
    this._modalState.mode = 'edit';
    this._modalState.open = true;
    this._modalState.id = category.id;
    this._modalState.title = category.title;
    this._modalState.comment = category.comment;
  };

  private onCreate = () => {
    this.categories.addCategory({ ...this._modalState });
    this.resetModal();
  };

  private onUpdate = () => {
    this.categories.updateCategory({ ...this._modalState });
    this.resetModal();
  };

  onSubmit = $derived(this._modalState.mode === 'create' ? this.onCreate : this.onUpdate);
}
