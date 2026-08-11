import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { MembershipStatus } from '../../../../database/prisma/generated/client';

export class AssignPlatformMembershipDto {
  @Transform(({ value }) => normalizeOptionalText(value))
  @IsString()
  organizationId!: string;

  @Transform(({ value }) => normalizeOptionalText(value))
  @IsOptional()
  @IsString()
  roleScopeKey?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  roleScopeKeys?: string[];

  @IsOptional()
  @IsBoolean()
  replaceRoles?: boolean;

  @IsOptional()
  @IsEnum(MembershipStatus)
  status?: MembershipStatus;

  @Transform(({ value }) => normalizeOptionalText(value))
  @IsOptional()
  @IsString()
  @MaxLength(80)
  title?: string;

  @Transform(({ value }) => normalizeOptionalText(value))
  @IsOptional()
  @IsString()
  @MaxLength(40)
  employeeCode?: string;
}

function normalizeOptionalText(value: unknown) {
  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}
