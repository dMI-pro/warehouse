/**
 * Sale profit / commission checks.
 * For type «Комиссия»: after paying the committee the purchase price, we want
 * ≥20% of the sale left. That means sale ≥ purchase×1.25, i.e. profit ≥ purchase×0.25.
 * Optional per-committee rate can be passed later without changing call sites.
 */

/**
 * Min profit as a fraction of purchase price.
 * 0.25 ⇒ sale must be at least purchase×1.25 so margin is ≥20% of sale.
 */
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

/** Min acceptable profit for commission sales: purchase × 0.25 × qty */
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
  /** Future: committee rate as fraction of purchase (default 0.25). */
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
