import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpsertStockDto {
  @IsString()
  productId!: string;

  @IsString()
  branchId!: string;

  @Type(() => Number)
  @IsNumber()
  quantity!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minQuantity?: number;
}
