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

    // Date filters for sales and returns - ВКЛЮЧИТЕЛЬНО КОНЕЧНУЮ ДАТУ
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
      dateFilter.gte.setUTCHours(0, 0, 0, 0); // Начало дня
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setUTCHours(23, 59, 59, 999); // Конец дня (включительно)
      dateFilter.lte = end;
    }

    // Получаем все продукты комитета (без фильтрации по дате)
    const products = await this.prisma.product.findMany({
      where: { 
        committeeId: id,
        // Фильтруем продукты по дате поступления, если указан период
        ...(Object.keys(dateFilter).length ? { 
          OR: [
            { arrivalDate: dateFilter },
            { createdAt: dateFilter }
          ]
        } : {})
      },
      include: {
        sales: {
          where: Object.keys(dateFilter).length ? {
            soldAt: dateFilter
          } : {},
          orderBy: {
            soldAt: 'asc'
          }
        },
        returns: {
          where: Object.keys(dateFilter).length ? {
            returnedAt: dateFilter
          } : {},
          orderBy: {
            returnedAt: 'asc'
          }
        },
        category: true,
        warehouse: true,
        transactionType: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Расчет метрик
    let totalPositions = 0; // Кол-во позиций (уникальных товаров)
    let totalItems = 0; // Всего товара (сумма quantity)
    let activePositions = 0; // Количество активных позиций (quantity > 0)
    let activeItems = 0; // Количество активных товаров (сумма quantity где quantity > 0)
    let soldItems = 0; // Продано
    let returnedItems = 0; // Возвращено
    let totalRevenue = 0; // Выручка
    let totalProfit = 0; // Прибыль
    let totalPayout = 0; // Выплачено комитету

    // Для графика
    const dailyStats: Record<string, { 
      positions: number; // Кол-во позиций
      items: number; // Всего товара
      activePositions: number; // Активные позиции
      activeItems: number; // Активные товары
      sold: number; // Продано
      returned: number; // Возвращено
      revenue: number; // Выручка
      profit: number; // Прибыль
      payout: number; // Выплачено
    }> = {};

    // Обрабатываем каждый продукт
    for (const product of products) {
      const productQuantity = product.quantity || 0;
      
      // Основные метрики
      totalPositions++; // Увеличиваем счетчик позиций
      totalItems += productQuantity;
      
      if (productQuantity > 0) {
        activePositions++; // Активная позиция
        activeItems += productQuantity; // Активные товары (сумма quantity)
      }

      // Продажи товара
      for (const sale of product.sales) {
        const saleQuantity = sale.quantity;
        soldItems += saleQuantity;
        
        const salePrice = Number(sale.salePrice) || 0;
        const purchasePrice = Number(product.purchasePrice) || 0;
        const revenue = salePrice * saleQuantity;
        const payout = purchasePrice * saleQuantity; // Выплата комитету (цена закупки)
        const profit = revenue - payout;
        
        totalRevenue += revenue;
        totalPayout += payout;
        totalProfit += profit;

        // Ежедневная статистика
        const saleDate = sale.soldAt;
        const dateKey = saleDate.toISOString().split('T')[0];
        
        if (!dailyStats[dateKey]) {
          dailyStats[dateKey] = { 
            positions: 0, items: 0, 
            activePositions: 0, activeItems: 0,
            sold: 0, returned: 0, 
            revenue: 0, profit: 0, payout: 0 
          };
        }
        dailyStats[dateKey].sold += saleQuantity;
        dailyStats[dateKey].revenue += revenue;
        dailyStats[dateKey].payout += payout;
        dailyStats[dateKey].profit += profit;
      }

      // Возвраты товара
      for (const ret of product.returns) {
        const returnQuantity = ret.quantity;
        returnedItems += returnQuantity;
        
        // Ежедневная статистика
        const returnDate = ret.returnedAt;
        const dateKey = returnDate.toISOString().split('T')[0];
        
        if (!dailyStats[dateKey]) {
          dailyStats[dateKey] = { 
            positions: 0, items: 0, 
            activePositions: 0, activeItems: 0,
            sold: 0, returned: 0, 
            revenue: 0, profit: 0, payout: 0 
          };
        }
        dailyStats[dateKey].returned += returnQuantity;
      }
    }

    // Также добавляем информацию о позициях и товарах в dailyStats
    for (const product of products) {
      const productDate = product.arrivalDate || product.createdAt;
      if (productDate) {
        const dateKey = productDate.toISOString().split('T')[0];
        
        if (!dailyStats[dateKey]) {
          dailyStats[dateKey] = { 
            positions: 0, items: 0, 
            activePositions: 0, activeItems: 0,
            sold: 0, returned: 0, 
            revenue: 0, profit: 0, payout: 0 
          };
        }
        
        // Увеличиваем позиции только если дата в пределах фильтра
        if (!Object.keys(dateFilter).length || 
            (productDate >= (dateFilter.gte || new Date(0)) && 
            productDate <= (dateFilter.lte || new Date()))) {
          dailyStats[dateKey].positions++;
          dailyStats[dateKey].items += product.quantity || 0;
          if ((product.quantity || 0) > 0) {
            dailyStats[dateKey].activePositions++;
            dailyStats[dateKey].activeItems += product.quantity || 0;
          }
        }
      }
    }

    return {
      committee,
      metrics: {
        totalPositions, // Кол-во позиций (всего записей товаров)
        totalItems, // Всего товара (сумма quantity всех позиций)
        activePositions, // Количество активных позиций (позиций с quantity > 0)
        activeItems, // Количество активных товаров (сумма quantity где quantity > 0)
        soldItems, // Продано (шт)
        returnedItems, // Возвращено (шт)
        totalRevenue, // Выручка
        totalProfit, // Прибыль
        totalPayout, // Выплачено комитету
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
