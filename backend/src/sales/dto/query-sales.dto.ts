import { IsOptional, IsInt, Min, Max, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class QuerySalesDto {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  productId?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  soldBy?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  committeeId?: number;

  @IsString()
  @IsOptional()
  search?: string;

  /** loss | low_commission | problem — проблемные продажи */
  @IsString()
  @IsIn(['loss', 'low_commission', 'problem'])
  @IsOptional()
  profitAlert?: 'loss' | 'low_commission' | 'problem';

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @IsInt()
  @Min(1)
  @Max(10000) // Максимальный лимит для предотвращения DoS был 100
  @Type(() => Number)
  @IsOptional()
  limit?: number = 10;
}
