import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionTypeDto } from './dto/create-transaction-type.dto';
import { UpdateTransactionTypeDto } from './dto/update-transaction-type.dto';

@Injectable()
export class TransactionTypesService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateTransactionTypeDto) {
    const existing = await this.prisma.transactionType.findFirst({
      where: { name: createDto.name },
    });
    if (existing) {
      throw new ConflictException(
        `Transaction type "${createDto.name}" already exists`,
      );
    }
    return this.prisma.transactionType.create({
      data: {
        name: createDto.name,
      },
    });
  }

  async findAll() {
    return this.prisma.transactionType.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const type = await this.prisma.transactionType.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
    if (!type) {
      throw new NotFoundException(`Transaction type with ID ${id} not found`);
    }
    return type;
  }

  async update(id: number, updateDto: UpdateTransactionTypeDto) {
    const type = await this.prisma.transactionType.findUnique({
      where: { id },
    });
    if (!type) {
      throw new NotFoundException(`Transaction type with ID ${id} not found`);
    }
    if (updateDto.name && updateDto.name !== type.name) {
      const existing = await this.prisma.transactionType.findFirst({
        where: { name: updateDto.name },
      });
      if (existing) {
        throw new ConflictException(
          `Transaction type "${updateDto.name}" already exists`,
        );
      }
    }
    return this.prisma.transactionType.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: number) {
    const type = await this.prisma.transactionType.findUnique({
      where: { id },
      include: { products: true },
    });
    if (!type) {
      throw new NotFoundException(`Transaction type with ID ${id} not found`);
    }
    if (type.products.length > 0) {
      throw new ConflictException(
        'Cannot delete transaction type with associated products',
      );
    }
    return this.prisma.transactionType.delete({
      where: { id },
    });
  }
}
