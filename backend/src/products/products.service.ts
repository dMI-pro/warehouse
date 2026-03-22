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
import * as ExcelJS from 'exceljs';
import { Parser } from 'json2csv';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => AuditLogService))
    private auditLogService: AuditLogService,
    private minioService: MinioService,
  ) {}

  /**
   * Очищает массив изображений, оставляя только ключи MinIO (относительные пути)
   * Удаляет дубликаты и пустые значения
   */
  private cleanImages(images: string[]): string[] {
    if (!images || !Array.isArray(images)) return [];
    
    const keys = images
      .filter(Boolean)
      .map((img) => this.minioService.getKeyFromUrl(img) || img);
      
    // Удаляем дубликаты
    return Array.from(new Set(keys));
  }

  private mapProduct(product: any) {
    return product;
  }

  async getLastSku() {
    const lastProduct = await this.prisma.product.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { sku: true },
    });
    return { sku: lastProduct?.sku || null };
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
        throw new NotFoundException(
          `Transaction type with ID ${createProductDto.transactionTypeId} not found`,
        );
      }
    }

    // Очистка путей изображений (сохраняем только ключи, а не полные URL)
    const imageKeys = this.cleanImages(createProductDto.images ?? []);

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
        images: imageKeys,
      },
      include: {
        category: {
          include: {
            parent: true,
          },
        },
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

    const mapped = this.mapProduct(product);
    if (mapped.images && mapped.images.length > 0) {
      const imgs = (product.images || []).filter(Boolean);
      mapped.images = await Promise.all(
        imgs.map((img: string) => this.minioService.getFileUrl(img)),
      );
    }
    return mapped;
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
          category: {
            include: {
              parent: true,
            },
          },
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

    const data = await Promise.all(
      products.map(async (p) => {
        const mapped = this.mapProduct(p);
        if (Array.isArray(mapped.images) && mapped.images.length > 0) {
          const imgs = (p.images || []).filter(Boolean);
          mapped.images = await Promise.all(
            imgs.map((img: string) => this.minioService.getFileUrl(img)),
          );
        }
        return mapped;
      }),
    );

    return {
      data,
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
        category: {
          include: {
            parent: true,
          },
        },
        warehouse: true,
        committee: true,
        transactionType: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const mapped = this.mapProduct(product);
    if (mapped.images && mapped.images.length > 0) {
      const imgs = (product.images || []).filter(Boolean);
      mapped.images = await Promise.all(
        imgs.map((img: string) => this.minioService.getFileUrl(img)),
      );
    }
    return mapped;
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
    if (
      updateProductDto.transactionTypeId !== undefined &&
      updateProductDto.transactionTypeId !== null
    ) {
      const tt = await this.prisma.transactionType.findUnique({
        where: { id: updateProductDto.transactionTypeId },
      });
      if (!tt) {
        throw new NotFoundException(
          `Transaction type with ID ${updateProductDto.transactionTypeId} not found`,
        );
      }
    }

    // Очистка всех путей изображений (и новых, и старых в БД)
    if (updateProductDto.images) {
      updateProductDto.images = this.cleanImages(updateProductDto.images);
    } else if (oldProduct.images) {
      // Даже если images не переданы, очищаем старые, если они грязные
      const cleaned = this.cleanImages(oldProduct.images);
      if (JSON.stringify(cleaned) !== JSON.stringify(oldProduct.images)) {
        updateProductDto.images = cleaned;
      }
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: updateProductDto,
      include: {
        category: {
          include: {
            parent: true,
          },
        },
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
        const priceChanged =
          newValues.salePrice !== undefined ||
          newValues.purchasePrice !== undefined;
        const qtyChanged = newValues.quantity !== undefined;
        const otherChanges = Object.keys(newValues).some(
          (k) => !['salePrice', 'purchasePrice', 'quantity'].includes(k),
        );

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
          success: true,
        });
      }
    }

    const mapped = this.mapProduct(updatedProduct);
    if (mapped.images && mapped.images.length > 0) {
      const imgs = (updatedProduct.images || []).filter(Boolean);
      mapped.images = await Promise.all(
        imgs.map((img: string) => this.minioService.getFileUrl(img)),
      );
    }
    return mapped;
  }

  async findInStock() {
    const products = await this.prisma.product.findMany({
      where: { quantity: { gt: 0 } },
      include: {
        category: {
          include: {
            parent: true,
          },
        },
        warehouse: true,
        committee: true,
        transactionType: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    const data = await Promise.all(
      products.map(async (p) => {
        const mapped = this.mapProduct(p);
        if (Array.isArray(mapped.images) && mapped.images.length > 0) {
          const imgs = (p.images || []).filter(Boolean);
          mapped.images = await Promise.all(
            imgs.map((img: string) => this.minioService.getFileUrl(img)),
          );
        }
        return mapped;
      }),
    );
    return data;
  }

  async getHistory(productId: number, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    // Получаем все логи, связанные с продуктом
    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: {
          OR: [
            // Логи для самого продукта
            {
              AND: [{ entityType: 'Product' }, { entityId: productId }],
            },
            // Логи для продаж этого продукта
            {
              AND: [
                { entityType: 'Sale' },
                {
                  OR: [
                    // Проверяем productId в newValues
                    {
                      newValues: {
                        path: ['productId'],
                        equals: productId,
                      },
                    },
                    // Проверяем productId в oldValues
                    {
                      oldValues: {
                        path: ['productId'],
                        equals: productId,
                      },
                    },
                  ],
                },
              ],
            },
            // Логи для возвратов этого продукта
            {
              AND: [
                { entityType: 'Return' },
                {
                  OR: [
                    // Проверяем productId в newValues
                    {
                      newValues: {
                        path: ['productId'],
                        equals: productId,
                      },
                    },
                    // Проверяем productId в oldValues
                    {
                      oldValues: {
                        path: ['productId'],
                        equals: productId,
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.auditLog.count({
        where: {
          OR: [
            {
              AND: [{ entityType: 'Product' }, { entityId: productId }],
            },
            {
              AND: [
                { entityType: 'Sale' },
                {
                  OR: [
                    {
                      newValues: {
                        path: ['productId'],
                        equals: productId,
                      },
                    },
                    {
                      oldValues: {
                        path: ['productId'],
                        equals: productId,
                      },
                    },
                  ],
                },
              ],
            },
            {
              AND: [
                { entityType: 'Return' },
                {
                  OR: [
                    {
                      newValues: {
                        path: ['productId'],
                        equals: productId,
                      },
                    },
                    {
                      oldValues: {
                        path: ['productId'],
                        equals: productId,
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      }),
    ]);

    // Преобразуем данные для ответа
    const data = logs.map((log) => ({
      id: log.id,
      userId: log.userId,
      user: log.user
        ? {
            id: log.user.id,
            username: log.user.username,
            fullName: log.user.fullName,
            role: log.user.role,
          }
        : undefined,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      oldValues: log.oldValues,
      newValues: log.newValues,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      success: log.success,
      createdAt: log.createdAt,
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async exportProducts(format: 'xlsx' | 'csv') {
    const products = await this.prisma.product.findMany({
      include: {
        category: {
          include: {
            parent: true,
          },
        },
        warehouse: true,
        committee: true,
        transactionType: true,
      },
      orderBy: { name: 'asc' },
    });

    const data = await Promise.all(products.map(async (p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      description: p.description || '',
      categoryName: p.category ? this.getCategoryPath(p.category) : 'Без категории',
      purchasePrice: Number(p.purchasePrice),
      salePrice: Number(p.salePrice),
      quantity: p.quantity,
      minStockLevel: p.minStockLevel || 0,
      warehouseName: p.warehouse?.name || 'Не указан',
      committeeName: p.committee?.name || 'Не указан',
      transactionTypeName: p.transactionType?.name || 'Не указан',
      arrivalDate: p.arrivalDate || null,
      images: p.images && p.images.length > 0 
        ? (await Promise.all(p.images.map(img => this.minioService.getFileUrl(img)))).join('; ')
        : '',
    })));

    if (format === 'csv') {
      const fields = [
        { label: 'ID', value: 'id' },
        { label: 'Название', value: 'name' },
        { label: 'Артикул', value: 'sku' },
        { label: 'Описание', value: 'description' },
        { label: 'Категория', value: 'categoryName' },
        { label: 'Цена закупки', value: 'purchasePrice' },
        { label: 'Цена продажи', value: 'salePrice' },
        { label: 'Количество', value: 'quantity' },
        { label: 'Мин. запас', value: 'minStockLevel' },
        { label: 'Склад', value: 'warehouseName' },
        { label: 'Комитет', value: 'committeeName' },
        { label: 'Тип транзакции', value: 'transactionTypeName' },
        { label: 'Дата поступления', value: 'arrivalDate' },
        { label: 'Изображения', value: 'images' },
      ];
      const json2csvParser = new Parser({ fields, withBOM: true });
      const csv = json2csvParser.parse(data);
      return Buffer.from(csv, 'utf-8');
    } else {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Products');

      worksheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Название', key: 'name', width: 30 },
        { header: 'Артикул', key: 'sku', width: 15 },
        { header: 'Описание', key: 'description', width: 40 },
        { header: 'Категория', key: 'categoryName', width: 25 },
        { header: 'Цена закупки', key: 'purchasePrice', width: 15 },
        { header: 'Цена продажи', key: 'salePrice', width: 15 },
        { header: 'Количество', key: 'quantity', width: 12 },
        { header: 'Мин. запас', key: 'minStockLevel', width: 12 },
        { header: 'Склад', key: 'warehouseName', width: 20 },
        { header: 'Комитет', key: 'committeeName', width: 20 },
        { header: 'Тип транзакции', key: 'transactionTypeName', width: 20 },
        { header: 'Дата поступления', key: 'arrivalDate', width: 20 },
        { header: 'Изображения', key: 'images', width: 50 },
      ];

      // Стилизация заголовков
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

      worksheet.addRows(data);

      // Форматирование колонок и создание гиперссылок для изображений
      data.forEach((row, index) => {
        const rowIndex = index + 2; // +1 за заголовок, +1 за 1-based index
        
        // Колонка изображений (14)
        if (row.images) {
          const imageCell = worksheet.getCell(rowIndex, 14);
          const firstUrl = row.images.split('; ')[0];
          imageCell.value = {
            text: row.images,
            hyperlink: firstUrl,
            tooltip: 'Кликните, чтобы открыть фото'
          };
          imageCell.font = { color: { argb: 'FF0000FF' }, underline: true };
        }
      });

      // Установка форматов для числовых колонок и дат
      worksheet.getColumn(6).numFmt = '#,##0.00'; // purchasePrice
      worksheet.getColumn(7).numFmt = '#,##0.00'; // salePrice
      worksheet.getColumn(13).numFmt = 'yyyy-mm-dd hh:mm'; // arrivalDate

      // Добавление итоговой строки
      const totalRowIndex = data.length + 2;
      const totalRow = worksheet.getRow(totalRowIndex);
      totalRow.font = { bold: true };
      
      // Название для итоговой строки в первой колонке
      worksheet.getCell(totalRowIndex, 1).value = 'Итого:';

      // Формулы для суммирования числовых колонок
      const numericColumns = [
        { col: 6, key: 'F' }, // purchasePrice
        { col: 7, key: 'G' }, // salePrice
        { col: 8, key: 'H' }, // quantity
        { col: 9, key: 'I' }, // minStockLevel
      ];

      numericColumns.forEach(({ col, key }) => {
        const cell = worksheet.getCell(totalRowIndex, col);
        cell.value = {
          formula: `SUM(${key}2:${key}${totalRowIndex - 1})`,
          date1904: false
        };
        // Форматирование для цен (колонки 6 и 7)
        if (col === 6 || col === 7) {
          cell.numFmt = '#,##0.00';
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer);
    }
  }

  private getCategoryPath(category: any): string {
    const path = [category.name];
    let current = category;
    while (current.parent) {
      path.unshift(current.parent.name);
      current = current.parent;
    }
    return path.join(' > ');
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

  async uploadImage(id: number, file: Express.Multer.File, userId?: number) {
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

    // Добавляем новый файл и очищаем весь массив
    const currentImages = product.images || [];
    const updatedImages = this.cleanImages([...currentImages, fileName]);

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

    if (this.auditLogService) {
      await this.auditLogService.create({
        userId,
        action: 'product.image_add',
        entityType: 'Product',
        entityId: id,
        newValues: {
          image: await this.minioService.getFileUrl(fileName),
        },
        success: true,
      });
    }

    const mapped = this.mapProduct(updatedProduct);
    if (mapped.images && mapped.images.length > 0) {
      const imgs = (updatedProduct.images || []).filter(Boolean);
      mapped.images = await Promise.all(
        imgs.map((img: string) => this.minioService.getFileUrl(img)),
      );
    }
    return mapped;
  }

  async deleteImage(id: number, imageUrl: string, userId?: number) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Поиск ключа по URL или использование самого URL как ключа
    const keyFromUrl = this.minioService.getKeyFromUrl(imageUrl);
    const key = keyFromUrl
      ? product.images.find((img) => img === keyFromUrl)
      : undefined;

    const imageToDelete = key || imageUrl;

    try {
      await this.minioService.deleteFile(imageToDelete);
    } catch (e) {
      console.warn(`File ${imageToDelete} not found in MinIO`);
    }

    // Удаляем файл и очищаем оставшиеся пути
    const updatedImages = this.cleanImages(
      product.images.filter((img) => img !== imageToDelete),
    );

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

    if (this.auditLogService) {
      await this.auditLogService.create({
        userId,
        action: 'product.image_delete',
        entityType: 'Product',
        entityId: id,
        oldValues: {
          image: await this.minioService.getFileUrl(imageToDelete),
        },
        success: true,
      });
    }

    const mapped = this.mapProduct(updatedProduct);
    if (mapped.images && mapped.images.length > 0) {
      const imgs = (updatedProduct.images || []).filter(Boolean);
      mapped.images = await Promise.all(
        imgs.map((img: string) => this.minioService.getFileUrl(img)),
      );
    }
    return mapped;
  }

  async reorderImages(id: number, imageUrls: string[], userId?: number) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException(`Product ${id} not found`);

    // Очищаем присланные URL и сохраняем только ключи
    const newKeys = this.cleanImages(imageUrls);

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

    if (this.auditLogService) {
      await this.auditLogService.create({
        userId,
        action: 'product.image_reorder',
        entityType: 'Product',
        entityId: id,
        oldValues: {
          order: await Promise.all(
            product.images.map((k) => this.minioService.getFileUrl(k)),
          ),
        },
        newValues: {
          order: await Promise.all(
            newKeys.map((k) => this.minioService.getFileUrl(k)),
          ),
        },
        success: true,
      });
    }

    const mapped = this.mapProduct(updatedProduct);
    if (mapped.images && mapped.images.length > 0) {
      mapped.images = await Promise.all(
        updatedProduct.images.map((img: string) =>
          this.minioService.getFileUrl(img),
        ),
      );
    }
    return mapped;
  }
}
