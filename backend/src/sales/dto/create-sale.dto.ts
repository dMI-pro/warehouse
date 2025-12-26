import { IsInt, IsNotEmpty, Min, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSaleDto {
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  productId: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  salePrice?: number; // Если не указана, используется цена из товара
}
