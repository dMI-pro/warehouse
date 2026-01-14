import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateAuditLogDto {
  userId?: number;
  action: string;
  entityType?: string;
  entityId?: number;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
}

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAuditLogDto) {
    return this.prisma.auditLog.create({
      data: {
        userId: dto.userId,
        action: dto.action,
        entityType: dto.entityType,
        entityId: dto.entityId,
        oldValues: dto.oldValues ? JSON.parse(JSON.stringify(dto.oldValues)) : null,
        newValues: dto.newValues ? JSON.parse(JSON.stringify(dto.newValues)) : null,
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
        success: dto.success,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            role: true,
          },
        },
      },
    });
  }

  async findAll(params?: {
    userId?: number;
    action?: string;
    entityType?: string;
    entityId?: number;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const { userId, action, entityType, entityId, startDate, endDate, page = 1, limit = 20 } = params || {};
    const skip = (page - 1) * limit;

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = action;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (entityId) {
      where.entityId = entityId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

