import { Controller, Get, Request, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '@/src/auth/guards/jwt-auth.guard';
import type { AuthorizedRequest } from '@/src/types/auth.type';

import { User } from './user.entity';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard) // Every route in this controller requires a valid JWT
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** GET /users/me  →  currently authenticated user */
  @Get('me')
  getMe(@Request() req: AuthorizedRequest): User {
    // req.user is populated by JwtStrategy.validate()
    return req.user;
  }

  /** GET /users  →  list all users (for chat search) */
  @Get()
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }
}
