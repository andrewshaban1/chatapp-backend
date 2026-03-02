import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { User } from '@/src/users/user.entity';

import { Chat, ChatType } from './chat.entity';
import { ChatsService } from './chats.service';
import { CreateChatDto } from './dto/create-chat.dto';

describe('ChatsService', () => {
  let chatsService: ChatsService;

  const mockUser: User = {
    id: 1,
    email: 'creator@example.com',
    username: 'creator',
    passwordHash: 'hashed-password',
    chats: [],
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockParticipant: User = {
    id: 2,
    email: 'participant@example.com',
    username: 'participant',
    passwordHash: 'hashed-password',
    chats: [],
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockChat: Chat = {
    id: 1,
    type: ChatType.DIRECT,
    name: null,
    createdBy: mockUser.id,
    participants: [mockUser, mockParticipant],
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockChatsRepo = {
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockUsersRepo = {
    findBy: jest.fn(),
  };

  const createMockQueryBuilder = (result: Chat | Chat[] | null) => {
    const getOneResult = Array.isArray(result) ? (result[0] ?? null) : result;
    const getManyResult = Array.isArray(result)
      ? result
      : result
        ? [result]
        : [];
    const qb = {
      innerJoin: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoinAndMapOne: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(getOneResult),
      getMany: jest.fn().mockResolvedValue(getManyResult),
    };
    mockChatsRepo.createQueryBuilder.mockReturnValue(qb);
    return qb;
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatsService,
        {
          provide: getRepositoryToken(Chat),
          useValue: mockChatsRepo,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUsersRepo,
        },
      ],
    }).compile();

    chatsService = module.get<ChatsService>(ChatsService);
  });

  it('should be defined', () => {
    expect(chatsService).toBeDefined();
  });

  describe('create', () => {
    it('should create direct chat when participantIds has exactly one user', async () => {
      const dto: CreateChatDto = {
        type: ChatType.DIRECT,
        participantIds: [mockParticipant.id],
      };
      mockUsersRepo.findBy.mockResolvedValue([mockParticipant]);
      mockChatsRepo.createQueryBuilder.mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      });
      mockChatsRepo.create.mockReturnValue(mockChat);
      mockChatsRepo.save.mockResolvedValue(mockChat);

      const result = await chatsService.create(dto, mockUser);

      expect(mockUsersRepo.findBy).toHaveBeenCalled();
      expect(mockChatsRepo.create).toHaveBeenCalledWith({
        type: ChatType.DIRECT,
        name: null,
        createdBy: mockUser.id,
        participants: [mockUser, mockParticipant],
      });
      expect(mockChatsRepo.save).toHaveBeenCalledWith(mockChat);
      expect(result).toEqual(mockChat);
    });

    it('should create group chat with multiple participants', async () => {
      const dto: CreateChatDto = {
        type: ChatType.GROUP,
        name: 'Test Group',
        participantIds: [mockParticipant.id, 3],
      };
      const participants = [mockParticipant, { ...mockParticipant, id: 3 }];
      const groupChat = {
        ...mockChat,
        type: ChatType.GROUP,
        name: 'Test Group',
      };
      mockUsersRepo.findBy.mockResolvedValue(participants);
      mockChatsRepo.create.mockReturnValue(groupChat);
      mockChatsRepo.save.mockResolvedValue(groupChat);

      const result = await chatsService.create(dto, mockUser);

      expect(mockChatsRepo.create).toHaveBeenCalledWith({
        type: ChatType.GROUP,
        name: 'Test Group',
        createdBy: mockUser.id,
        participants: [mockUser, ...participants],
      });
      expect(result.type).toBe(ChatType.GROUP);
    });

    it('should throw BadRequestException when direct chat has zero participants', async () => {
      const dto: CreateChatDto = {
        type: ChatType.DIRECT,
        participantIds: [],
      };

      await expect(chatsService.create(dto, mockUser)).rejects.toThrow(
        BadRequestException,
      );
      await expect(chatsService.create(dto, mockUser)).rejects.toThrow(
        'Direct chats must have exactly one other participant.',
      );
      expect(mockUsersRepo.findBy).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when direct chat has more than one participant', async () => {
      const dto: CreateChatDto = {
        type: ChatType.DIRECT,
        participantIds: [2, 3],
      };

      await expect(chatsService.create(dto, mockUser)).rejects.toThrow(
        BadRequestException,
      );
      await expect(chatsService.create(dto, mockUser)).rejects.toThrow(
        'Direct chats must have exactly one other participant.',
      );
      expect(mockUsersRepo.findBy).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when participant not found', async () => {
      const dto: CreateChatDto = {
        type: ChatType.DIRECT,
        participantIds: [999],
      };
      mockUsersRepo.findBy.mockResolvedValue([]);

      await expect(chatsService.create(dto, mockUser)).rejects.toThrow(
        NotFoundException,
      );
      await expect(chatsService.create(dto, mockUser)).rejects.toThrow(
        'One or more participants not found.',
      );
      expect(mockChatsRepo.create).not.toHaveBeenCalled();
    });

    it('should return existing direct chat when one already exists', async () => {
      const dto: CreateChatDto = {
        type: ChatType.DIRECT,
        participantIds: [mockParticipant.id],
      };
      mockUsersRepo.findBy.mockResolvedValue([mockParticipant]);
      mockChatsRepo.createQueryBuilder.mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockChat),
      });

      const result = await chatsService.create(dto, mockUser);

      expect(result).toEqual(mockChat);
      expect(mockChatsRepo.create).not.toHaveBeenCalled();
      expect(mockChatsRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('findAllForUser', () => {
    it('should return chats for user ordered by updatedAt', async () => {
      const chats = [mockChat];
      createMockQueryBuilder(chats);

      const result = await chatsService.findAllForUser(mockUser.id);

      expect(mockChatsRepo.createQueryBuilder).toHaveBeenCalledWith('chat');
      expect(result).toEqual(chats);
    });

    it('should return empty array when user has no chats', async () => {
      createMockQueryBuilder([]);

      const result = await chatsService.findAllForUser(mockUser.id);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return chat when user is participant', async () => {
      createMockQueryBuilder(mockChat);

      const result = await chatsService.findOne(mockChat.id, mockUser.id);

      expect(result).toEqual(mockChat);
    });

    it('should throw NotFoundException when chat not found or user not participant', async () => {
      createMockQueryBuilder(null);

      await expect(chatsService.findOne(999, mockUser.id)).rejects.toThrow(
        NotFoundException,
      );
      await expect(chatsService.findOne(999, mockUser.id)).rejects.toThrow(
        'Chat not found or you are not a participant.',
      );
    });
  });

  describe('assertParticipant', () => {
    it('should return chat when user is participant', async () => {
      createMockQueryBuilder(mockChat);

      const result = await chatsService.assertParticipant(
        mockChat.id,
        mockUser.id,
      );

      expect(result).toEqual(mockChat);
    });

    it('should throw ForbiddenException when user is not participant', async () => {
      createMockQueryBuilder(null);

      await expect(
        chatsService.assertParticipant(mockChat.id, 999),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        chatsService.assertParticipant(mockChat.id, 999),
      ).rejects.toThrow('You are not a participant of this chat.');
    });
  });
});
