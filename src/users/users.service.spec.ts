import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { User } from './user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let usersService: UsersService;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
    passwordHash: 'hashed-password',
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

  const mockUsersRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUsersRepo,
        },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(usersService).toBeDefined();
  });

  describe('findByEmail', () => {
    it('should return user when found', async () => {
      mockUsersRepo.findOne.mockResolvedValue(mockUser);

      const result = await usersService.findByEmail(mockUser.email);

      expect(mockUsersRepo.findOne).toHaveBeenCalledTimes(1);
      expect(mockUsersRepo.findOne).toHaveBeenCalledWith({
        where: { email: mockUser.email },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      mockUsersRepo.findOne.mockResolvedValue(null);

      const result = await usersService.findByEmail('unknown@example.com');

      expect(mockUsersRepo.findOne).toHaveBeenCalledWith({
        where: { email: 'unknown@example.com' },
      });
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      mockUsersRepo.findOne.mockResolvedValue(mockUser);

      const result = await usersService.findById(mockUser.id);

      expect(mockUsersRepo.findOne).toHaveBeenCalledTimes(1);
      expect(mockUsersRepo.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      mockUsersRepo.findOne.mockResolvedValue(null);

      const result = await usersService.findById(999);

      expect(mockUsersRepo.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
      });
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all users ordered by username', async () => {
      mockUsersRepo.find.mockResolvedValue(mockUsers);

      const result = await usersService.findAll();

      expect(mockUsersRepo.find).toHaveBeenCalledTimes(1);
      expect(mockUsersRepo.find).toHaveBeenCalledWith({
        order: { username: 'ASC' },
      });
      expect(result).toEqual(mockUsers);
      expect(result).toHaveLength(2);
    });
  });

  describe('create', () => {
    const createData = {
      email: 'new@example.com',
      username: 'newuser',
      passwordHash: 'hashed-password',
    };

    it('should create and return user when email and username are unique', async () => {
      const createdUser = {
        ...mockUser,
        ...createData,
      };
      mockUsersRepo.findOne.mockResolvedValue(null);
      mockUsersRepo.create.mockReturnValue(createdUser);
      mockUsersRepo.save.mockResolvedValue(createdUser);

      const result = await usersService.create(createData);

      expect(mockUsersRepo.findOne).toHaveBeenCalledWith({
        where: [{ email: createData.email }, { username: createData.username }],
      });
      expect(mockUsersRepo.create).toHaveBeenCalledWith(createData);
      expect(mockUsersRepo.save).toHaveBeenCalledWith(createdUser);
      expect(result).toEqual(createdUser);
    });

    it('should throw ConflictException when email is already taken', async () => {
      mockUsersRepo.findOne.mockResolvedValue({
        ...mockUser,
        email: createData.email,
      });

      await expect(usersService.create(createData)).rejects.toThrow(
        new ConflictException('A user with this email already exists.'),
      );
      expect(mockUsersRepo.findOne).toHaveBeenCalledTimes(1);
      expect(mockUsersRepo.create).not.toHaveBeenCalled();
      expect(mockUsersRepo.save).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when username is already taken', async () => {
      mockUsersRepo.findOne.mockResolvedValue({
        ...mockUser,
        username: createData.username,
      });

      await expect(usersService.create(createData)).rejects.toThrow(
        new ConflictException('A user with this username already exists.'),
      );
      expect(mockUsersRepo.findOne).toHaveBeenCalledTimes(1);
      expect(mockUsersRepo.create).not.toHaveBeenCalled();
      expect(mockUsersRepo.save).not.toHaveBeenCalled();
    });
  });
});
