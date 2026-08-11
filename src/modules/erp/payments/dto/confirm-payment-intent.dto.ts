import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ConfirmPaymentIntentDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  providerRef?: string;

  @IsOptional()
  rawResponse?: unknown;
}
