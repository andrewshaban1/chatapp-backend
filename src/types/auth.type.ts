import type { Request } from 'express';

import { User } from '@/src/users/user.entity';

export interface AuthorizedRequest extends Request {
  user: User;
}
