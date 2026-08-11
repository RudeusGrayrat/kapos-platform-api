import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePaymentMethodDto {
  @IsString()
  @MaxLength(40)
  code!: string;

  @IsString()
  @MaxLength(100)
  name!: string;

  @IsIn(['CASH', 'CARD', 'DIGITAL_WALLET', 'BANK_TRANSFER', 'CREDIT', 'OTHER'])
  type!: 'CASH' | 'CARD' | 'DIGITAL_WALLET' | 'BANK_TRANSFER' | 'CREDIT' | 'OTHER';

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  sortOrder?: number;
}
