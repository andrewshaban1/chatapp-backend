import { Repository } from 'typeorm';

import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  /** Find by email — used by AuthService during login */
  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email } });
  }

  /** Find by ID — used by JWT strategy to hydrate the request user */
  async findById(id: number): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id } });
  }

  /** Find all users — for chat participant search */
  async findAll(): Promise<User[]> {
    return this.usersRepo.find({ order: { username: 'ASC' } });
  }

  /**
   * Persist a new user.
   * The password must already be hashed before calling this method.
   */
  async create(
    data: Pick<User, 'email' | 'username' | 'passwordHash'>,
  ): Promise<User> {
    const existing = await this.usersRepo.findOne({
      where: [{ email: data.email }, { username: data.username }],
    });

    if (existing) {
      const field = existing.email === data.email ? 'email' : 'username';
      throw new ConflictException(`A user with this ${field} already exists.`);
    }

    const user = this.usersRepo.create(data);
    return this.usersRepo.save(user);
  }
}
