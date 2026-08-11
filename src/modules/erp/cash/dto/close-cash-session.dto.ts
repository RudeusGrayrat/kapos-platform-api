import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CloseCashSessionDto {
  @IsNumber()
  countedAmount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  closingNote?: string;
}
