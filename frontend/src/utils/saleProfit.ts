/**
 * Sale profit / commission checks (mirrors backend sale-profit.util).
 * For «Комиссия»: min profit = purchasePrice × rate × quantity (default 25% of purchase).
 */

/** Min profit as a fraction of purchase price (default 0.25 → 25%). */
export const DEFAULT_COMMISSION_RATE = 0.25;
export const COMMISSION_TRANSACTION_TYPE_NAME = 'Комиссия';

export type SaleProfitAlert = 'loss' | 'low_commission' | 'problem';

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

export function calcMinCommissionProfit(
  purchasePrice: number,
  quantity: number,
  commissionRate?: number | null,
): number {
  const rate = resolveCommissionRate(commissionRate);
  return (Number(purchasePrice) || 0) * rate * (Number(quantity) || 0);
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

  const minProfit = calcMinCommissionProfit(purchasePrice, quantity, input.commissionRate);
  const isLowCommission =
    isCommissionTransactionType(input.transactionTypeName) &&
    purchasePrice > 0 &&
    profit < minProfit;

  return { isLoss, isLowCommission, profit, revenue };
}

export const SALE_PROFIT_ALERT_OPTIONS: Array<{ label: string; value: SaleProfitAlert }> = [
  { label: 'Все проблемные', value: 'problem' },
  { label: 'Убыток', value: 'loss' },
  { label: 'Низкая комиссия', value: 'low_commission' },
];
