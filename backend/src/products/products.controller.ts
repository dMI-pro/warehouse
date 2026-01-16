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
import { extname } from 'path';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles(Role.MANAGER, Role.ADMIN)
  async create(@Body() createProductDto: CreateProductDto, userId: number) {
    return this.productsService.create(createProductDto, userId);
  }

  @Get()
  @Public()
  async findAll(@Query() query: QueryProductsDto) {
    return this.productsService.findAll(query);
  }

  @Get('in-stock')
  async getInStock() {
    return this.productsService.findInStock();
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

    return this.productsService.uploadImage(id, file, user?.id);
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
    return this.productsService.deleteImage(id, imageUrl, user?.id);
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
    return this.productsService.reorderImages(id, images, user?.id);
  }
}
