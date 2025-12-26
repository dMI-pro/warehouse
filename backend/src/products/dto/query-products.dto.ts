import { IsOptional, IsString, IsInt, Min, Max, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryProductsDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  search?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  category?: number;

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

