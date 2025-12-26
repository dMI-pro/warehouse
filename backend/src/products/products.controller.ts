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
import { diskStorage } from 'multer';
import { extname, join, normalize } from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

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
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
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

    // В реальном приложении здесь можно сохранить файл в облачное хранилище
    // и вернуть URL. Для примера используем локальный путь
    const imageUrl = `/uploads/products/${file.filename}`;
    return this.productsService.addImage(id, imageUrl);
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

