import { Type } from 'class-transformer';
import {
  IsEmail,
  IsObject,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import { User } from '@/src/users/user.entity';

export class RegisterRequestDto {
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  email: string;

  /**
   * 3-20 chars, letters / numbers / underscores only.
   * Adjust the regex to match your product requirements.
   */
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters.' })
  @MaxLength(20, { message: 'Username must not exceed 20 characters.' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username may only contain letters, numbers and underscores.',
  })
  username: string;

  /** At least 8 chars, one uppercase, one number */
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters.' })
  @Matches(/(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least one uppercase letter and one number.',
  })
  password: string;
}

export class RegisterResponseDto {
  @IsString()
  accessToken: string;

  @IsObject()
  @Type(() => User)
  user: User;
}
