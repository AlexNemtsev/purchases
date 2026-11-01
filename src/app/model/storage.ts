import type { AppDocument } from './context.svelte';
import type { Category } from '../../entities/category';
import type { Operation } from '../../entities/operation';
import type { Purchase } from '../../entities/purchase';
import type { Receipt } from '../../entities/receipt';
import { SCHEMA_VERSION, type StorageDocument } from '../../shared/api';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isTimestamp = (value: unknown): value is string =>
  typeof value === 'string' && !Number.isNaN(Date.parse(value));

const isPurchase = (value: unknown): value is Purchase =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.title === 'string' &&
  typeof value.date === 'string' &&
  isTimestamp(value.createdAt) &&
  isTimestamp(value.updatedAt);

const isReceipt = (value: unknown): value is Receipt =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.purchaseId === 'string' &&
  Number.isSafeInteger(value.amountKopecks) &&
  Array.isArray(value.discountParts) &&
  value.discountParts.length >= 1 &&
  value.discountParts.length <= 2 &&
  typeof value.comment === 'string' &&
  isTimestamp(value.createdAt) &&
  isTimestamp(value.updatedAt);

const isOperation = (value: unknown): value is Operation =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.receiptId === 'string' &&
  typeof value.categoryId === 'string' &&
  Number.isSafeInteger(value.amountKopecks) &&
  typeof value.comment === 'string' &&
  (value.refundKopecks === undefined || Number.isSafeInteger(value.refundKopecks)) &&
  isTimestamp(value.createdAt) &&
  isTimestamp(value.updatedAt);

const isCategory = (value: unknown): value is Category =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.title === 'string' &&
  typeof value.comment === 'string' &&
  typeof value.archived === 'boolean' &&
  isTimestamp(value.createdAt) &&
  isTimestamp(value.updatedAt);

export const createEmptyAppDocument = (): AppDocument => ({
  schemaVersion: SCHEMA_VERSION,
  purchases: [],
  receipts: [],
  operations: [],
  categories: [],
});

export const validateAppDocument = (value: unknown): value is AppDocument => {
  if (!isRecord(value) || value.schemaVersion !== SCHEMA_VERSION) {
    return false;
  }

  const document = value as Partial<StorageDocument>;

  return (
    Array.isArray(document.purchases) &&
    document.purchases.every(isPurchase) &&
    Array.isArray(document.receipts) &&
    document.receipts.every(isReceipt) &&
    Array.isArray(document.operations) &&
    document.operations.every(isOperation) &&
    Array.isArray(document.categories) &&
    document.categories.every(isCategory)
  );
};
