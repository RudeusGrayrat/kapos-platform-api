import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateOrganizationRoleDto {
  @Transform(({ value }) => normalizeKey(value))
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  @Matches(/^[a-z0-9._-]+$/)
  key!: string;

  @Transform(({ value }) => normalizeOptionalText(value))
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  name!: string;

  @Transform(({ value }) => normalizeOptionalText(value))
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @IsString({ each: true })
  permissionKeys?: string[];
}

function normalizeKey(value: unknown) {
  if (typeof value !== 'string') {
    return value;
  }

  return value.trim().toLowerCase();
}

function normalizeOptionalText(value: unknown) {
  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}
