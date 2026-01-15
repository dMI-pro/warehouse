import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
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
  @IsOptional()
  @Type(() => Number)
  warehouse?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  committee?: number;

  @IsOptional()
  @Type(() => Boolean)
  inStock?: boolean;

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
