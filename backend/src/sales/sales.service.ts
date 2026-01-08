import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { QuerySalesDto } from './dto/query-sales.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  async create(createSaleDto: CreateSaleDto, userId: number) {
    // Транзакция: проверка товара с блокировкой строки, создание продажи и уменьшение остатка
    const result = await this.prisma.$transaction(async (tx) => {
      // Используем raw query с SELECT FOR UPDATE для блокировки строки и предотвращения race condition
      const productResult = await tx.$queryRaw<Array<{
        id: number;
        name: string;
        sku: string;
        salePrice: number;
        quantity: number;
      }>>`
        SELECT id, name, sku, "salePrice", quantity
        FROM products
        WHERE id = ${createSaleDto.productId}
        FOR UPDATE
      `;

      if (!productResult || productResult.length === 0) {
        throw new NotFoundException(`Product with ID ${createSaleDto.productId} not found`);
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

      return sale;
    });

    return result;
  }

  async findAll(query: QuerySalesDto) {
    const { productId, soldBy, startDate, endDate, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.SaleWhereInput = {};

    if (productId) {
      where.productId = productId;
    }

    if (soldBy) {
      where.soldBy = soldBy;
    }

    if (startDate || endDate) {
      where.soldAt = {};
      if (startDate) {
        where.soldAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.soldAt.lte = new Date(endDate);
      }
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
      data: sales,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        product: {
          include: {
            category: true,
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

    return sale;
  }

  async getStatistics(startDate?: string, endDate?: string) {
    const where: Prisma.SaleWhereInput = {};

    if (startDate || endDate) {
      where.soldAt = {};
      if (startDate) {
        where.soldAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.soldAt.lte = new Date(endDate);
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

  async update(id: number, updateSaleDto: UpdateSaleDto) {
    return this.prisma.$transaction(async (tx) => {
      const existingSale = await tx.sale.findUnique({
        where: { id },
      });

      if (!existingSale) {
        throw new NotFoundException(`Sale with ID ${id} not found`);
      }

      if (updateSaleDto.productId !== undefined && updateSaleDto.productId !== existingSale.productId) {
        throw new BadRequestException('Changing product ID is not allowed');
      }

      if (updateSaleDto.quantity !== undefined && updateSaleDto.quantity !== existingSale.quantity) {
        const diff = updateSaleDto.quantity - existingSale.quantity;

        const productResult = await tx.$queryRaw<Array<{ id: number; quantity: number }>>`
          SELECT id, quantity
          FROM products
          WHERE id = ${existingSale.productId}
          FOR UPDATE
        `;

        if (!productResult || productResult.length === 0) {
          throw new NotFoundException(`Product with ID ${existingSale.productId} not found`);
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

      return updatedSale;
    });
  }

  async remove(id: number) {
    return this.prisma.$transaction(async (tx) => {
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

      return tx.sale.delete({
        where: { id },
      });
    });
  }
}

