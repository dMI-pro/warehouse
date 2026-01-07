import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReturnDto } from './dto/create-return.dto';

@Injectable()
export class ReturnsService {
  constructor(private prisma: PrismaService) {}

  async create(createReturnDto: CreateReturnDto, userId: number) {
    const { productId, quantity, reason } = createReturnDto;

    // Check product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Check stock availability
    if (product.quantity < quantity) {
      throw new BadRequestException(`Insufficient stock. Available: ${product.quantity}, Requested return: ${quantity}`);
    }

    // Transaction: Create return record and update product quantity
    return this.prisma.$transaction(async (prisma) => {
      // Decrease quantity
      await prisma.product.update({
        where: { id: productId },
        data: { quantity: { decrement: quantity } },
      });

      // Create return record
      const returnRecord = await prisma.return.create({
        data: {
          productId,
          quantity,
          reason,
          returnedBy: userId,
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
