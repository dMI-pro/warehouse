import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { TransactionTypesService } from './transaction-types.service';
import { CreateTransactionTypeDto } from './dto/create-transaction-type.dto';
import { UpdateTransactionTypeDto } from './dto/update-transaction-type.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { Public } from '../common/decorators/public.decorator';

@Controller('transaction-types')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransactionTypesController {
  constructor(
    private readonly transactionTypesService: TransactionTypesService,
  ) {}

  @Post()
  @Roles(Role.MANAGER, Role.ADMIN)
  async create(@Body() createDto: CreateTransactionTypeDto) {
    return this.transactionTypesService.create(createDto);
  }

  @Get()
  @Public()
  async findAll() {
    return this.transactionTypesService.findAll();
  }

  @Get(':id')
  @Public()
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.transactionTypesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.MANAGER, Role.ADMIN)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateTransactionTypeDto,
  ) {
    return this.transactionTypesService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.transactionTypesService.remove(id);
  }
}
