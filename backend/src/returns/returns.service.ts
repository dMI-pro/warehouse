import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReturnDto } from './dto/create-return.dto';
import { UpdateReturnDto } from './dto/update-return.dto';
import { QueryReturnsDto } from './dto/query-returns.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReturnsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => AuditLogService))
    private auditLogService: AuditLogService,
  ) {}

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
      throw new BadRequestException(
        `Insufficient stock. Available: ${product.quantity}, Requested return: ${quantity}`,
      );
    }

    const result = await this.prisma.$transaction(async (prisma) => {
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

    if (userId) {
      await this.auditLogService.create({
        userId,
        action: 'return.create',
        entityType: 'Return',
        entityId: result.id,
        newValues: {
          productId: result.productId,
          quantity: result.quantity,
          reason: result.reason,
        },
        success: true,
      });
    }

    return result;
  }

  async findAll(query: QueryReturnsDto) {
    const { startDate, endDate, page = 1, limit } = query;
    const where: Prisma.ReturnWhereInput = {};

    if (startDate || endDate) {
      where.returnedAt = {};
      if (startDate) {
        where.returnedAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.returnedAt.lte = new Date(endDate);
      }
    }

    const findManyArgs: Prisma.ReturnFindManyArgs = {
      where,
      include: {
        product: true,
        user: true,
      },
      orderBy: {
        returnedAt: 'desc',
      },
    };

    if (limit) {
      findManyArgs.skip = (page - 1) * limit;
      findManyArgs.take = limit;
    }

    return this.prisma.return.findMany(findManyArgs);
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

  async update(id: number, updateReturnDto: UpdateReturnDto, userId: number) {
    const result = await this.prisma.$transaction(async (prisma) => {
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
        throw new NotFoundException(
          `Product with ID ${existingReturn.productId} not found`,
        );
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

      return { existingReturn, updatedReturn };
    });

    if (userId) {
      const { existingReturn, updatedReturn } = result;
      const oldValues: any = {};
      const newValues: any = {};

      Object.keys(updateReturnDto).forEach((key) => {
        const k = key as keyof UpdateReturnDto;
        const val1 = (existingReturn as any)[k];
        const val2 = (updatedReturn as any)[k];
        if (JSON.stringify(val1) !== JSON.stringify(val2)) {
          oldValues[k] = val1;
          newValues[k] = val2;
        }
      });

      if (Object.keys(newValues).length > 0) {
        await this.auditLogService.create({
          userId,
          action: 'return.update',
          entityType: 'Return',
          entityId: id,
          oldValues,
          newValues,
          success: true,
        });
      }
    }

    return result.updatedReturn;
  }

  async remove(id: number, userId: number) {
    const result = await this.prisma.$transaction(async (prisma) => {
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
      await prisma.return.delete({
        where: { id },
      });

      return returnRecord;
    });

    if (userId) {
      await this.auditLogService.create({
        userId,
        action: 'return.delete',
        entityType: 'Return',
        entityId: id,
        oldValues: result,
        success: true,
      });
    }

    return { message: 'Return deleted successfully' };
  }
}
