import { ArrayMaxSize, IsArray, IsOptional, IsString } from 'class-validator';

export class UpdatePermissionOverridesDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(250)
  @IsString({ each: true })
  allowPermissionKeys?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(250)
  @IsString({ each: true })
  denyPermissionKeys?: string[];
}
