/**
 * Sale profit / commission checks.
 * Default commission is 20% of sale revenue.
 * Optional per-committee rate can be passed later without changing call sites.
 */

export const DEFAULT_COMMISSION_RATE = 0.2;
export const COMMISSION_TRANSACTION_TYPE_NAME = 'Комиссия';

export type SaleProfitAlert = 'loss' | 'low_commission';

export function resolveCommissionRate(
  committeeRate?: number | null,
): number {
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

export function calcSaleRevenue(salePrice: number, quantity: number): number {
  return salePrice * quantity;
}

export function evaluateSaleProfitFlags(input: {
  salePrice: number;
  purchasePrice: number;
  quantity: number;
  transactionTypeName?: string | null;
  /** Future: committee.commissionRate (0..1). Omit → DEFAULT_COMMISSION_RATE */
  commissionRate?: number | null;
}): { isLoss: boolean; isLowCommission: boolean; profit: number; revenue: number } {
  const salePrice = Number(input.salePrice) || 0;
  const purchasePrice = Number(input.purchasePrice) || 0;
  const quantity = Number(input.quantity) || 0;
  const profit = calcSaleProfit(salePrice, purchasePrice, quantity);
  const revenue = calcSaleRevenue(salePrice, quantity);
  const isLoss = profit < 0;

  const rate = resolveCommissionRate(input.commissionRate);
  const isLowCommission =
    isCommissionTransactionType(input.transactionTypeName) &&
    revenue > 0 &&
    profit < revenue * rate;

  return { isLoss, isLowCommission, profit, revenue };
}
