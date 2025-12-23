import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @MinLength(2)
  username: string; // 用户名登录

  @IsString()
  password: string;
}
