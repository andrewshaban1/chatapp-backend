import { Type } from 'class-transformer';
import { IsEmail, IsObject, IsString, MinLength } from 'class-validator';

import { User } from '@/src/users/user.entity';

export class LoginRequestDto {
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters.' })
  password: string;
}

export class LoginResponseDto {
  @IsString()
  accessToken: string;

  @IsObject()
  @Type(() => User)
  user: User;
}
