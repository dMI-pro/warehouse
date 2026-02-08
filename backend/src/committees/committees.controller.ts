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
import { CommitteesService } from './committees.service';
import { CreateCommitteeDto } from './dto/create-committee.dto';
import { UpdateCommitteeDto } from './dto/update-committee.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('committees')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommitteesController {
  constructor(private readonly committeesService: CommitteesService) {}

  @Post()
  @Roles(Role.MANAGER, Role.ADMIN)
  async create(
    @Body() createCommitteeDto: CreateCommitteeDto,
    @CurrentUser() user: any,
  ) {
    return this.committeesService.create(createCommitteeDto, user.id);
  }

  @Get()
  @Public()
  async findAll() {
    return this.committeesService.findAll();
  }

  @Get(':id/stats')
  @Roles(Role.ADMIN)
  async getStatistics(
    @Param('id', ParseIntPipe) id: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.committeesService.getStatistics(id, startDate, endDate);
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.committeesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.MANAGER, Role.ADMIN)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCommitteeDto: UpdateCommitteeDto,
    @CurrentUser() user: any,
  ) {
    return this.committeesService.update(id, updateCommitteeDto, user.id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.committeesService.remove(id, user.id);
  }
}
