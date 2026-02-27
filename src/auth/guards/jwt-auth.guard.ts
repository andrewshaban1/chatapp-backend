import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Drop this guard on any controller or route that requires authentication:
 *
 *   @UseGuards(JwtAuthGuard)
 *
 * It delegates to JwtStrategy, which validates the Bearer token and
 * populates req.user with the full User entity.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
