import { Injectable, NotFoundException, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserStatusDto } from './dto/create-user-status.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class UserStatusesService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => AuditLogService))
    private auditLogService: AuditLogService,
  ) {}

  async create(createUserStatusDto: CreateUserStatusDto, userId: number) {
    const existing = await this.prisma.userStatus.findUnique({
      where: { code: createUserStatusDto.code },
    });

    if (existing) {
      throw new ConflictException(`Status with code ${createUserStatusDto.code} already exists`);
    }

    const status = await this.prisma.userStatus.create({
      data: createUserStatusDto,
    });

    if (this.auditLogService && userId) {
      await this.auditLogService.create({
        userId,
        action: 'user_status.create',
        entityType: 'UserStatus',
        entityId: status.id,
        newValues: status,
        success: true,
      });
    }

    return status;
  }

  findAll() {
    return this.prisma.userStatus.findMany({
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    const status = await this.prisma.userStatus.findUnique({
      where: { id },
    });

    if (!status) {
      throw new NotFoundException(`Status with ID ${id} not found`);
    }

    return status;
  }

  async update(id: number, updateUserStatusDto: UpdateUserStatusDto, userId: number) {
    const status = await this.prisma.userStatus.findUnique({
      where: { id },
    });

    if (!status) {
      throw new NotFoundException(`Status with ID ${id} not found`);
    }

    if (updateUserStatusDto.code && updateUserStatusDto.code !== status.code) {
      const existing = await this.prisma.userStatus.findUnique({
        where: { code: updateUserStatusDto.code },
      });
      if (existing) {
        throw new ConflictException(`Status with code ${updateUserStatusDto.code} already exists`);
      }
    }

    const updatedStatus = await this.prisma.userStatus.update({
      where: { id },
      data: updateUserStatusDto,
    });

    if (this.auditLogService && userId) {
      const oldValues: any = {};
      const newValues: any = {};
      Object.keys(updateUserStatusDto).forEach((key) => {
        const k = key as keyof UpdateUserStatusDto;
        if (JSON.stringify((status as any)[k]) !== JSON.stringify(updateUserStatusDto[k])) {
          oldValues[k] = (status as any)[k];
          newValues[k] = updateUserStatusDto[k];
        }
      });

      if (Object.keys(newValues).length > 0) {
        await this.auditLogService.create({
          userId,
          action: 'user_status.update',
          entityType: 'UserStatus',
          entityId: id,
          oldValues,
          newValues,
          success: true,
        });
      }
    }

    return updatedStatus;
  }

  async remove(id: number, userId: number) {
    const status = await this.prisma.userStatus.findUnique({
      where: { id },
    });

    if (!status) {
      throw new NotFoundException(`Status with ID ${id} not found`);
    }

    // Check if used
    const usersCount = await this.prisma.user.count({
      where: { userStatusId: id },
    });

    if (usersCount > 0) {
      throw new ConflictException('Cannot delete status that is assigned to users');
    }

    await this.prisma.userStatus.delete({
      where: { id },
    });

    if (this.auditLogService && userId) {
      await this.auditLogService.create({
        userId,
        action: 'user_status.delete',
        entityType: 'UserStatus',
        entityId: id,
        oldValues: status,
        success: true,
      });
    }

    return { message: 'Status deleted successfully' };
  }
}
