import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReturnDto } from './dto/create-return.dto';
import { UpdateReturnDto } from './dto/update-return.dto';

@Injectable()
export class ReturnsService {
  constructor(private prisma: PrismaService) {}

  async create(createReturnDto: CreateReturnDto, userId: number) {
    const { productId, quantity, reason, returnedAt } = createReturnDto;

    if (!userId) {
      throw new BadRequestException('User ID is required to create a return');
    }

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
      const returnRecord = await prisma.return.create({
        data: {
          quantity,
          reason,
          returnedAt: returnedAt ? new Date(returnedAt) : new Date(),
          productId,
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

    async findOne(id: number) {
    const returnRecord = await this.prisma.return.findUnique({
      where: { id },
      include: {
        product: true,
        user: true,
      },
    });

    if (!returnRecord) {
      throw new NotFoundException(`Return with ID ${id} not found`);
    }

    return returnRecord;
  }

  async update(id: number, updateReturnDto: UpdateReturnDto) {
    return this.prisma.$transaction(async (prisma) => {
      const existingReturn = await prisma.return.findUnique({
        where: { id },
      });

      if (!existingReturn) {
        throw new NotFoundException(`Return with ID ${id} not found`);
      }

      // Проверяем, что productId не меняется
      if (updateReturnDto.productId !== existingReturn.productId) {
        throw new BadRequestException('Changing product ID is not allowed');
      }

      const product = await prisma.product.findUnique({
        where: { id: existingReturn.productId },
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${existingReturn.productId} not found`);
      }

      // Рассчитываем разницу в количестве
      const quantityDiff = updateReturnDto.quantity - existingReturn.quantity;

      // Если новое количество больше старого, проверяем достаточно ли товара
      if (quantityDiff > 0) {
        if (product.quantity < quantityDiff) {
          throw new BadRequestException(
            `Insufficient stock. Available: ${product.quantity}, Requested additional: ${quantityDiff}`,
          );
        }
      }

      // Обновляем количество товара
      await prisma.product.update({
        where: { id: existingReturn.productId },
        data: {
          quantity: {
            decrement: quantityDiff, // Если quantityDiff отрицательное - увеличиваем остаток
          },
        },
      });

      // Обновляем запись возврата
      const updatedReturn = await prisma.return.update({
        where: { id },
        data: {
          quantity: updateReturnDto.quantity,
          reason: updateReturnDto.reason,
          returnedAt: updateReturnDto.returnedAt 
            ? new Date(updateReturnDto.returnedAt) 
            : existingReturn.returnedAt,
        },
        include: {
          product: true,
          user: true,
        },
      });

      return updatedReturn;
    });
  }

  async remove(id: number) {
    return this.prisma.$transaction(async (prisma) => {
      const returnRecord = await prisma.return.findUnique({
        where: { id },
      });

      if (!returnRecord) {
        throw new NotFoundException(`Return with ID ${id} not found`);
      }

      // Возвращаем товар на склад (увеличиваем количество)
      await prisma.product.update({
        where: { id: returnRecord.productId },
        data: {
          quantity: {
            increment: returnRecord.quantity,
          },
        },
      });

      // Удаляем запись возврата
      return prisma.return.delete({
        where: { id },
      });
    });
  }
}
