import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateOrganizationProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  legalName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  tradeName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  documentNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  currencyCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  timezone?: string;

  @IsOptional()
  taxRate?: number;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  receiptFooter?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  logoUrl?: string;
}
