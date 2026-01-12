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

    // Date filters for sales and returns
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    // 1. Get all products for this committee
    const products = await this.prisma.product.findMany({
      where: { committeeId: id },
      include: {
        sales: {
          where: {
            soldAt: Object.keys(dateFilter).length ? dateFilter : undefined
          }
        },
        returns: {
          where: {
            returnedAt: Object.keys(dateFilter).length ? dateFilter : undefined
          }
        }
      }
    });

    // 2. Calculate metrics
    let totalItems = products.length; // This is ALL items ever associated (if we don't filter products by date)
    // Actually, "totalItems" usually implies current inventory + sold + returned.
    // If we want total items *added* in a period, we'd filter products by createdAt. 
    // But the user asks for "active", "sold", "returned".
    
    let activeItemsCount = 0;
    let soldItemsCount = 0;
    let returnedItemsCount = 0;
    
    let totalPayout = 0; // sum of purchasePrice for SOLD items
    let totalRevenue = 0; // sum of salePrice for SOLD items
    let totalProfit = 0;
    
    // For graph
    const dailyStats: Record<string, { sold: number; returned: number; revenue: number; payout: number }> = {};

    for (const product of products) {
      // Active: currently has quantity > 0
      if (product.quantity > 0) {
        activeItemsCount += product.quantity;
      }

      // Sold
      for (const sale of product.sales) {
        soldItemsCount += sale.quantity;
        
        const revenue = Number(sale.salePrice) * sale.quantity;
        const cost = Number(product.purchasePrice) * sale.quantity;
        
        totalRevenue += revenue;
        totalPayout += cost;
        totalProfit += (revenue - cost);

        // Daily stats
        const dateKey = sale.soldAt.toISOString().split('T')[0];
        if (!dailyStats[dateKey]) dailyStats[dateKey] = { sold: 0, returned: 0, revenue: 0, payout: 0 };
        dailyStats[dateKey].sold += sale.quantity;
        dailyStats[dateKey].revenue += revenue;
        dailyStats[dateKey].payout += cost;
      }

      // Returned
      for (const ret of product.returns) {
        returnedItemsCount += ret.quantity;
        
        // Daily stats
        const dateKey = ret.returnedAt.toISOString().split('T')[0];
        if (!dailyStats[dateKey]) dailyStats[dateKey] = { sold: 0, returned: 0, revenue: 0, payout: 0 };
        dailyStats[dateKey].returned += ret.quantity;
      }
    }

    return {
      committee,
      metrics: {
        totalItems, // Total distinct product records
        activeItemsCount,
        soldItemsCount,
        returnedItemsCount,
        totalPayout,
        totalRevenue,
        totalProfit
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

