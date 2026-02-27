import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { JwtAuthGuard } from '@/src/auth/guards/jwt-auth.guard';
import type { AuthorizedRequest } from '@/src/types/auth.type';

import { User } from './user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
    passwordHash: 'hashed',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsers: User[] = [
    mockUser,
    {
      ...mockUser,
      id: 2,
      email: 'other@example.com',
      username: 'otheruser',
    },
  ];

  const mockUsersService = {
    findAll: jest.fn().mockResolvedValue(mockUsers),
  };

  /** Guard that passes and injects mockUser into req.user for testing */
  const mockJwtGuard = {
    canActivate: (context: ExecutionContext): boolean => {
      const request = context.switchToHttp().getRequest<AuthorizedRequest>();
      request.user = mockUser;
      return true;
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtGuard)
      .compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMe', () => {
    it('should return the authenticated user from the request', () => {
      const req = { user: mockUser } as AuthorizedRequest;

      const result = controller.getMe(req);

      expect(result).toEqual(mockUser);
      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe('test@example.com');
      expect(result.username).toBe('testuser');
    });
  });

  describe('findAll', () => {
    it('should call usersService.findAll and return the list of users', async () => {
      const result = await controller.findAll();

      expect(mockUsersService.findAll).toHaveBeenCalledTimes(1);
      expect(mockUsersService.findAll).toHaveBeenCalledWith();
      expect(result).toEqual(mockUsers);
      expect(result).toHaveLength(2);
    });
  });
});
