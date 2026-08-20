import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdatePaymentMethodDto {
  @IsOptional()
  @IsString()
  @MaxLength(40)
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsIn(['CASH', 'CARD', 'DIGITAL_WALLET', 'BANK_TRANSFER', 'CREDIT', 'OTHER'])
  type?:
    'CASH' | 'CARD' | 'DIGITAL_WALLET' | 'BANK_TRANSFER' | 'CREDIT' | 'OTHER';

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  sortOrder?: number;
}
