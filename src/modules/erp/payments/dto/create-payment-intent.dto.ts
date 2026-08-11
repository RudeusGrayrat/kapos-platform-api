import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePaymentIntentDto {
  @IsNumber()
  @Type(() => Number)
  @Min(0.01)
  amount!: number;

  @IsString()
  @MaxLength(40)
  provider!: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  cashSessionId?: string;

  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  providerRef?: string;

  @IsOptional()
  rawRequest?: unknown;
}
