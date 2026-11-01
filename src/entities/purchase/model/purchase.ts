import type { Purchase, PurchaseSummary, PurchaseValidationError } from './types';
import { MAX_TITLE_LENGTH } from '../../../shared/config/limits';
import { formatDateRu, isValidIsoDate } from '../../../shared/lib/date';
import { roundDiv } from '../../../shared/lib/money';
import { calculateOperationNet } from '../../operation/@x/purchase';
import type { Operation } from '../../operation/@x/purchase';
import { calculateReceiptEffectiveRate, removeByPurchase } from '../../receipt/@x/purchase';
import type { Receipt } from '../../receipt/@x/purchase';

export const autoTitle = (isoDate: string): string => `Закупка от ${formatDateRu(isoDate)}`;

export const retitleOnDateChange = (purchase: Purchase, newDate: string): Purchase => ({
  ...purchase,
  date: newDate,
  title: purchase.title === autoTitle(purchase.date) ? autoTitle(newDate) : purchase.title,
});

export const validatePurchase = (purchase: Purchase): PurchaseValidationError[] => {
  const errors: PurchaseValidationError[] = [];

  if (!purchase.title.trim() || purchase.title.length > MAX_TITLE_LENGTH) {
    errors.push('invalid-title');
  }

  if (!isValidIsoDate(purchase.date)) {
    errors.push('invalid-date');
  }

  return errors;
};

export const sortPurchases = (purchases: readonly Purchase[]): Purchase[] =>
  [...purchases].sort(
    (left, right) =>
      right.date.localeCompare(left.date) || right.createdAt.localeCompare(left.createdAt)
  );

export const calculatePurchaseSummary = (
  receipts: readonly Receipt[],
  operations: readonly Operation[]
): PurchaseSummary => {
  const receiptsById = new Map(receipts.map((receipt) => [receipt.id, receipt]));
  let gross = 0;
  let net = 0;
  let refundTotal = 0;

  for (const operation of operations) {
    const refund = operation.refundKopecks ?? 0;
    const receipt = receiptsById.get(operation.receiptId);
    const discount = receipt ? calculateReceiptEffectiveRate(receipt) : null;

    gross += operation.amountKopecks - refund;
    refundTotal += refund;
    net += calculateOperationNet(operation, discount).net;
  }

  const discount = gross - net;
  const rate = gross === 0 ? null : Number(roundDiv(BigInt(discount) * 1000n, BigInt(gross)));

  return { gross, net, discount, rate, refundTotal };
};

export const deletePurchaseCascade = <
  T extends { purchases: Purchase[]; receipts: Receipt[]; operations: Operation[] },
>(
  transaction: { document: T },
  purchaseId: string
): void => {
  const purchases = transaction.document.purchases;
  const index = purchases.findIndex((purchase) => purchase.id === purchaseId);

  if (index >= 0) {
    purchases.splice(index, 1);
  }

  removeByPurchase(transaction, purchaseId);
};
