import type {
  Category,
  CategoryOperations,
  CategoryReceiptsById,
  CategorySummary,
  CategoryValidationError,
} from './types';
import { MAX_COMMENT_LENGTH, MAX_TITLE_LENGTH } from '../../../shared/config/limits';
import { calculateOperationNet } from '../../operation/@x/category';
import { calculateReceiptEffectiveRate } from '../../receipt/@x/category';
import type { Receipt } from '../../receipt/@x/category';

const normalizeTitle = (title: string): string => title.trim().toLocaleLowerCase('ru-RU');

export const validateCategoryTitle = (
  title: string,
  categories: readonly Category[],
  currentCategoryId?: string
): CategoryValidationError[] => {
  const errors: CategoryValidationError[] = [];
  const normalizedTitle = normalizeTitle(title);

  if (!normalizedTitle || title.length > MAX_TITLE_LENGTH) {
    errors.push('invalid-title');
  }

  if (
    normalizedTitle &&
    categories.some(
      (category) =>
        category.id !== currentCategoryId && normalizeTitle(category.title) === normalizedTitle
    )
  ) {
    errors.push('duplicate-title');
  }

  return errors;
};

export const validateCategory = (category: Category): CategoryValidationError[] => {
  const errors = validateCategoryTitle(category.title, []);

  if (category.comment.length > MAX_COMMENT_LENGTH) {
    errors.push('invalid-comment');
  }

  return errors;
};

export const selectableCategories = (categories: readonly Category[]): Category[] =>
  categories
    .filter((category) => !category.archived)
    .sort((left, right) => left.title.localeCompare(right.title, 'ru'));

export const categoryForOperation = (
  categories: readonly Category[],
  categoryId: string
): Category | undefined => categories.find((category) => category.id === categoryId);

export const sortCategories = (categories: readonly Category[]): Category[] =>
  [...categories].sort((left, right) => left.title.localeCompare(right.title, 'ru'));

const getReceipt = (receiptsById: CategoryReceiptsById, receiptId: string) =>
  typeof (receiptsById as ReadonlyMap<string, Receipt>).get === 'function'
    ? (receiptsById as ReadonlyMap<string, Receipt>).get(receiptId)
    : (receiptsById as Readonly<Record<string, Receipt>>)[receiptId];

export const calculateCategorySummary = (
  operations: CategoryOperations,
  receiptsById: CategoryReceiptsById
): CategorySummary => {
  let gross = 0;
  let net = 0;

  for (const operation of operations) {
    const receipt = getReceipt(receiptsById, operation.receiptId);
    const rate = receipt ? calculateReceiptEffectiveRate(receipt) : null;

    gross += operation.amountKopecks - (operation.refundKopecks ?? 0);
    net += calculateOperationNet(operation, rate).net;
  }

  return { gross, net };
};
