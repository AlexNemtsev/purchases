import type { AmountDiscount, PercentDiscount } from '../../../shared/lib/discount';

export type OperationDiscount = AmountDiscount | PercentDiscount;

export type ReceiptDiscountBase = 'beforeOperationDiscount' | 'afterOperationDiscount';

export interface Operation {
  id: string;
  receiptId: string;
  categoryId: string;
  amountKopecks: number;
  comment: string;
  refundKopecks?: number;
  operationDiscount?: OperationDiscount;
  receiptDiscountBase?: ReceiptDiscountBase;
  createdAt: string;
  updatedAt: string;
}

export interface OperationRate {
  numerator: number;
  denominator: number;
}

export type OperationWarning = 'negative-net' | 'refund-exceeds-expense';

export interface OperationCalculation {
  base: number;
  operationDiscount: number;
  receiptDiscount: number;
  net: number;
  warnings: OperationWarning[];
}

export type OperationValidationError =
  | 'invalid-amount'
  | 'invalid-refund'
  | 'category-required'
  | 'category-inactive'
  | 'invalid-discount'
  | 'invalid-receipt-discount-base'
  | 'invalid-comment';
