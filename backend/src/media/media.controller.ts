import {
  Controller,
  Get,
  Delete,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { MediaService, type MediaQuery } from './media.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsInt,
  IsString,
  IsBoolean,
  IsIn,
  Min,
  IsArray,
  ArrayNotEmpty,
} from 'class-validator';

class QueryMediaDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  unusedOnly?: boolean;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsIn(['date', 'name', 'size', 'type', 'used'])
  sortBy?: 'date' | 'name' | 'size' | 'type' | 'used';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

class DeleteMediaDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  keys!: string[];
}

@Controller('media')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  @Roles(Role.MANAGER, Role.ADMIN)
  async list(@Query() query: QueryMediaDto) {
    const q: MediaQuery = {
      search: query.search,
      unusedOnly: query.unusedOnly,
      startDate: query.startDate,
      endDate: query.endDate,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      page: query.page,
      limit: query.limit,
    };
    return this.mediaService.list(q);
  }

  @Delete()
  @Roles(Role.MANAGER, Role.ADMIN)
  async remove(@Body() body: DeleteMediaDto) {
    return this.mediaService.delete(body.keys);
  }
}
