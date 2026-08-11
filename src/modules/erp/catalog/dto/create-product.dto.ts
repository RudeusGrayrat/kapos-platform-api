import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateProductDto {
  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  sku?: string;

  @IsString()
  @MaxLength(160)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsIn(['PRODUCT', 'SERVICE', 'INGREDIENT', 'COMBO'])
  type?: 'PRODUCT' | 'SERVICE' | 'INGREDIENT' | 'COMBO';

  @IsOptional()
  price?: number;

  @IsOptional()
  cost?: number;

  @IsOptional()
  taxRate?: number;

  @IsOptional()
  @IsBoolean()
  trackStock?: boolean;

  @IsOptional()
  @IsBoolean()
  availableForPos?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  imageUrl?: string;
}
