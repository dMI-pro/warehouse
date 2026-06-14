import {
  IsOptional,
  IsString,
  IsInt,
  IsEnum,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ProductSortBy {
  CREATED_AT = 'createdAt',
  ARRIVAL_DATE = 'arrivalDate',
}

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

  @IsEnum(ProductSortBy)
  @IsOptional()
  sortBy?: ProductSortBy = ProductSortBy.CREATED_AT;

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
