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
} from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { QuerySalesDto } from './dto/query-sales.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('sales')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @Roles(Role.SELLER, Role.MANAGER, Role.ADMIN)
  async create(@Body() createSaleDto: CreateSaleDto, @CurrentUser() user: any) {
    return this.salesService.create(createSaleDto, user.id);
  }

  @Get()
  @Roles(Role.MANAGER, Role.ADMIN)
  async findAll(@Query() query: QuerySalesDto) {
    return this.salesService.findAll(query);
  }

  @Get('statistics')
  @Roles(Role.MANAGER, Role.ADMIN)
  async getStatistics(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.salesService.getStatistics(startDate, endDate);
  }

  @Get(':id')
  @Roles(Role.MANAGER, Role.ADMIN)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.salesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.MANAGER, Role.ADMIN)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSaleDto: UpdateSaleDto,
    @CurrentUser() user: any,
  ) {
    return this.salesService.update(id, updateSaleDto, user.id);
  }

  @Delete(':id')
  @Roles(Role.MANAGER, Role.ADMIN)
  async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.salesService.remove(id, user.id);
  }
}

