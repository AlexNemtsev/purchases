import type { Operation } from '../../operation/@x/purchase';
import type { Receipt } from '../../receipt/@x/purchase';

export interface Purchase {
  id: string;
  title: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseSummary {
  gross: number;
  net: number;
  discount: number;
  rate: number | null;
  refundTotal: number;
}

export type PurchaseValidationError = 'invalid-title' | 'invalid-date';

export type PurchaseReceipts = readonly Receipt[];

export type PurchaseOperations = readonly Operation[];
