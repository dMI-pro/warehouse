/**
 * Sale profit / commission checks (mirrors backend sale-profit.util).
 * «Комиссия»: want ≥20% of sale after paying purchase to committee
 * ⇒ sale ≥ purchase×1.25 ⇒ profit ≥ purchase×0.25.
 */

/**
 * Min profit as a fraction of purchase price.
 * 0.25 ⇒ sale must be at least purchase×1.25 so margin is ≥20% of sale.
 */
export const DEFAULT_COMMISSION_RATE = 0.25;
export const COMMISSION_TRANSACTION_TYPE_NAME = 'Комиссия';

/** Short UI label for the low-commission alert */
export const LOW_COMMISSION_LABEL = 'Комиссия < 20%';

/** Tooltip / title explaining the math */
export const LOW_COMMISSION_HINT =
  'Тип «Комиссия»: прибыль меньше 25% от цены закупа. Нужно продать ≥ закуп × 1.25, чтобы после выплаты комитету суммы закупа осталось ≥ 20% от продажи.';

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
  {
    label: 'Комиссия < 20% (прибыль < 25% закупа)',
    value: 'low_commission',
  },
];
