import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { UserStatusesService } from './user-statuses.service';
import { CreateUserStatusDto } from './dto/create-user-status.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { User } from '@prisma/client';

@Controller('user-statuses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserStatusesController {
  constructor(private readonly userStatusesService: UserStatusesService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(
    @Body() createUserStatusDto: CreateUserStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.userStatusesService.create(createUserStatusDto, user.id);
  }

  @Get()
  findAll() {
    return this.userStatusesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userStatusesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserStatusDto: UpdateUserStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.userStatusesService.update(id, updateUserStatusDto, user.id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.userStatusesService.remove(id, user.id);
  }
}
