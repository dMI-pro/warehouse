import { Injectable, NotFoundException, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class WarehousesService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => AuditLogService))
    private auditLogService: AuditLogService,
  ) {}

  async create(createWarehouseDto: CreateWarehouseDto, userId: number) {
    const warehouse = await this.prisma.warehouse.create({
      data: {
        name: createWarehouseDto.name,
        description: createWarehouseDto.description,
        address: createWarehouseDto.address,
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (userId) {
      await this.auditLogService.create({
        userId,
        action: 'warehouse.create',
        entityType: 'Warehouse',
        entityId: warehouse.id,
        newValues: warehouse,
        success: true,
      });
    }

    return warehouse;
  }

  async findAll() {
    return this.prisma.warehouse.findMany({
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
    const warehouse = await this.prisma.warehouse.findUnique({
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

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }

    return warehouse;
  }

  async update(id: number, updateWarehouseDto: UpdateWarehouseDto, userId: number) {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id },
    });

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }

    const updatedWarehouse = await this.prisma.warehouse.update({
      where: { id },
      data: updateWarehouseDto,
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (userId) {
      const oldValues: any = {};
      const newValues: any = {};
      
      Object.keys(updateWarehouseDto).forEach(key => {
        const k = key as keyof UpdateWarehouseDto;
        if ((warehouse as any)[k] !== updateWarehouseDto[k]) {
          oldValues[k] = (warehouse as any)[k];
          newValues[k] = updateWarehouseDto[k];
        }
      });

      if (Object.keys(newValues).length > 0) {
        await this.auditLogService.create({
          userId,
          action: 'warehouse.update',
          entityType: 'Warehouse',
          entityId: id,
          oldValues,
          newValues,
          success: true,
        });
      }
    }

    return updatedWarehouse;
  }

  async remove(id: number, userId: number) {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id },
      include: {
        products: true,
      },
    });

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }

    // Проверка наличия товаров на складе
    if (warehouse.products.length > 0) {
      throw new ConflictException('Cannot delete warehouse with associated products');
    }

    await this.prisma.warehouse.delete({
      where: { id },
    });

    if (userId) {
      await this.auditLogService.create({
        userId,
        action: 'warehouse.delete',
        entityType: 'Warehouse',
        entityId: id,
        oldValues: warehouse,
        success: true,
      });
    }

    return { message: 'Warehouse deleted successfully' };
  }
}

