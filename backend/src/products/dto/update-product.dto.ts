import { IsString, IsOptional, IsNumber, IsArray, Min, IsInt, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  sku?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  purchasePrice?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  salePrice?: number;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  quantity?: number;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  minStockLevel?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  categoryId?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  warehouseId?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  committeeId?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  transactionTypeId?: number;

  @IsOptional()
  @Type(() => Date)
  arrivalDate?: Date;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];
}

