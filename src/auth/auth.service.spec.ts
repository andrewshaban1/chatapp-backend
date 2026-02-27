import * as bcrypt from 'bcrypt';

import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { User } from '@/src/users/user.entity';
import { UsersService } from '@/src/users/users.service';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest
    .fn()
    .mockImplementation((password: string, hash: string) =>
      Promise.resolve(
        password === 'testpassword' && hash === 'hashed-password',
      ),
    ),
}));

describe('AuthService', () => {
  let authService: AuthService;

  const mockPasswordHash = 'hashed-password';
  const testToken = 'test-token';
  const mockPassword = 'testpassword';

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
    passwordHash: mockPasswordHash,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockExistingUser: Pick<User, 'email' | 'username'> = {
    email: 'existing@example.com',
    username: 'existinguser',
  };

  const mockUsersService = {
    findByEmail: jest.fn().mockResolvedValue(mockUser),
    findById: jest.fn().mockResolvedValue(mockUser),
    create: jest.fn().mockImplementation((dto: RegisterDto) => {
      if (dto.email === mockExistingUser.email) {
        throw new ConflictException('A user with this email already exists.');
      }
      if (dto.username === mockExistingUser.username) {
        throw new ConflictException(
          'A user with this username already exists.',
        );
      }
      return Promise.resolve(mockUser);
    }),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue(testToken),
  };

  const mockConfigService = {
    getOrThrow: jest.fn().mockReturnValue('10'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const authModule: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    authService = authModule.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should register a new user and return an access token and user', async () => {
      const dto: RegisterDto = {
        email: mockUser.email,
        username: mockUser.username,
        password: mockPassword,
      };

      const result = await authService.register(dto);

      expect(result.accessToken).toBe(testToken);
      expect(result.user.username).toBe(mockUser.username);
      expect(result.user.email).toBe(mockUser.email);
      expect(result.user.createdAt).toBeDefined();
      expect(result.user.updatedAt).toBeDefined();
      expect(result.user.passwordHash).toBe(mockPasswordHash);
      expect(mockUsersService.create).toHaveBeenCalledTimes(1);
      expect(mockUsersService.create).toHaveBeenCalledWith({
        email: mockUser.email,
        username: mockUser.username,
        passwordHash: mockPasswordHash,
      });
      expect(mockJwtService.sign).toHaveBeenCalledTimes(1);
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        id: mockUser.id,
        email: mockUser.email,
      });
    });

    it('should throw a ConflictException if the email is already taken.', async () => {
      const dto: RegisterDto = {
        email: mockExistingUser.email,
        username: mockUser.username,
        password: mockPassword,
      };

      await expect(authService.register(dto)).rejects.toThrow(
        new ConflictException('A user with this email already exists.'),
      );
      expect(mockUsersService.create).toHaveBeenCalledTimes(1);
      expect(mockUsersService.create).toHaveBeenCalledWith({
        email: mockExistingUser.email,
        username: mockUser.username,
        passwordHash: mockPasswordHash,
      });
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('should throw a ConflictException if the username is already taken.', async () => {
      const dto: RegisterDto = {
        email: mockUser.email,
        username: mockExistingUser.username,
        password: mockPassword,
      };

      await expect(authService.register(dto)).rejects.toThrow(
        new ConflictException('A user with this username already exists.'),
      );
      expect(mockUsersService.create).toHaveBeenCalledTimes(1);
      expect(mockUsersService.create).toHaveBeenCalledWith({
        email: mockUser.email,
        username: mockExistingUser.username,
        passwordHash: mockPasswordHash,
      });
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('should hash the password before creating the user.', async () => {
      const dto: RegisterDto = {
        email: mockUser.email,
        username: mockUser.username,
        password: mockPassword,
      };

      const result = await authService.register(dto);

      expect(result.user.passwordHash).not.toBe(mockPassword);
      expect(bcrypt.hash).toHaveBeenCalledWith(mockPassword, 10);
      expect(bcrypt.hash).toHaveBeenCalledTimes(1);
    });
  });

  describe('login', () => {
    it('should return access token and user when credentials are valid', async () => {
      const dto: LoginDto = {
        email: mockUser.email,
        password: mockPassword,
      };

      const result = await authService.login(dto);

      expect(result.accessToken).toBe(testToken);
      expect(result.user.email).toBe(mockUser.email);
      expect(result.user.username).toBe(mockUser.username);
      expect(mockUsersService.findByEmail).toHaveBeenCalledTimes(1);
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        mockUser.email.toLowerCase(),
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        mockPassword,
        mockUser.passwordHash,
      );
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        id: mockUser.id,
        email: mockUser.email,
      });
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      const dto: LoginDto = {
        email: mockUser.email,
        password: 'wrongpassword',
      };

      await expect(authService.login(dto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(authService.login(dto)).rejects.toThrow(
        'Invalid email or password.',
      );
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        mockUser.email.toLowerCase(),
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'wrongpassword',
        mockUser.passwordHash,
      );
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      mockUsersService.findByEmail.mockResolvedValueOnce(null);

      const dto: LoginDto = {
        email: 'unknown@example.com',
        password: mockPassword,
      };

      await expect(authService.login(dto)).rejects.toThrow(
        new UnauthorizedException('Invalid email or password.'),
      );
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        'unknown@example.com',
      );
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('should normalize email to lowercase when finding user', async () => {
      const dto: LoginDto = {
        email: 'TEST@EXAMPLE.COM',
        password: mockPassword,
      };

      await authService.login(dto);

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
    });
  });
});
