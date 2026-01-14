import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { Prisma } from '@prisma/client';
import { AuditLogService } from '../audit-log/audit-log.service';
import { MinioService } from '../minio/minio.service';
import { compressImage } from '../common/utils/image-compression.util';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => AuditLogService))
    private auditLogService: AuditLogService,
    private minioService: MinioService,
  ) {}

  private mapProduct(product: any) {
    if (!product) return product;
    return {
      ...product,
      images: product.images
        ? product.images.map((img) => this.minioService.getPublicUrl(img))
        : [],
    };
  }

  async create(createProductDto: CreateProductDto, userId: number) {
    // Проверка уникальности SKU
    const existingProduct = await this.prisma.product.findUnique({
      where: { sku: createProductDto.sku },
    });

    if (existingProduct) {
      throw new ConflictException(
        `Product with SKU ${createProductDto.sku} already exists`,
      );
    }

    // Проверка существования категории, если указана
    if (createProductDto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: createProductDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException(
          `Category with ID ${createProductDto.categoryId} not found`,
        );
      }
    }

    // Проверка существования склада, если указан
    if (createProductDto.warehouseId) {
      const warehouse = await this.prisma.warehouse.findUnique({
        where: { id: createProductDto.warehouseId },
      });

      if (!warehouse) {
        throw new NotFoundException(
          `Warehouse with ID ${createProductDto.warehouseId} not found`,
        );
      }
    }

    // Проверка существования коммитета, если указан
    if (createProductDto.committeeId) {
      const committee = await this.prisma.committee.findUnique({
        where: { id: createProductDto.committeeId },
      });

      if (!committee) {
        throw new NotFoundException(
          `Committee with ID ${createProductDto.committeeId} not found`,
        );
      }
    }
    // Проверка существования типа транзакции, если указан
    if (createProductDto.transactionTypeId) {
      const tt = await this.prisma.transactionType.findUnique({
        where: { id: createProductDto.transactionTypeId },
      });
      if (!tt) {
        throw new NotFoundException(`Transaction type with ID ${createProductDto.transactionTypeId} not found`);
      }
    }

    const product = await this.prisma.product.create({
      data: {
        name: createProductDto.name,
        sku: createProductDto.sku,
        description: createProductDto.description,
        purchasePrice: createProductDto.purchasePrice,
        salePrice: createProductDto.salePrice,
        quantity: createProductDto.quantity,
        minStockLevel: createProductDto.minStockLevel ?? 0,
        categoryId: createProductDto.categoryId,
        warehouseId: createProductDto.warehouseId,
        committeeId: createProductDto.committeeId,
        transactionTypeId: createProductDto.transactionTypeId,
        arrivalDate: createProductDto.arrivalDate || new Date(),
        images: createProductDto.images ?? [],
      },
      include: {
        category: true,
        warehouse: true,
        committee: true,
        transactionType: true,
      },
    });

    if (this.auditLogService && userId) {
      await this.auditLogService.create({
        userId,
        action: 'product.create',
        entityType: 'Product',
        entityId: product.id,
        newValues: product,
        success: true,
      });
    }

    return this.mapProduct(product);
  }

  async findAll(query: QueryProductsDto) {
    const {
      search,
      category,
      warehouse,
      committee,
      inStock,
      page = 1,
      limit = 10,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};

    // Поиск по названию или SKU
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Фильтрация по наличию (quantity > 0)
    if (inStock) {
      where.quantity = { gt: 0 };
    }

    // Фильтрация по категории
    if (category) {
      where.categoryId = category;
    }

    // Фильтрация по складу
    if (warehouse) {
      where.warehouseId = warehouse;
    }

    // Фильтрация по коммитету
    if (committee) {
      where.committeeId = committee;
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: true,
          warehouse: true,
          committee: true,
          transactionType: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products.map((p) => this.mapProduct(p)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        warehouse: true,
        committee: true,
        transactionType: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return this.mapProduct(product);
  }

  async update(
    id: number,
    updateProductDto: UpdateProductDto,
    userId?: number,
  ) {
    // Проверка существования товара
    const oldProduct = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        warehouse: true,
        committee: true,
      },
    });

    if (!oldProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Проверка уникальности SKU, если он изменяется
    if (updateProductDto.sku && updateProductDto.sku !== oldProduct.sku) {
      const existingProduct = await this.prisma.product.findUnique({
        where: { sku: updateProductDto.sku },
      });

      if (existingProduct) {
        throw new ConflictException(
          `Product with SKU ${updateProductDto.sku} already exists`,
        );
      }
    }

    // Проверка существования категории, если она изменяется
    if (
      updateProductDto.categoryId !== undefined &&
      updateProductDto.categoryId !== null
    ) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateProductDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException(
          `Category with ID ${updateProductDto.categoryId} not found`,
        );
      }
    }

    // Проверка существования склада, если он изменяется
    if (
      updateProductDto.warehouseId !== undefined &&
      updateProductDto.warehouseId !== null
    ) {
      const warehouse = await this.prisma.warehouse.findUnique({
        where: { id: updateProductDto.warehouseId },
      });

      if (!warehouse) {
        throw new NotFoundException(
          `Warehouse with ID ${updateProductDto.warehouseId} not found`,
        );
      }
    }

    // Проверка существования коммитета, если он изменяется
    if (
      updateProductDto.committeeId !== undefined &&
      updateProductDto.committeeId !== null
    ) {
      const committee = await this.prisma.committee.findUnique({
        where: { id: updateProductDto.committeeId },
      });

      if (!committee) {
        throw new NotFoundException(
          `Committee with ID ${updateProductDto.committeeId} not found`,
        );
      }
    }
    // Проверка существования типа транзакции, если он изменяется
    if (updateProductDto.transactionTypeId !== undefined && updateProductDto.transactionTypeId !== null) {
      const tt = await this.prisma.transactionType.findUnique({
        where: { id: updateProductDto.transactionTypeId },
      });
      if (!tt) {
        throw new NotFoundException(`Transaction type with ID ${updateProductDto.transactionTypeId} not found`);
      }
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: updateProductDto,
      include: {
        category: true,
        warehouse: true,
        committee: true,
        transactionType: true,
      },
    });

    // Логирование изменений
    if (this.auditLogService && userId) {
      const oldValues: any = {};
      const newValues: any = {};

      // Собираем только измененные поля
      Object.keys(updateProductDto).forEach((key) => {
        const typedKey = key as keyof UpdateProductDto;
        if (updateProductDto[typedKey] !== undefined) {
          const oldValue = (oldProduct as any)[key];
          const newValue = updateProductDto[typedKey];
          if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            oldValues[key] = oldValue;
            newValues[key] = newValue;
          }
        }
      });

      if (Object.keys(newValues).length > 0) {
        let action = 'product.update';
        const priceChanged = newValues.salePrice !== undefined || newValues.purchasePrice !== undefined;
        const qtyChanged = newValues.quantity !== undefined;
        const otherChanges = Object.keys(newValues).some(k => !['salePrice', 'purchasePrice', 'quantity'].includes(k));

        if (priceChanged && !qtyChanged && !otherChanges) {
            action = 'product.price_change';
        } else if (qtyChanged && !priceChanged && !otherChanges) {
            action = 'product.quantity_change';
        }

        await this.auditLogService.create({
          userId,
          action,
          entityType: 'Product',
          entityId: id,
          oldValues,
          newValues,
          success: true
        });
      }
    }

    return this.mapProduct(updatedProduct);
  }

  async findInStock() {
    const products = await this.prisma.product.findMany({
      where: { quantity: { gt: 0 } },
      include: {
        category: true,
        warehouse: true,
        committee: true,
        transactionType: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return products.map(p => this.mapProduct(p));
  }

  async remove(id: number, userId: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Проверка наличия связанных продаж
    const salesCount = await this.prisma.sale.count({
      where: { productId: id },
    });

    if (salesCount > 0) {
      throw new ConflictException('Cannot delete product with existing sales');
    }

    await this.prisma.product.delete({
      where: { id },
    });

    if (this.auditLogService && userId) {
      await this.auditLogService.create({
        userId,
        action: 'product.delete',
        entityType: 'Product',
        entityId: id,
        oldValues: product,
        success: true,
      });
    }

    return { message: 'Product deleted successfully' };
  }

  async uploadImage(id: number, file: Express.Multer.File) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Сжатие изображения
    const compressedBuffer = await compressImage(file.buffer);

    // Создание нового файла
    const compressedFile = {
      ...file,
      buffer: compressedBuffer,
      size: compressedBuffer.length,
      originalname: file.originalname.replace(/\.[^/.]+$/, '') + '.webp',
      mimetype: 'image/webp',
    };

    const fileName = await this.minioService.uploadFile(
      compressedFile as Express.Multer.File,
    );

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: {
        images: {
          push: fileName,
        },
      },
      include: {
        category: true,
        warehouse: true,
        committee: true,
        transactionType: true,
      },
    });

    return this.mapProduct(updatedProduct);
  }

  async deleteImage(id: number, imageUrl: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Поиск ключа по URL или использование самого URL как ключа
    const key = product.images.find(
      (img) => this.minioService.getPublicUrl(img) === imageUrl,
    );

    const imageToDelete = key || imageUrl;

    try {
      await this.minioService.deleteFile(imageToDelete);
    } catch (e) {
      console.warn(`File ${imageToDelete} not found in MinIO`);
    }

    const updatedImages = product.images.filter((img) => img !== imageToDelete);

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: {
        images: updatedImages,
      },
      include: {
        category: true,
        warehouse: true,
        committee: true,
        transactionType: true,
      },
    });

    return this.mapProduct(updatedProduct);
  }

  async reorderImages(id: number, imageUrls: string[]) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException(`Product ${id} not found`);

    const currentKeys = product.images;
    const newKeys: string[] = [];

    for (const url of imageUrls) {
      const key = currentKeys.find(
        (k) => this.minioService.getPublicUrl(k) === url,
      );
      // Если это не URL, а уже ключ (на случай, если фронт шлет ключи)
      if (key) {
        newKeys.push(key);
      } else if (currentKeys.includes(url)) {
        newKeys.push(url);
      }
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: { images: newKeys },
      include: {
        category: true,
        warehouse: true,
        committee: true,
        transactionType: true,
      },
    });

    return this.mapProduct(updatedProduct);
  }
}
