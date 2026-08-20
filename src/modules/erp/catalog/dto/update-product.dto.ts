import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  sku?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsIn(['PRODUCT', 'SERVICE', 'INGREDIENT', 'COMBO'])
  type?: 'PRODUCT' | 'SERVICE' | 'INGREDIENT' | 'COMBO';

  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE', 'ARCHIVED'])
  status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

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
