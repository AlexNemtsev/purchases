import type {
  Receipt,
  ReceiptDiscountCalculation,
  ReceiptDiscountPart,
  ReceiptSummary,
  ReceiptValidationError,
} from './types';
import { MAX_AMOUNT_KOPECKS, MAX_COMMENT_LENGTH } from '../../../shared/config/limits';
import { calculateDiscountValue, validateDiscount } from '../../../shared/lib/discount';
import { roundDiv } from '../../../shared/lib/money';
import { calculateOperationNet } from '../../operation/@x/purchase';
import { removeByReceipts } from '../../operation/@x/receipt';
import type { Operation } from '../../operation/@x/receipt';

const isAmountDiscount = (part: ReceiptDiscountPart) => part.mode === 'amount';

const isValidPercentBase = (part: ReceiptDiscountPart): boolean =>
  part.mode === 'amount' || part.percentBase === 'original' || part.percentBase === 'afterPrevious';

const calculateReceiptPart = (
  part: ReceiptDiscountPart,
  originalAmount: number,
  previousDiscount: number
): number => {
  if (part.mode === 'amount') {
    return calculateDiscountValue(part, originalAmount);
  }

  const base =
    part.percentBase === 'afterPrevious' ? originalAmount - previousDiscount : originalAmount;

  return calculateDiscountValue(part, base);
};

export const calculateReceiptDiscount = (receipt: Receipt): ReceiptDiscountCalculation => {
  const parts: number[] = [];

  for (const part of receipt.discountParts) {
    parts.push(
      calculateReceiptPart(
        part,
        receipt.amountKopecks,
        parts.reduce((sum, value) => sum + value, 0)
      )
    );
  }

  return { parts, total: parts.reduce((sum, value) => sum + value, 0) };
};

export const calculateReceiptEffectiveRate = (receipt: Receipt) => {
  if (receipt.amountKopecks === 0) {
    return null;
  }

  return {
    numerator: calculateReceiptDiscount(receipt).total,
    denominator: receipt.amountKopecks,
  };
};

export const formatEffectivePermille = (receipt: Receipt): number | null => {
  const rate = calculateReceiptEffectiveRate(receipt);

  return rate ? Number(roundDiv(BigInt(rate.numerator) * 1000n, BigInt(rate.denominator))) : null;
};

export const calculateReceiptSummary = (
  receipt: Receipt,
  operations: readonly Operation[]
): ReceiptSummary => {
  const discountKopecks = calculateReceiptDiscount(receipt).total;
  const effectiveRate = calculateReceiptEffectiveRate(receipt);
  const operationsNetKopecks = operations.reduce(
    (sum, operation) => sum + calculateOperationNet(operation, effectiveRate).net,
    0
  );
  const operationsGrossKopecks = operations.reduce(
    (sum, operation) => sum + operation.amountKopecks,
    0
  );
  const differenceKopecks =
    operations.length === 0 ? 0 : receipt.amountKopecks - operationsGrossKopecks;

  return {
    amountKopecks: receipt.amountKopecks,
    discountKopecks,
    effectiveRate,
    effectivePermille: formatEffectivePermille(receipt),
    operationsNetKopecks,
    differenceKopecks,
    hasDifference: operations.length > 0 && differenceKopecks !== 0,
  };
};

export const sortReceipts = (receipts: readonly Receipt[]): Receipt[] =>
  [...receipts].sort((left, right) => left.createdAt.localeCompare(right.createdAt));

export const validateReceipt = (receipt: Receipt): ReceiptValidationError[] => {
  const errors: ReceiptValidationError[] = [];

  if (
    !Number.isSafeInteger(receipt.amountKopecks) ||
    receipt.amountKopecks <= 0 ||
    receipt.amountKopecks > MAX_AMOUNT_KOPECKS
  ) {
    errors.push('invalid-amount');
  }

  if (
    !Array.isArray(receipt.discountParts) ||
    receipt.discountParts.length < 1 ||
    receipt.discountParts.length > 2
  ) {
    errors.push('invalid-discount-parts');

    return errors;
  }

  for (const [index, part] of receipt.discountParts.entries()) {
    if (!part || !['amount', 'percent'].includes(part.mode)) {
      errors.push('invalid-discount');
      continue;
    }

    if (validateDiscount(part)) {
      errors.push('invalid-discount');
    }

    if (!isValidPercentBase(part)) {
      errors.push('invalid-percent-base');
    }

    if (index === 0 && part.mode === 'percent' && part.percentBase !== 'original') {
      errors.push('invalid-percent-base');
    }
  }

  if (receipt.comment.length > MAX_COMMENT_LENGTH) {
    errors.push('invalid-comment');
  }

  return [...new Set(errors)];
};

export const removeReceiptCascade = <T extends { receipts: Receipt[]; operations: Operation[] }>(
  transaction: { document: T },
  receiptId: string
): void => {
  const receipts = transaction.document.receipts;
  const index = receipts.findIndex((receipt) => receipt.id === receiptId);

  if (index >= 0) {
    receipts.splice(index, 1);
  }

  removeByReceipts(transaction, [receiptId]);
};

export const removeByPurchase = <T extends { receipts: Receipt[]; operations: Operation[] }>(
  transaction: { document: T },
  purchaseId: string
): void => {
  const receipts = transaction.document.receipts;
  const receiptIds = receipts
    .filter((receipt) => receipt.purchaseId === purchaseId)
    .map((receipt) => receipt.id);
  const remaining = receipts.filter((receipt) => receipt.purchaseId !== purchaseId);

  receipts.splice(0, receipts.length, ...remaining);
  removeByReceipts(transaction, receiptIds);
};

export const receiptHasDiscount = (part: ReceiptDiscountPart): boolean => !isAmountDiscount(part);
