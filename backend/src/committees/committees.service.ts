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

