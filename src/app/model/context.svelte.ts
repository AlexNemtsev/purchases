import { getContext } from 'svelte';

import { createCategoryStore } from '../../entities/category';
import type { Category } from '../../entities/category';
import { createOperationStore } from '../../entities/operation';
import type { Operation } from '../../entities/operation';
import { createPurchaseStore } from '../../entities/purchase';
import type { Purchase } from '../../entities/purchase';
import { createReceiptStore } from '../../entities/receipt';
import type { Receipt } from '../../entities/receipt';
import type { DocumentStore, StorageDocument } from '../../shared/api/document-store';

export type AppDocument = StorageDocument<Purchase, Receipt, Operation, Category>;

export interface AppServices {
  documentStore: DocumentStore<AppDocument>;
  purchases: ReturnType<typeof createPurchaseStore<AppDocument>>;
  receipts: ReturnType<typeof createReceiptStore<AppDocument>>;
  operations: ReturnType<typeof createOperationStore<AppDocument>>;
  categories: ReturnType<typeof createCategoryStore<AppDocument>>;
}

export const APP_CONTEXT_KEY = 'purchase-tracker:app';

export interface AppContextAccessor {
  current: AppServices | null;
}

export const getAppContext = (): AppContextAccessor =>
  getContext<AppContextAccessor>(APP_CONTEXT_KEY);
