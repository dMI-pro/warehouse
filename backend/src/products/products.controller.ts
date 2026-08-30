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
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { extname } from 'path';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('export')
  @Roles(Role.MANAGER, Role.ADMIN)
  async export(
    @Query('format') format: 'xlsx' | 'csv' = 'xlsx',
    @Res() res: Response,
  ) {
    const buffer = await this.productsService.exportProducts(format);
    const date = new Date().toISOString().split('T')[0];
    const filename = `products_all_${date}.${format}`;

    if (format === 'csv') {
      res.set({
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      });
    } else {
      res.set({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      });
    }

    res.send(buffer);
  }

  @Get('last-sku')
  @Roles(Role.MANAGER, Role.ADMIN)
  async getLastSku() {
    return this.productsService.getLastSku();
  }

  @Post()
  @Roles(Role.MANAGER, Role.ADMIN)
  async create(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser() user: User,
  ) {
    return this.productsService.create(createProductDto, user.id, user);
  }

  @Get()
  async findAll(
    @Query() query: QueryProductsDto,
    @CurrentUser() user: User,
  ) {
    return this.productsService.findAll(query, user);
  }

  @Get('in-stock')
  async getInStock(@CurrentUser() user: User) {
    return this.productsService.findInStock(user);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.productsService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(Role.MANAGER, Role.ADMIN)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser() user?: User,
  ) {
    return this.productsService.update(id, updateProductDto, user?.id, user);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.productsService.remove(id, user.id);
  }

  @Get(':id/history')
  @Roles(Role.MANAGER, Role.ADMIN)
  async getHistory(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @CurrentUser() user?: User,
  ) {
    console.log(`[DEBUG] Getting history for product ${id}, user: ${user?.id}`);
    const result = await this.productsService.getHistory(
      id,
      page ?? 1,
      limit ?? 50,
    );
    console.log(
      `[DEBUG] Found ${result.meta.total} history records for product ${id}`,
    );
    return result;
  }

  @Post(':id/images')
  @Roles(Role.MANAGER, Role.ADMIN)
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user?: User,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Проверка расширения
    const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = extname(file.originalname).toLowerCase();

    if (!allowedExts.includes(ext)) {
      throw new BadRequestException('Invalid file extension');
    }

    return this.productsService.uploadImage(id, file, user?.id, user);
  }

  @Delete(':id/images')
  @Roles(Role.MANAGER, Role.ADMIN)
  async deleteImage(
    @Param('id', ParseIntPipe) id: number,
    @Body('imageUrl') imageUrl: string,
    @CurrentUser() user?: User,
  ) {
    if (!imageUrl) {
      throw new BadRequestException('Image URL is required');
    }
    return this.productsService.deleteImage(id, imageUrl, user?.id, user);
  }

  @Patch(':id/images/reorder')
  @Roles(Role.MANAGER, Role.ADMIN)
  async reorderImages(
    @Param('id', ParseIntPipe) id: number,
    @Body('images') images: string[],
    @CurrentUser() user?: User,
  ) {
    if (!images || !Array.isArray(images)) {
      throw new BadRequestException('Images array is required');
    }
    return this.productsService.reorderImages(id, images, user?.id, user);
  }
}
