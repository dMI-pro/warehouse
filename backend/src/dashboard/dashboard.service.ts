import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryDashboardDto } from './dto/query-dashboard.dto';
import {
  COMMISSION_TRANSACTION_TYPE_NAME,
  DEFAULT_COMMISSION_RATE,
} from '../common/utils/sale-profit.util';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(query: QueryDashboardDto) {
    const chartDays = query.chartDays ?? 30;

    const chartStart = new Date();
    chartStart.setHours(0, 0, 0, 0);
    chartStart.setDate(chartStart.getDate() - (chartDays - 1));

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const [
      productStats,
      soldAgg,
      returnedAgg,
      newArrivals,
      lowStockProducts,
      longStorageProducts,
      recentSales,
      lastReturns,
      salesChartRows,
      problemSales,
    ] = await Promise.all([
      this.getProductStats(),
      // All-time totals (same semantics as committees.getStatistics)
      this.prisma.sale.aggregate({
        _sum: { quantity: true },
      }),
      this.prisma.return.aggregate({
        _sum: { quantity: true },
      }),
      this.prisma.product.findMany({
        where: { arrivalDate: { not: null } },
        orderBy: { arrivalDate: 'desc' },
        take: 5,
        select: {
          name: true,
          quantity: true,
          arrivalDate: true,
        },
      }),
      this.prisma.$queryRaw<
        Array<{
          id: number;
          name: string;
          quantity: number;
          minStockLevel: number;
          arrivalDate: Date | null;
          createdAt: Date;
        }>
      >`
        SELECT id, name, quantity, "minStockLevel", "arrivalDate", "createdAt"
        FROM products
        WHERE "minStockLevel" > 0 AND quantity < "minStockLevel"
        ORDER BY name ASC
      `,
      this.prisma.product.findMany({
        where: {
          quantity: { gt: 0 },
          OR: [
            { arrivalDate: { lt: ninetyDaysAgo } },
            {
              AND: [{ arrivalDate: null }, { createdAt: { lt: ninetyDaysAgo } }],
            },
          ],
        },
        select: {
          id: true,
          name: true,
          quantity: true,
          minStockLevel: true,
          arrivalDate: true,
          createdAt: true,
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.sale.findMany({
        take: 5,
        orderBy: { soldAt: 'desc' },
        include: {
          product: { select: { name: true } },
          user: {
            select: { id: true, username: true, fullName: true },
          },
        },
      }),
      this.prisma.return.findMany({
        take: 5,
        orderBy: { returnedAt: 'desc' },
        include: {
          product: { select: { name: true } },
          user: {
            select: { id: true, username: true, fullName: true },
          },
        },
      }),
      this.prisma.$queryRaw<Array<{ date: Date; amount: number }>>`
        SELECT DATE("soldAt") AS date,
               SUM("salePrice" * quantity)::float AS amount
        FROM sales
        WHERE "soldAt" >= ${chartStart}
        GROUP BY DATE("soldAt")
        ORDER BY date ASC
      `,
      this.getProblemSalesCounts(),
    ]);

    const soldItemsCount = soldAgg._sum.quantity ?? 0;
    const returnedItemsCount = returnedAgg._sum.quantity ?? 0;

    return {
      stats: {
        totalPositions: productStats.total_positions,
        totalItemsQuantity:
          productStats.total_quantity + soldItemsCount + returnedItemsCount,
        activePositions: productStats.active_positions,
        activeItemsCount: productStats.active_items,
        soldItemsCount,
        returnedItemsCount,
        totalValue: productStats.total_value,
      },
      problemSales,
      newArrivals: newArrivals.map((product) => ({
        name: product.name,
        quantity: product.quantity,
        arrivalDate: product.arrivalDate,
      })),
      lowStockProducts,
      longStorageProducts,
      recentSales: recentSales.map((sale) => ({
        productName: sale.product?.name || 'Неизвестный товар',
        quantity: sale.quantity,
        amount: Number(sale.salePrice) * sale.quantity,
        time: sale.soldAt,
        userName: sale.user?.fullName || sale.user?.username || 'Система',
      })),
      lastReturns: lastReturns.map((ret) => ({
        productName: ret.product?.name || 'Товар',
        quantity: ret.quantity,
        time: ret.returnedAt,
        userName: ret.user?.fullName || ret.user?.username || 'Система',
      })),
      salesChart: salesChartRows.map((row) => ({
        date:
          row.date instanceof Date
            ? row.date.toISOString().split('T')[0]
            : String(row.date),
        amount: Number(row.amount) || 0,
      })),
    };
  }

  private async getProblemSalesCounts(): Promise<{
    lossCount: number;
    lowCommissionCount: number;
    recent: Array<{
      id: number;
      productName: string;
      amount: number;
      profit: number;
      time: Date;
      reason: 'loss' | 'low_commission';
    }>;
  }> {
    const [lossRow] = await this.prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*)::int AS count
      FROM sales s
      INNER JOIN products p ON p.id = s."productId"
      WHERE (s."salePrice" - COALESCE(p."purchasePrice", 0)) * s.quantity < 0
    `;

    const [lowCommissionRow] = await this.prisma.$queryRaw<
      Array<{ count: number }>
    >`
      SELECT COUNT(*)::int AS count
      FROM sales s
      INNER JOIN products p ON p.id = s."productId"
      INNER JOIN transaction_type tt ON tt.id = p."transactionTypeId"
      WHERE LOWER(TRIM(tt.name)) = LOWER(${COMMISSION_TRANSACTION_TYPE_NAME})
        AND (s."salePrice" * s.quantity) > 0
        AND (s."salePrice" - COALESCE(p."purchasePrice", 0)) * s.quantity
            < (s."salePrice" * s.quantity * ${DEFAULT_COMMISSION_RATE})
    `;

    const recentRows = await this.prisma.$queryRaw<
      Array<{
        id: number;
        productName: string;
        amount: number;
        profit: number;
        time: Date;
        reason: string;
      }>
    >`
      SELECT
        s.id,
        COALESCE(p.name, 'Неизвестный товар') AS "productName",
        (s."salePrice" * s.quantity)::float AS amount,
        ((s."salePrice" - COALESCE(p."purchasePrice", 0)) * s.quantity)::float AS profit,
        s."soldAt" AS time,
        CASE
          WHEN (s."salePrice" - COALESCE(p."purchasePrice", 0)) * s.quantity < 0
            THEN 'loss'
          ELSE 'low_commission'
        END AS reason
      FROM sales s
      INNER JOIN products p ON p.id = s."productId"
      LEFT JOIN transaction_type tt ON tt.id = p."transactionTypeId"
      WHERE
        (s."salePrice" - COALESCE(p."purchasePrice", 0)) * s.quantity < 0
        OR (
          tt.id IS NOT NULL
          AND LOWER(TRIM(tt.name)) = LOWER(${COMMISSION_TRANSACTION_TYPE_NAME})
          AND (s."salePrice" * s.quantity) > 0
          AND (s."salePrice" - COALESCE(p."purchasePrice", 0)) * s.quantity
              < (s."salePrice" * s.quantity * ${DEFAULT_COMMISSION_RATE})
        )
      ORDER BY s."soldAt" DESC
      LIMIT 8
    `;

    return {
      lossCount: lossRow?.count ?? 0,
      lowCommissionCount: lowCommissionRow?.count ?? 0,
      recent: recentRows.map((row) => ({
        id: row.id,
        productName: row.productName,
        amount: Number(row.amount) || 0,
        profit: Number(row.profit) || 0,
        time: row.time,
        reason:
          row.reason === 'loss' ? ('loss' as const) : ('low_commission' as const),
      })),
    };
  }

  private async getProductStats() {
    const [row] = await this.prisma.$queryRaw<
      Array<{
        total_positions: number;
        total_quantity: number;
        active_positions: number;
        active_items: number;
        total_value: number;
      }>
    >`
      SELECT
        COUNT(*)::int AS total_positions,
        COALESCE(SUM(quantity), 0)::int AS total_quantity,
        COUNT(*) FILTER (WHERE quantity > 0)::int AS active_positions,
        COALESCE(SUM(quantity) FILTER (WHERE quantity > 0), 0)::int AS active_items,
        COALESCE(SUM("salePrice" * quantity), 0)::float AS total_value
      FROM products
    `;

    return (
      row ?? {
        total_positions: 0,
        total_quantity: 0,
        active_positions: 0,
        active_items: 0,
        total_value: 0,
      }
    );
  }
}
