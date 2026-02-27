import { ExtractJwt, Strategy } from 'passport-jwt';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';

import { User } from '@/src/users/user.entity';
import { UsersService } from '@/src/users/users.service';

export interface JwtPayload {
  id: number; // user ID
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      // Extract the token from the "Authorization: Bearer <token>" header
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /**
   * Called automatically by Passport after it verifies the token signature.
   * Whatever we return here is attached to req.user.
   */
  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.usersService.findById(payload.id);
    if (!user) throw new UnauthorizedException('User no longer exists.');
    return user; // req.user = User entity (passwordHash excluded via @Exclude)
  }
}
