import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateTransactionTypeDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;
}

