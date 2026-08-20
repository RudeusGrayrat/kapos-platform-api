import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateCashMovementDto {
  @IsIn(['INCOME', 'EXPENSE', 'WITHDRAWAL', 'DEPOSIT', 'ADJUSTMENT'])
  type!: 'INCOME' | 'EXPENSE' | 'WITHDRAWAL' | 'DEPOSIT' | 'ADJUSTMENT';

  @IsNumber()
  amount!: number;

  @IsString()
  @MaxLength(160)
  concept!: string;

  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
