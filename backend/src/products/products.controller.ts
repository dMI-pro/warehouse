import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { diskStorage } from 'multer';
import { extname, join, normalize } from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { compressImage, createThumbnail } from '../common/utils/image-compression.util';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles(Role.MANAGER, Role.ADMIN)
  async create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @Public()
  async findAll(@Query() query: QueryProductsDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @Public()
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.MANAGER, Role.ADMIN)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser() user?: User,
  ) {
    return this.productsService.update(id, updateProductDto, user?.id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }

  @Post(':id/images')
  @Roles(Role.MANAGER, Role.ADMIN)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = normalize(join(process.cwd(), 'uploads', 'products'));
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          // Используем UUID для предотвращения предсказуемости и перезаписи
          const uniqueId = uuidv4();
          const ext = extname(file.originalname);
          // Разрешаем только безопасные расширения
          const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
          const normalizedExt = ext.toLowerCase();
          
          if (!allowedExts.includes(normalizedExt)) {
            return cb(new BadRequestException('Invalid file extension'), false);
          }
          
          cb(null, `${uniqueId}${normalizedExt}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        // Проверка MIME type
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
          return cb(new BadRequestException('Only image files are allowed'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async uploadImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Дополнительная проверка расширения файла
    const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const fileExt = extname(file.originalname).toLowerCase();
    if (!allowedExts.includes(fileExt)) {
      throw new BadRequestException('Invalid file extension');
    }

    try {
      // Читаем файл в буфер
      const fileBuffer = fs.readFileSync(file.path);

      // Сжимаем изображение
      const compressedBuffer = await compressImage(fileBuffer, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 85,
        format: 'webp',
        maxFileSize: 500 * 1024, // 500KB
      });

      // Создаем миниатюру
      const thumbnailBuffer = await createThumbnail(fileBuffer, 300);

      // Генерируем уникальные имена файлов
      const uniqueId = uuidv4();
      const compressedFilename = `${uniqueId}.webp`;
      const thumbnailFilename = `${uniqueId}_thumb.webp`;

      // Сохраняем сжатое изображение
      const uploadPath = normalize(join(process.cwd(), 'uploads', 'products'));
      const compressedPath = join(uploadPath, compressedFilename);
      const thumbnailPath = join(uploadPath, thumbnailFilename);

      fs.writeFileSync(compressedPath, compressedBuffer);
      fs.writeFileSync(thumbnailPath, thumbnailBuffer);

      // Удаляем оригинальный файл
      fs.unlinkSync(file.path);

      // Сохраняем URL основного изображения и миниатюры
      const imageUrl = `/uploads/products/${compressedFilename}`;
      const thumbnailUrl = `/uploads/products/${thumbnailFilename}`;

      // Добавляем оба изображения в продукт
      return this.productsService.addImage(id, imageUrl, thumbnailUrl);
    } catch (error) {
      // Удаляем файл в случае ошибки
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw new BadRequestException(
        error.message || 'Ошибка обработки изображения',
      );
    }
  }

  @Delete(':id/images')
  @Roles(Role.MANAGER, Role.ADMIN)
  async removeImage(@Param('id', ParseIntPipe) id: number, @Body('imageUrl') imageUrl: string) {
    if (!imageUrl) {
      throw new BadRequestException('imageUrl is required');
    }
    return this.productsService.removeImage(id, imageUrl);
  }
}

