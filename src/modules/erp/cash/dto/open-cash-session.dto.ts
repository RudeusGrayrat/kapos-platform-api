import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class OpenCashSessionDto {
  @IsString()
  branchId!: string;

  @IsString()
  cashRegisterId!: string;

  @IsOptional()
  @IsNumber()
  openingAmount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  openingNote?: string;
}
