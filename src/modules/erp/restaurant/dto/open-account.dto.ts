import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateOpenAccountDto {
  @IsString()
  branchId!: string;

  @IsIn(['LOCAL', 'DELIVERY', 'TAKEAWAY'])
  serviceType!: 'LOCAL' | 'DELIVERY' | 'TAKEAWAY';

  @IsOptional()
  @IsString()
  diningTableId?: string;

  @IsOptional()
  @IsString()
  customerProfileId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  guestCount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  customerName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  customerPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  deliveryAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  deliveryReference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class UpdateOpenAccountDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  expectedVersion!: number;

  @IsOptional()
  @IsString()
  customerProfileId?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  guestCount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  customerName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  customerPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  deliveryAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  deliveryReference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class AddOpenAccountItemDto {
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

export class AddOpenAccountItemsDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  expectedVersion!: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AddOpenAccountItemDto)
  items!: AddOpenAccountItemDto[];
}

export class SendKitchenTicketDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  expectedVersion!: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  itemIds?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}

export class UpdateKitchenTicketDto {
  @IsIn(['IN_PREPARATION', 'READY', 'DELIVERED', 'CANCELLED'])
  status!: 'IN_PREPARATION' | 'READY' | 'DELIVERED' | 'CANCELLED';
}

export class MoveOpenAccountTableDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  expectedVersion!: number;

  @IsString()
  diningTableId!: string;
}

export class JoinOpenAccountTableDto extends MoveOpenAccountTableDto {}

export class ReleaseOpenAccountTableDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  expectedVersion!: number;
}

export class GeneratePrebillDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  expectedVersion!: number;
}

export class CancelOpenAccountItemDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  expectedVersion!: number;

  @IsString()
  @MaxLength(300)
  reason!: string;
}

export class OpenAccountPaymentAllocationDto {
  @IsString()
  itemId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.001)
  quantity!: number;
}

export class RecordOpenAccountPaymentDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  expectedVersion!: number;

  @IsString()
  @MaxLength(120)
  idempotencyKey!: string;

  @IsString()
  cashSessionId!: string;

  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @IsOptional()
  @IsString()
  paymentIntentId?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OpenAccountPaymentAllocationDto)
  allocations?: OpenAccountPaymentAllocationDto[];

  @IsOptional()
  @IsString()
  @MaxLength(80)
  provider?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  providerRef?: string;
}

export class CancelOpenAccountDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  expectedVersion!: number;

  @IsString()
  @MaxLength(300)
  reason!: string;
}
