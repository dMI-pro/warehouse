import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  IsDecimal,
  Min,
  IsInt,
  MaxLength,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  sku: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  purchasePrice: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  salePrice: number;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  quantity: number;

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
