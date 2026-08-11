import { IsString, MinLength } from 'class-validator';

export class MobileRefreshTokenDto {
  @IsString()
  @MinLength(20)
  refreshToken!: string;
}
