import type { Operation } from '../../operation/@x/category';
import type { Receipt } from '../../receipt/@x/category';

export interface Category {
  id: string;
  title: string;
  comment: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategorySummary {
  gross: number;
  net: number;
}

export type CategoryValidationError = 'invalid-title' | 'duplicate-title' | 'invalid-comment';

export type CategoryOperations = readonly Operation[];

export type CategoryReceiptsById = ReadonlyMap<string, Receipt> | Readonly<Record<string, Receipt>>;
