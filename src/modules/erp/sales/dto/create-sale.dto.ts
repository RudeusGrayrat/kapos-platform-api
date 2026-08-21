import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateSaleItemDto {
  @IsString()
  productId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.001)
  quantity!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}

export class CreateSalePaymentDto {
  @IsOptional()
  @IsString()
  paymentIntentId?: string;

  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsIn(['CONFIRMED', 'PENDING'])
  status?: 'CONFIRMED' | 'PENDING';

  @IsOptional()
  @IsString()
  @MaxLength(80)
  provider?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  providerRef?: string;
}

export class BillingRecipientDto {
  @IsOptional()
  @IsIn(['DNI', 'RUC', 'CE', 'PASSPORT'])
  documentType?: 'DNI' | 'RUC' | 'CE' | 'PASSPORT';

  @IsOptional()
  @IsString()
  @MaxLength(20)
  documentNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  email?: string;
}

export class CreateSaleDto {
  @IsString()
  branchId!: string;

  @IsString()
  cashSessionId!: string;

  @IsOptional()
  @IsString()
  customerProfileId?: string;

  @IsOptional()
  @IsIn(['WEB_POS', 'MOBILE_POS', 'MANUAL'])
  channel?: 'WEB_POS' | 'MOBILE_POS' | 'MANUAL';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discountTotal?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  loyaltyPointsToRedeem?: number;

  @IsOptional()
  @IsIn(['BOLETA', 'FACTURA', 'TICKET'])
  billingDocumentType?: 'BOLETA' | 'FACTURA' | 'TICKET';

  @IsOptional()
  @ValidateNested()
  @Type(() => BillingRecipientDto)
  billingRecipient?: BillingRecipientDto;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items!: CreateSaleItemDto[];

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSalePaymentDto)
  payments!: CreateSalePaymentDto[];
}
