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

  private sanitizeValues(value: any): any {
    if (value === null || value === undefined) {
      return value;
    }
    if (typeof value !== 'object') {
      return value;
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.sanitizeValues(item));
    }
    const result: any = {};
    for (const [key, val] of Object.entries(value)) {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey === 'password' ||
        lowerKey.includes('password') ||
        lowerKey.includes('token') ||
        lowerKey.includes('secret')
      ) {
        continue;
      }
      result[key] = this.sanitizeValues(val);
    }
    return result;
  }

  async create(dto: CreateAuditLogDto) {
    const rawOld = dto.oldValues
      ? JSON.parse(JSON.stringify(dto.oldValues))
      : null;
    const rawNew = dto.newValues
      ? JSON.parse(JSON.stringify(dto.newValues))
      : null;
    const oldValues = rawOld ? this.sanitizeValues(rawOld) : null;
    const newValues = rawNew ? this.sanitizeValues(rawNew) : null;

    return this.prisma.auditLog.create({
      data: {
        userId: dto.userId,
        action: dto.action,
        entityType: dto.entityType,
        entityId: dto.entityId,
        oldValues,
        newValues,
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
        success: dto.success ?? true,
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
    entityId?: number | string;
    relatedUserId?: number;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const {
      userId,
      action,
      entityType,
      entityId,
      relatedUserId,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = params || {};
    const skip = (page - 1) * limit;

    const where: any = {};

    if (relatedUserId) {
      where.OR = [
        { userId: relatedUserId },
        { entityType: 'User', entityId: relatedUserId },
      ];
    } else {
      if (userId) {
        where.userId = userId;
      }

      if (action) {
        where.action = action;
      }

      if (entityType) {
        where.entityType = entityType;
      }

      if (entityId !== undefined && entityId !== null) {
        const n =
          typeof entityId === 'string' ? parseInt(entityId, 10) : entityId;
        if (!Number.isNaN(n)) {
          where.entityId = n;
        }
      }
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
