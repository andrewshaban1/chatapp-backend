import { Test, TestingModule } from '@nestjs/testing';

import { User } from '@/src/users/user.entity';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

describe('AuthController', () => {
  let authController: AuthController;

  const testToken = 'test-token';

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
    passwordHash: 'testpassword',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAuthService = {
    register: jest.fn().mockResolvedValue({
      accessToken: testToken,
      user: { ...mockUser, passwordHash: undefined },
    }),
    login: jest.fn().mockResolvedValue({
      accessToken: testToken,
      user: { ...mockUser, passwordHash: undefined },
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const authModule: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    authController = authModule.get<AuthController>(AuthController);
  });

  describe('register', () => {
    it('should return an access token and user', async () => {
      const dto: RegisterDto = {
        email: mockUser.email,
        username: mockUser.username,
        password: 'Password1',
      };

      const result = await authController.register(dto);

      expect(result.accessToken).toBeDefined();
      expect(result.accessToken).toBe(testToken);
      expect(result.user.username).toBe(mockUser.username);
      expect(result.user.email).toBe(mockUser.email);
      expect(result.user.createdAt).toBeDefined();
      expect(result.user.updatedAt).toBeDefined();
      expect(result.user.passwordHash).toBeUndefined();
      expect(mockAuthService.register).toHaveBeenCalledTimes(1);
      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
    });
  });

  describe('login', () => {
    it('should return an access token and user', async () => {
      const dto: LoginDto = {
        email: mockUser.email,
        password: 'Password123',
      };

      const result = await authController.login(dto);

      expect(result.accessToken).toBeDefined();
      expect(result.accessToken).toBe(testToken);
      expect(result.user.username).toBe(mockUser.username);
      expect(result.user.email).toBe(mockUser.email);
      expect(result.user.createdAt).toBeDefined();
      expect(result.user.updatedAt).toBeDefined();
      expect(result.user.passwordHash).toBeUndefined();
      expect(mockAuthService.login).toHaveBeenCalledTimes(1);
      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
    });
  });
});
