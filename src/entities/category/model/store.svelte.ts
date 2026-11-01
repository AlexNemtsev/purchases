import { SvelteDate } from 'svelte/reactivity';

import { sortCategories, validateCategory, validateCategoryTitle } from './category';
import type { Category } from './types';
import {
  DocumentStoreError,
  type DocumentStore,
  type StorageDocument,
} from '../../../shared/api/document-store';

export const createCategoryStore = <
  T extends StorageDocument<{ id: string }, { id: string }, { id: string }, Category>,
>(
  documentStore: DocumentStore<T>
) => {
  const collection = documentStore.collection<Category>('categories');
  let categories = $state<Category[]>([]);
  let error = $state<DocumentStoreError | null>(null);
  const unsubscribe = collection.subscribe((snapshot) => {
    categories = sortCategories(snapshot.items);
    error = snapshot.error;
  });

  const updateCategory = async (category: Category) => {
    const categoryErrors = validateCategory(category);

    if (categoryErrors.length > 0) {
      throw new Error(`Invalid category: ${categoryErrors.join(', ')}`);
    }

    await documentStore.transaction(({ document }) => {
      const errors = validateCategoryTitle(category.title, document.categories, category.id);

      if (errors.length > 0) {
        throw new Error(`Invalid category title: ${errors.join(', ')}`);
      }

      const index = document.categories.findIndex((entry) => entry.id === category.id);

      if (index < 0) {
        throw new DocumentStoreError('invalid-document', `Category "${category.id}" was not found`);
      }

      document.categories.splice(index, 1, category);
    });
  };

  return {
    get categories() {
      return categories;
    },
    get error() {
      return error;
    },
    async add(category: Category) {
      const categoryErrors = validateCategory(category);

      if (categoryErrors.length > 0) {
        throw new Error(`Invalid category: ${categoryErrors.join(', ')}`);
      }

      await documentStore.transaction(({ document }) => {
        const errors = validateCategoryTitle(category.title, document.categories);

        if (errors.length > 0) {
          throw new Error(`Invalid category title: ${errors.join(', ')}`);
        }

        if (document.categories.some((entry) => entry.id === category.id)) {
          throw new DocumentStoreError(
            'invalid-document',
            `Duplicate category id "${category.id}"`
          );
        }

        document.categories.push(category);
      });
    },
    async update(category: Category) {
      await updateCategory(category);
    },
    async archive(categoryId: string) {
      const category = await collection.getById(categoryId);

      if (!category) {
        throw new DocumentStoreError('invalid-document', `Category "${categoryId}" was not found`);
      }

      await updateCategory({
        ...category,
        archived: true,
        updatedAt: new SvelteDate().toISOString(),
      });
    },
    async restore(categoryId: string) {
      const category = await collection.getById(categoryId);

      if (!category) {
        throw new DocumentStoreError('invalid-document', `Category "${categoryId}" was not found`);
      }

      await updateCategory({
        ...category,
        archived: false,
        updatedAt: new SvelteDate().toISOString(),
      });
    },
    destroy() {
      unsubscribe();
    },
  };
};
