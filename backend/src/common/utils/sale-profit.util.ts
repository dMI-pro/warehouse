/**
 * Sale profit / commission checks.
 * For transaction type «Комиссия»: min profit = purchasePrice * rate * quantity
 * (default 25% of purchase — same idea as salePrice ≈ purchase × 1.25).
 * Optional per-committee rate can be passed later without changing call sites.
 */

/** Min profit as a fraction of purchase price (default 0.25 → 25%). */
export const DEFAULT_COMMISSION_RATE = 0.25;
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

/** Min acceptable profit for commission sales: purchase × rate × qty */
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
  /** Future: committee.commissionRate (0..1 of purchase). Omit → DEFAULT_COMMISSION_RATE */
  commissionRate?: number | null;
}): { isLoss: boolean; isLowCommission: boolean; profit: number; revenue: number } {
  const salePrice = Number(input.salePrice) || 0;
  const purchasePrice = Number(input.purchasePrice) || 0;
  const quantity = Number(input.quantity) || 0;
  const profit = calcSaleProfit(salePrice, purchasePrice, quantity);
  const revenue = calcSaleRevenue(salePrice, quantity);
  const isLoss = profit < 0;

  const minProfit = calcMinCommissionProfit(
    purchasePrice,
    quantity,
    input.commissionRate,
  );
  const isLowCommission =
    isCommissionTransactionType(input.transactionTypeName) &&
    purchasePrice > 0 &&
    profit < minProfit;

  return { isLoss, isLowCommission, profit, revenue };
}
