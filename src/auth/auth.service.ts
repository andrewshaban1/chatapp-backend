import * as bcrypt from 'bcrypt';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { User } from '@/src/users/user.entity';
import { UsersService } from '@/src/users/users.service';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // Register

  async register(
    dto: RegisterDto,
  ): Promise<{ accessToken: string; user: User }> {
    const passwordHash = await bcrypt.hash(
      dto.password,
      Number(this.configService.getOrThrow<string>('BCRYPT_WORK_FACTOR')),
    );

    // UsersService.create() throws ConflictException if email/username is taken
    const user = await this.usersService.create({
      email: dto.email.toLowerCase().trim(),
      username: dto.username.trim(),
      passwordHash,
    });

    const accessToken = this.signToken(user);
    return { accessToken, user };
  }

  // Login

  async login(dto: LoginDto): Promise<{ accessToken: string; user: User }> {
    const user = await this.usersService.findByEmail(
      dto.email.toLowerCase().trim(),
    );

    // Use a constant-time compare to prevent timing attacks
    const passwordMatches = user
      ? await bcrypt.compare(dto.password, user.passwordHash)
      : false;

    if (!user || !passwordMatches) {
      // Intentionally vague — don't leak whether the email exists
      throw new UnauthorizedException('Invalid email or password.');
    }

    const accessToken = this.signToken(user);
    return { accessToken, user };
  }

  // Helpers

  private signToken(user: User): string {
    const payload: JwtPayload = { id: user.id, email: user.email };
    return this.jwtService.sign(payload);
  }
}
