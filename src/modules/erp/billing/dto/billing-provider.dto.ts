import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateBillingProviderDto {
  @IsOptional()
  @IsIn(['TEST', 'PRODUCTION'])
  environment?: 'TEST' | 'PRODUCTION';

  @IsUrl({ require_protocol: true, protocols: ['https'] })
  @MaxLength(300)
  baseUrl!: string;

  @IsString()
  @MaxLength(500)
  endpoint!: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  token?: string;

  @IsIn(['BEARER', 'RAW', 'TOKEN'])
  authorizationScheme!: 'BEARER' | 'RAW' | 'TOKEN';

  @IsIn(['TICKET', 'A4'])
  pdfFormat!: 'TICKET' | 'A4';

  @IsBoolean()
  enabled!: boolean;
}

export class UpsertBillingSeriesDto {
  @IsString()
  branchId!: string;

  @IsIn(['BOLETA', 'FACTURA', 'NOTA_CREDITO', 'NOTA_DEBITO'])
  documentType!: 'BOLETA' | 'FACTURA' | 'NOTA_CREDITO' | 'NOTA_DEBITO';

  @IsString()
  @Matches(/^[BF][A-Z0-9]{3}$/i, {
    message: 'La serie debe tener cuatro caracteres y comenzar con B o F.',
  })
  series!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  nextNumber!: number;

  @IsBoolean()
  enabled!: boolean;
}

export class IssueBillingDocumentDto {
  @IsIn(['BOLETA', 'FACTURA'])
  documentType!: 'BOLETA' | 'FACTURA';
}
