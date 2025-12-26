import { IsOptional, IsInt, Min, Max, IsDateString } from 'class-validator';
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
  @Max(100) // Максимальный лимит для предотвращения DoS
  @Type(() => Number)
  @IsOptional()
  limit?: number = 10;
}
