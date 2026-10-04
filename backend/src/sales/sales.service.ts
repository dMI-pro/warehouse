import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { QuerySalesDto } from './dto/query-sales.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { Prisma } from '@prisma/client';
import {
  sanitizeNestedProduct,
  type ProductViewer,
} from '../common/utils/product-visibility.util';
import { parseQueryDateBound } from '../common/utils/date-range.util';
import {
  COMMISSION_TRANSACTION_TYPE_NAME,
  DEFAULT_COMMISSION_RATE,
} from '../common/utils/sale-profit.util';

@Injectable()
export class SalesService {
  constructor(
    private prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
    // @Inject(forwardRef(() => AuditLogService))
    // private auditLogService?: AuditLogService,
  ) {}

  async create(
    createSaleDto: CreateSaleDto,
    userId: number,
    viewer?: ProductViewer,
  ) {
    // Транзакция: проверка товара с блокировкой строки, создание продажи и уменьшение остатка
    const result = await this.prisma.$transaction(async (tx) => {
      // Используем raw query с SELECT FOR UPDATE для блокировки строки и предотвращения race condition
      const productResult = await tx.$queryRaw<
        Array<{
          id: number;
          name: string;
          sku: string;
          salePrice: number;
          quantity: number;
        }>
      >`
        SELECT id, name, sku, "salePrice", quantity
        FROM products
        WHERE id = ${createSaleDto.productId}
        FOR UPDATE
      `;

      if (!productResult || productResult.length === 0) {
        throw new NotFoundException(
          `Product with ID ${createSaleDto.productId} not found`,
        );
      }

      const product = productResult[0];

      // Валидация доступного количества внутри транзакции (после блокировки)
      if (product.quantity < createSaleDto.quantity) {
        throw new BadRequestException(
          `Insufficient stock. Available: ${product.quantity}, Requested: ${createSaleDto.quantity}`,
        );
      }

      // Определение цены продажи
      const salePrice = createSaleDto.salePrice ?? Number(product.salePrice);

      // Создание продажи
      const sale = await tx.sale.create({
        data: {
          productId: createSaleDto.productId,
          quantity: createSaleDto.quantity,
          salePrice: salePrice,
          soldBy: userId,
          soldAt: createSaleDto.soldAt || new Date(),
        },
        include: {
          product: {
            include: {
              category: true,
              committee: true,
            },
          },
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
            },
          },
        },
      });

      // Автоматическое уменьшение остатков (атомарная операция внутри транзакции)
      await tx.product.update({
        where: { id: createSaleDto.productId },
        data: {
          quantity: {
            decrement: createSaleDto.quantity,
          },
        },
      });

      // Log action
      // Note: We can't use this.auditLogService inside transaction if it uses PrismaService.
      // AuditLogService uses PrismaService.
      // But we can call it after transaction or inside if we don't care about transactional integrity of the log (usually fine).
      // Or we can manually create audit log inside transaction.
      // To keep it simple and consistent, we'll log AFTER transaction.
      // But we need to return sale first.

      return sale;
    });

    if (userId) {
      await this.auditLogService.create({
        userId,
        action: 'sale.create',
        entityType: 'Sale',
        entityId: result.id,
        newValues: {
          productId: result.productId,
          quantity: result.quantity,
          salePrice: result.salePrice,
        },
        success: true,
      });
    }

    return sanitizeNestedProduct(result, viewer);
  }

  async findAll(query: QuerySalesDto, viewer?: ProductViewer) {
    const {
      productId,
      soldBy,
      committeeId,
      search,
      profitAlert,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.SaleWhereInput = {};

    if (productId) {
      where.productId = productId;
    }

    if (soldBy) {
      where.soldBy = soldBy;
    }

    const productWhere: Prisma.ProductWhereInput = {};
    if (committeeId) {
      productWhere.committeeId = committeeId;
    }
    if (search?.trim()) {
      const q = search.trim();
      productWhere.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (Object.keys(productWhere).length > 0) {
      where.product = productWhere;
    }

    if (startDate || endDate) {
      where.soldAt = {};
      if (startDate) {
        where.soldAt.gte = parseQueryDateBound(startDate, 'start');
      }
      if (endDate) {
        where.soldAt.lte = parseQueryDateBound(endDate, 'end');
      }
    }

    if (profitAlert) {
      const alertIds = await this.findSaleIdsByProfitAlert(profitAlert);
      where.id = { in: alertIds.length ? alertIds : [-1] };
    }

    const [sales, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        skip,
        take: limit,
        include: {
          product: {
            include: {
              category: true,
              committee: true,
              transactionType: true,
            },
          },
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
            },
          },
        },
        orderBy: {
          soldAt: 'desc',
        },
      }),
      this.prisma.sale.count({ where }),
    ]);

    return {
      data: sales.map((sale) => sanitizeNestedProduct(sale, viewer)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /** IDs of sales matching profit alert (all-time; combined with other Prisma filters). */
  private async findSaleIdsByProfitAlert(
    profitAlert: 'loss' | 'low_commission' | 'problem',
  ): Promise<number[]> {
    if (profitAlert === 'loss') {
      const rows = await this.prisma.$queryRaw<Array<{ id: number }>>`
        SELECT s.id
        FROM sales s
        INNER JOIN products p ON p.id = s."productId"
        WHERE (s."salePrice" - COALESCE(p."purchasePrice", 0)) * s.quantity < 0
      `;
      return rows.map((r) => r.id);
    }

    if (profitAlert === 'problem') {
      const rows = await this.prisma.$queryRaw<Array<{ id: number }>>`
        SELECT s.id
        FROM sales s
        INNER JOIN products p ON p.id = s."productId"
        LEFT JOIN transaction_type tt ON tt.id = p."transactionTypeId"
        WHERE
          (s."salePrice" - COALESCE(p."purchasePrice", 0)) * s.quantity < 0
          OR (
            tt.id IS NOT NULL
            AND LOWER(TRIM(tt.name)) = LOWER(${COMMISSION_TRANSACTION_TYPE_NAME})
            AND COALESCE(p."purchasePrice", 0) > 0
            AND (s."salePrice" - COALESCE(p."purchasePrice", 0)) * s.quantity
                < (COALESCE(p."purchasePrice", 0) * s.quantity * ${DEFAULT_COMMISSION_RATE})
          )
      `;
      return rows.map((r) => r.id);
    }

    const rows = await this.prisma.$queryRaw<Array<{ id: number }>>`
      SELECT s.id
      FROM sales s
      INNER JOIN products p ON p.id = s."productId"
      INNER JOIN transaction_type tt ON tt.id = p."transactionTypeId"
      WHERE LOWER(TRIM(tt.name)) = LOWER(${COMMISSION_TRANSACTION_TYPE_NAME})
        AND COALESCE(p."purchasePrice", 0) > 0
        AND (s."salePrice" - COALESCE(p."purchasePrice", 0)) * s.quantity
            < (COALESCE(p."purchasePrice", 0) * s.quantity * ${DEFAULT_COMMISSION_RATE})
    `;
    return rows.map((r) => r.id);
  }

  async findOne(id: number, viewer?: ProductViewer) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        product: {
          include: {
            category: true,
            committee: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
    });

    if (!sale) {
      throw new NotFoundException(`Sale with ID ${id} not found`);
    }

    return sanitizeNestedProduct(sale, viewer);
  }

  async getStatistics(startDate?: string, endDate?: string) {
    const where: Prisma.SaleWhereInput = {};

    if (startDate || endDate) {
      where.soldAt = {};
      if (startDate) {
        where.soldAt.gte = parseQueryDateBound(startDate, 'start');
      }
      if (endDate) {
        where.soldAt.lte = parseQueryDateBound(endDate, 'end');
      }
    }

    const [totalSales, totalRevenue, totalQuantity] = await Promise.all([
      this.prisma.sale.count({ where }),
      this.prisma.sale.aggregate({
        where,
        _sum: {
          salePrice: true,
        },
      }),
      this.prisma.sale.aggregate({
        where,
        _sum: {
          quantity: true,
        },
      }),
    ]);

    return {
      totalSales,
      totalRevenue: totalRevenue._sum.salePrice || 0,
      totalQuantity: totalQuantity._sum.quantity || 0,
    };
  }

  async update(
    id: number,
    updateSaleDto: UpdateSaleDto,
    userId: number,
    viewer?: ProductViewer,
  ) {
    const result = await this.prisma.$transaction(async (tx) => {
      const existingSale = await tx.sale.findUnique({
        where: { id },
      });

      if (!existingSale) {
        throw new NotFoundException(`Sale with ID ${id} not found`);
      }

      if (
        updateSaleDto.productId !== undefined &&
        updateSaleDto.productId !== existingSale.productId
      ) {
        throw new BadRequestException('Changing product ID is not allowed');
      }

      if (
        updateSaleDto.quantity !== undefined &&
        updateSaleDto.quantity !== existingSale.quantity
      ) {
        const diff = updateSaleDto.quantity - existingSale.quantity;

        const productResult = await tx.$queryRaw<
          Array<{ id: number; quantity: number }>
        >`
          SELECT id, quantity
          FROM products
          WHERE id = ${existingSale.productId}
          FOR UPDATE
        `;

        if (!productResult || productResult.length === 0) {
          throw new NotFoundException(
            `Product with ID ${existingSale.productId} not found`,
          );
        }
        const product = productResult[0];

        if (diff > 0 && product.quantity < diff) {
          throw new BadRequestException(
            `Insufficient stock for update. Available: ${product.quantity}, Required additional: ${diff}`,
          );
        }

        await tx.product.update({
          where: { id: existingSale.productId },
          data: {
            quantity: {
              decrement: diff,
            },
          },
        });
      }

      const updatedSale = await tx.sale.update({
        where: { id },
        data: {
          quantity: updateSaleDto.quantity,
          salePrice: updateSaleDto.salePrice,
          soldAt: updateSaleDto.soldAt,
        },
        include: {
          product: {
            include: {
              category: true,
              committee: true,
            },
          },
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
            },
          },
        },
      });

      return { existingSale, updatedSale };
    });

    if (userId) {
      const oldValues: any = {};
      const newValues: any = {};
      const { existingSale, updatedSale } = result;

      Object.keys(updateSaleDto).forEach((key) => {
        const k = key as keyof UpdateSaleDto;
        if ((existingSale as any)[k] !== (updatedSale as any)[k]) {
          // Wait, updateSaleDto might not have all fields. updatedSale has.
          // Correct logic: Compare existing vs updated
          const val1 = (existingSale as any)[k];
          const val2 = (updatedSale as any)[k];
          // Note: dates might need better comparison
          if (JSON.stringify(val1) !== JSON.stringify(val2)) {
            oldValues[k] = val1;
            newValues[k] = val2;
          }
        }
      });

      // Also check if quantity changed, it affects stock, maybe log that too?
      // But product update log is separate (handled by ProductsService if called directly, but here we use prisma transaction which bypasses ProductsService logic unless we call it).
      // Since we modify product table directly, ProductsService logging is NOT triggered.
      // We should log product quantity change here too or as a side effect?
      // Let's just log sale update.

      if (Object.keys(newValues).length > 0) {
        await this.auditLogService.create({
          userId,
          action: 'sale.update',
          entityType: 'Sale',
          entityId: id,
          oldValues,
          newValues,
          success: true,
        });
      }
    }

    return sanitizeNestedProduct(result.updatedSale, viewer);
  }

  async remove(id: number, userId: number) {
    const result = await this.prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id },
      });

      if (!sale) {
        throw new NotFoundException(`Sale with ID ${id} not found`);
      }

      await tx.$queryRaw`
        SELECT id FROM products WHERE id = ${sale.productId} FOR UPDATE
      `;

      await tx.product.update({
        where: { id: sale.productId },
        data: {
          quantity: {
            increment: sale.quantity,
          },
        },
      });

      await tx.sale.delete({
        where: { id },
      });

      return sale;
    });

    if (userId) {
      await this.auditLogService.create({
        userId,
        action: 'sale.delete',
        entityType: 'Sale',
        entityId: id,
        oldValues: result,
        success: true,
      });
    }

    return result;
  }
}
