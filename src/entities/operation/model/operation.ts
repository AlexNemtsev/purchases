import type {
  Operation,
  OperationCalculation,
  OperationRate,
  OperationValidationError,
  OperationWarning,
} from './types';
import { MAX_AMOUNT_KOPECKS, MAX_COMMENT_LENGTH } from '../../../shared/config';
import {
  calculateDiscountValue,
  validateDiscount,
  type DiscountRate,
} from '../../../shared/lib/discount';
import { roundDiv } from '../../../shared/lib/money';

export const calculateOperationDiscount = (operation: Operation, base: number): number =>
  operation.operationDiscount ? calculateDiscountValue(operation.operationDiscount, base) : 0;

export const calculateOperationNet = (
  operation: Operation,
  receiptRate: OperationRate | DiscountRate
): OperationCalculation => {
  const refund = operation.refundKopecks ?? 0;
  const base = operation.amountKopecks - refund;
  const operationDiscount = calculateOperationDiscount(operation, base);
  const afterOperationDiscount = base - operationDiscount;
  const receiptDiscount =
    receiptRate && receiptRate.denominator !== 0
      ? Number(
          roundDiv(
            BigInt(afterOperationDiscount) * BigInt(receiptRate.numerator),
            BigInt(receiptRate.denominator)
          )
        )
      : 0;
  const net = afterOperationDiscount - receiptDiscount;
  const warnings: OperationWarning[] = [];

  if (net < 0) {
    warnings.push('negative-net');
  }

  if (refund > operation.amountKopecks) {
    warnings.push('refund-exceeds-expense');
  }

  return { base, operationDiscount, receiptDiscount, net, warnings };
};

export const validateOperation = (
  operation: Operation,
  categoryIsActive: boolean,
  currentCategoryId?: string
): OperationValidationError[] => {
  const errors: OperationValidationError[] = [];

  if (
    !Number.isSafeInteger(operation.amountKopecks) ||
    operation.amountKopecks <= 0 ||
    operation.amountKopecks > MAX_AMOUNT_KOPECKS
  ) {
    errors.push('invalid-amount');
  }

  if (
    operation.refundKopecks !== undefined &&
    (!Number.isSafeInteger(operation.refundKopecks) ||
      operation.refundKopecks <= 0 ||
      operation.refundKopecks > MAX_AMOUNT_KOPECKS)
  ) {
    errors.push('invalid-refund');
  }

  if (!operation.categoryId.trim()) {
    errors.push('category-required');
  } else if (!categoryIsActive && currentCategoryId !== operation.categoryId) {
    errors.push('category-inactive');
  }

  if (operation.operationDiscount && validateDiscount(operation.operationDiscount)) {
    errors.push('invalid-discount');
  }

  if (operation.comment.length > MAX_COMMENT_LENGTH) {
    errors.push('invalid-comment');
  }

  return errors;
};

export const sortOperations = (operations: readonly Operation[]): Operation[] =>
  [...operations].sort((left, right) => left.createdAt.localeCompare(right.createdAt));

export const removeByReceipts = <T extends { operations: Operation[] }>(
  transaction: { document: T },
  receiptIds: readonly string[]
): void => {
  const receiptIdSet = new Set(receiptIds);
  const operations = transaction.document.operations;
  const remaining = operations.filter((operation) => !receiptIdSet.has(operation.receiptId));

  operations.splice(0, operations.length, ...remaining);
};
