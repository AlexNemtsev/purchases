import type { AmountDiscount, PercentDiscount } from '../../../shared/lib/discount';
import type { Operation, OperationRate } from '../../operation/@x/receipt';

export type PercentBase = 'original' | 'afterPrevious';

export type ReceiptDiscountPart = AmountDiscount | (PercentDiscount & { percentBase: PercentBase });

export interface Receipt {
  id: string;
  purchaseId: string;
  amountKopecks: number;
  discountParts: [ReceiptDiscountPart] | [ReceiptDiscountPart, ReceiptDiscountPart];
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReceiptDiscountCalculation {
  parts: number[];
  total: number;
}

export interface ReceiptSummary {
  amountKopecks: number;
  discountKopecks: number;
  effectiveRate: OperationRate | null;
  effectivePermille: number | null;
  operationsNetKopecks: number;
  differenceKopecks: number;
  hasDifference: boolean;
}

export type ReceiptValidationError =
  | 'invalid-amount'
  | 'invalid-discount-parts'
  | 'invalid-discount'
  | 'invalid-percent-base'
  | 'invalid-comment';

export type ReceiptOperations = readonly Operation[];
