/**
 * Sale profit / commission checks (mirrors backend sale-profit.util).
 * Default commission is 20% of sale revenue.
 */

export const DEFAULT_COMMISSION_RATE = 0.2;
export const COMMISSION_TRANSACTION_TYPE_NAME = 'Комиссия';

export type SaleProfitAlert = 'loss' | 'low_commission';

export function resolveCommissionRate(committeeRate?: number | null): number {
  if (typeof committeeRate === 'number' && Number.isFinite(committeeRate) && committeeRate >= 0) {
    return committeeRate;
  }
  return DEFAULT_COMMISSION_RATE;
}

export function isCommissionTransactionType(name?: string | null): boolean {
  return (name ?? '').trim().toLowerCase() === COMMISSION_TRANSACTION_TYPE_NAME.toLowerCase();
}

export function calcSaleProfit(
  salePrice: number,
  purchasePrice: number,
  quantity: number,
): number {
  return (salePrice - purchasePrice) * quantity;
}

export function evaluateSaleProfitFlags(input: {
  salePrice: number;
  purchasePrice: number;
  quantity: number;
  transactionTypeName?: string | null;
  commissionRate?: number | null;
}): { isLoss: boolean; isLowCommission: boolean; profit: number; revenue: number } {
  const salePrice = Number(input.salePrice) || 0;
  const purchasePrice = Number(input.purchasePrice) || 0;
  const quantity = Number(input.quantity) || 0;
  const profit = calcSaleProfit(salePrice, purchasePrice, quantity);
  const revenue = salePrice * quantity;
  const isLoss = profit < 0;

  const rate = resolveCommissionRate(input.commissionRate);
  const isLowCommission =
    isCommissionTransactionType(input.transactionTypeName) &&
    revenue > 0 &&
    profit < revenue * rate;

  return { isLoss, isLowCommission, profit, revenue };
}

export const SALE_PROFIT_ALERT_OPTIONS: Array<{ label: string; value: SaleProfitAlert }> = [
  { label: 'Убыток', value: 'loss' },
  { label: 'Низкая комиссия', value: 'low_commission' },
];
