import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommitteeDto } from './dto/create-committee.dto';
import { UpdateCommitteeDto } from './dto/update-committee.dto';

@Injectable()
export class CommitteesService {
  constructor(private prisma: PrismaService) {}

  async create(createCommitteeDto: CreateCommitteeDto) {
    return this.prisma.committee.create({
      data: {
        name: createCommitteeDto.name,
        description: createCommitteeDto.description,
        contactInfo: createCommitteeDto.contactInfo,
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.committee.findMany({
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const committee = await this.prisma.committee.findUnique({
      where: { id },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            sku: true,
            salePrice: true,
            quantity: true,
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!committee) {
      throw new NotFoundException(`Committee with ID ${id} not found`);
    }

    return committee;
  }

  async getStatistics(id: number, startDate?: string, endDate?: string) {
    const committee = await this.prisma.committee.findUnique({
      where: { id },
    });

    if (!committee) {
      throw new NotFoundException(`Committee with ID ${id} not found`);
    }

    // Date filters
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
      dateFilter.gte.setUTCHours(0, 0, 0, 0);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setUTCHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    // Получаем ВСЕ товары комитета
    const products = await this.prisma.product.findMany({
      where: { committeeId: id },
      include: {
        sales: {
          where: Object.keys(dateFilter).length ? { soldAt: dateFilter } : {},
        },
        returns: {
          where: Object.keys(dateFilter).length ? { returnedAt: dateFilter } : {},
        },
      },
    });

    // Расчет метрик
    let totalPositions = 0; // Кол-во позиций (записей товаров)
    let totalItemsQuantity = 0; // Всего товара (сумма quantity)
    let activePositions = 0; // Позиции с quantity > 0
    let activeItemsCount = 0; // Сумма quantity где quantity > 0
    let soldItemsCount = 0; // Продано
    let returnedItemsCount = 0; // Возвращено
    let totalRevenue = 0; // Выручка
    let totalProfit = 0; // Прибыль
    let totalPayout = 0; // Выплачено

    const dailyStats: Record<string, any> = {};

    // Обрабатываем каждый продукт
    for (const product of products) {
      const quantity = product.quantity || 0;
      
      // Основные метрики товаров
      totalPositions++;
      totalItemsQuantity += quantity;
      
      if (quantity > 0) {
        activePositions++;
        activeItemsCount += quantity;
      }

      // Продажи
      for (const sale of product.sales) {
        soldItemsCount += sale.quantity;
        
        const salePrice = Number(sale.salePrice) || 0;
        const purchasePrice = Number(product.purchasePrice) || 0;
        const revenue = salePrice * sale.quantity;
        const payout = purchasePrice * sale.quantity;
        const profit = revenue - payout;
        
        totalRevenue += revenue;
        totalPayout += payout;
        totalProfit += profit;

        // Daily stats
        const dateKey = sale.soldAt.toISOString().split('T')[0];
        if (!dailyStats[dateKey]) {
          dailyStats[dateKey] = { sold: 0, returned: 0, revenue: 0, profit: 0, payout: 0 };
        }
        dailyStats[dateKey].sold += sale.quantity;
        dailyStats[dateKey].revenue += revenue;
        dailyStats[dateKey].payout += payout;
        dailyStats[dateKey].profit += profit;
      }

      // Возвраты
      for (const ret of product.returns) {
        returnedItemsCount += ret.quantity;
        
        const dateKey = ret.returnedAt.toISOString().split('T')[0];
        if (!dailyStats[dateKey]) {
          dailyStats[dateKey] = { sold: 0, returned: 0, revenue: 0, profit: 0, payout: 0 };
        }
        dailyStats[dateKey].returned += ret.quantity;
      }
    }

    // Складываем активные, проданные и возвращенные товары
    totalItemsQuantity += soldItemsCount + returnedItemsCount;

    return {
      committee,
      metrics: {
        totalPositions,         // Кол-во позиций (записей товаров)
        totalItemsQuantity,     // Всего товара (сумма quantity)
        activePositions,        // Активные позиции (с quantity > 0)
        activeItemsCount,       // Активные товары (сумма quantity > 0)
        soldItemsCount,         // Продано
        returnedItemsCount,     // Возвращено
        totalRevenue,           // Выручка
        totalProfit,            // Прибыль
        totalPayout,            // Выплачено комитету
      },
      dailyStats
    };
  }

  async update(id: number, updateCommitteeDto: UpdateCommitteeDto) {
    const committee = await this.prisma.committee.findUnique({
      where: { id },
    });

    if (!committee) {
      throw new NotFoundException(`Committee with ID ${id} not found`);
    }

    return this.prisma.committee.update({
      where: { id },
      data: updateCommitteeDto,
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });
  }

  async remove(id: number) {
    const committee = await this.prisma.committee.findUnique({
      where: { id },
      include: {
        products: true,
      },
    });

    if (!committee) {
      throw new NotFoundException(`Committee with ID ${id} not found`);
    }

    // Проверка наличия товаров у коммитета
    if (committee.products.length > 0) {
      throw new ConflictException('Cannot delete committee with associated products');
    }

    return this.prisma.committee.delete({
      where: { id },
    });
  }
}
