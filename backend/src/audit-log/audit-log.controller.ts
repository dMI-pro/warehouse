import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsInt,
  IsString,
  IsDateString,
  Min,
} from 'class-validator';

class QueryAuditLogDto {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  userId?: number;

  @IsString()
  @IsOptional()
  action?: string;

  @IsString()
  @IsOptional()
  entityType?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  entityId?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  relatedUserId?: number;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;
}

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  async findAll(@Query() query: QueryAuditLogDto) {
    const params: any = {
      userId: query.userId,
      action: query.action,
      entityType: query.entityType,
      entityId: query.entityId,
      relatedUserId: query.relatedUserId,
      page: query.page,
      limit: query.limit,
    };

    if (query.startDate) {
      params.startDate = new Date(query.startDate);
    }

    if (query.endDate) {
      const endDate = new Date(query.endDate);
      // Если передана только дата (YYYY-MM-DD), устанавливаем конец дня
      if (query.endDate.length === 10) {
        endDate.setHours(23, 59, 59, 999);
      }
      params.endDate = endDate;
    }

    return this.auditLogService.findAll(params);
  }
}
