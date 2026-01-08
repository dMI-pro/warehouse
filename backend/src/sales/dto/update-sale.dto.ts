import { IsNotEmpty, IsOptional, IsNumber, Min, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSaleDto {
    @IsInt()
    @IsOptional()
    @Type(() => Number)
    productId?: number;

    @IsInt()
    @Min(1)
    @Type(() => Number)
    @IsOptional()
    quantity?: number;

    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    @Type(() => Number)
    @IsOptional()
    salePrice?: number; // Если не указана, используется цена из товара

    @IsOptional()
    @Type(() => Date)
    soldAt?: Date; // Дата продажи (по умолчанию текущая дата)
}
