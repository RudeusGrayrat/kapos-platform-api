import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  ModuleAudience,
  PermissionScope,
} from '../../../../database/prisma/generated/client';

export class CreatePlatformPermissionDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  @Matches(/^[a-z0-9._-]+$/)
  key!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  name!: string;

  @Transform(({ value }) => normalizeOptionalText(value))
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @Transform(({ value }) => normalizeOptionalLowercase(value))
  @IsOptional()
  @IsString()
  @MaxLength(50)
  moduleKey?: string;

  @Transform(({ value }) => normalizeOptionalLowercase(value))
  @IsOptional()
  @IsString()
  @MaxLength(50)
  submoduleKey?: string;

  @IsEnum(PermissionScope)
  scope!: PermissionScope;

  @IsEnum(ModuleAudience)
  audience!: ModuleAudience;
}

function normalizeOptionalText(value: unknown) {
  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeOptionalLowercase(value: unknown) {
  const normalized = normalizeOptionalText(value);
  return typeof normalized === 'string' ? normalized.toLowerCase() : normalized;
}
