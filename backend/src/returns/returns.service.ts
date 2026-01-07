import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReturnDto } from './dto/create-return.dto';

@Injectable()
export class ReturnsService {
  constructor(private prisma: PrismaService) {}

  async create(createReturnDto: CreateReturnDto, userId: number) {
    const { productId, quantity, reason, returnedAt } = createReturnDto;

    // Check product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Transaction: Create return record and update product quantity
    // NOTE: For returns, we usually INCREASE the stock quantity because the item is coming back
    // However, the user said "если его забрали обратно(без продажи, передумали продавать или другие причины)"
    // which implies the item is leaving the warehouse (returned TO owner), NOT returned FROM customer.
    // The previous implementation DECREMENTED quantity, which aligns with "item leaving warehouse".
    // I will keep decrement logic but ensure it's correct.
    
    // Check stock availability if we are removing items
    if (product.quantity < quantity) {
      throw new BadRequestException(`Insufficient stock. Available: ${product.quantity}, Requested return: ${quantity}`);
    }

    return this.prisma.$transaction(async (prisma) => {
      // Decrease quantity (item leaving warehouse)
      await prisma.product.update({
        where: { id: productId },
        data: { quantity: { decrement: quantity } },
      });

      // Create return record
      // Using 'connect' for relations is safer than passing ID directly if the schema expects relation input
      const returnRecord = await prisma.return.create({
        data: {
          quantity,
          reason,
          returnedAt: returnedAt ? new Date(returnedAt) : new Date(),
          product: { connect: { id: productId } },
          user: { connect: { id: userId } },
        },
        include: {
          product: true,
          user: true,
        },
      });

      return returnRecord;
    });
  }

  async findAll(query: any) {
     return this.prisma.return.findMany({
       include: {
         product: true,
         user: true,
       },
       orderBy: {
         returnedAt: 'desc',
       },
     });
  }
}
