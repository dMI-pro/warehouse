import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => AuditLogService))
    private auditLogService: AuditLogService,
  ) {}

  async create(
    createUserDto: CreateUserDto,
    currentUserId?: number,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: createUserDto.email },
          { username: createUserDto.username },
        ],
      },
    });

    if (existingUser) {
      throw new ConflictException(
        'User with this email or username already exists',
      );
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
        // Если статус не передан, ставим ACTIVE по умолчанию
        userStatusId:
          createUserDto.userStatusId || (await this.getDefaultStatusId()),
      },
      include: {
        status: true,
      },
    });

    // Log action
    if (currentUserId) {
      await this.auditLogService.create({
        userId: currentUserId,
        action: 'user.create',
        entityType: 'User',
        entityId: user.id,
        newValues: {
          username: user.username,
          email: user.email,
          role: user.role,
          status: user.status?.code,
        },
        success: true,
        ipAddress,
        userAgent,
      });
    }

    const { password, ...result } = user;
    return result;
  }

  private async getDefaultStatusId() {
    const status = await this.prisma.userStatus.findUnique({
      where: { code: 'ACTIVE' },
    });
    return status?.id;
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true,
        isSuperAdmin: true,
        createdAt: true,
        updatedAt: true,
        status: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true,
        isSuperAdmin: true,
        createdAt: true,
        updatedAt: true,
        status: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
    currentUser: any,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Проверка существования пользователя
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { status: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Ограничение: админы не могут редактировать других админов (кроме superadmin)
    if (
      user.role === 'ADMIN' &&
      currentUser.id !== id &&
      !currentUser.isSuperAdmin
    ) {
      throw new ForbiddenException('Admins cannot edit other admins');
    }

    // Проверка уникальности email и username, если они изменяются
    if (updateUserDto.email || updateUserDto.username) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                updateUserDto.email ? { email: updateUserDto.email } : {},
                updateUserDto.username
                  ? { username: updateUserDto.username }
                  : {},
              ],
            },
          ],
        },
      });

      if (existingUser) {
        throw new ConflictException(
          'User with this email or username already exists',
        );
      }
    }

    const dataToUpdate: any = { ...updateUserDto };
    if (updateUserDto.password) {
      dataToUpdate.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Обновление пользователя
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true,
        isSuperAdmin: true,
        createdAt: true,
        updatedAt: true,
        status: true,
      },
    });

    // Log action
    if (currentUser) {
      const oldValues: any = {};
      const newValues: any = {};

      Object.keys(updateUserDto).forEach((key) => {
        const k = key as keyof UpdateUserDto;
        if (
          JSON.stringify((user as any)[key]) !==
          JSON.stringify(updateUserDto[k])
        ) {
          oldValues[key] = (user as any)[key];
          newValues[key] = updateUserDto[k];
        }
      });

      if (Object.keys(newValues).length > 0) {
        await this.auditLogService.create({
          userId: currentUser.id,
          action: 'user.update',
          entityType: 'User',
          entityId: id,
          oldValues,
          newValues,
          success: true,
          ipAddress,
          userAgent,
        });
      }
    }

    return updatedUser;
  }

  async remove(
    id: number,
    currentUser: any,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);

    if (user.isSuperAdmin)
      throw new ForbiddenException('Cannot delete super admin');
    if (user.id === currentUser.id)
      throw new ForbiddenException('Cannot delete yourself');

    await this.prisma.user.delete({ where: { id } });

    await this.auditLogService.create({
      userId: currentUser.id,
      action: 'user.delete',
      entityType: 'User',
      entityId: id,
      oldValues: { username: user.username, email: user.email },
      success: true,
      ipAddress,
      userAgent,
    });

    return { message: 'User deleted successfully' };
  }
}
