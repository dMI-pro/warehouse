import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateTransactionTypeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;
}

