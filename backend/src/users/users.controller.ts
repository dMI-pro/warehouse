import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.ADMIN)
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() currentUser: any,
    @Req() req: Request,
  ) {
    const ipAddress =
      req.ip ||
      (req.headers['x-forwarded-for'] as string) ||
      req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.usersService.create(
      createUserDto,
      currentUser.id,
      ipAddress,
      userAgent,
    );
  }

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER) // Allow managers to see users too? Usually admins. Keeping Admin for now as per original code.
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: any,
    @Req() req: Request,
  ) {
    const ipAddress =
      req.ip ||
      (req.headers['x-forwarded-for'] as string) ||
      req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.usersService.update(
      id,
      updateUserDto,
      currentUser,
      ipAddress,
      userAgent,
    );
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: any,
    @Req() req: Request,
  ) {
    const ipAddress =
      req.ip ||
      (req.headers['x-forwarded-for'] as string) ||
      req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.usersService.remove(id, currentUser, ipAddress, userAgent);
  }
}
