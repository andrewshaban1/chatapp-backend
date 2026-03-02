import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Chat } from '@/src/chats/chat.entity';
import { ChatsService } from '@/src/chats/chats.service';
import { User } from '@/src/users/user.entity';

import { CreateMessageRequestDto } from './dto/create-message.dto';
import { Message } from './message.entity';
import { MessagesService } from './messages.service';

describe('MessagesService', () => {
  let messagesService: MessagesService;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
    passwordHash: 'hashed-password',
    chats: [],
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMessage: Message = {
    id: 1,
    content: 'Hello world',
    chatId: 1,
    chat: {} as Chat,
    senderId: mockUser.id,
    sender: mockUser,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockChat = { id: 1, participants: [mockUser] };

  const mockMessagesRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockChatsService = {
    assertParticipant: jest.fn(),
  };

  const createMockQueryBuilder = (messages: Message[] = []) => {
    const qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(messages),
    };
    mockMessagesRepo.createQueryBuilder.mockReturnValue(qb);
    return qb;
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        {
          provide: getRepositoryToken(Message),
          useValue: mockMessagesRepo,
        },
        {
          provide: ChatsService,
          useValue: mockChatsService,
        },
      ],
    }).compile();

    messagesService = module.get<MessagesService>(MessagesService);
  });

  it('should be defined', () => {
    expect(messagesService).toBeDefined();
  });

  describe('create', () => {
    const dto: CreateMessageRequestDto = { content: 'Hello world' };
    const chatId = 1;

    it('should create and return message when user is participant', async () => {
      mockChatsService.assertParticipant.mockResolvedValue(mockChat);
      mockMessagesRepo.create.mockReturnValue(mockMessage);
      mockMessagesRepo.save.mockResolvedValue(mockMessage);

      const result = await messagesService.create(chatId, dto, mockUser);

      expect(mockChatsService.assertParticipant).toHaveBeenCalledTimes(1);
      expect(mockChatsService.assertParticipant).toHaveBeenCalledWith(
        chatId,
        mockUser.id,
      );
      expect(mockMessagesRepo.create).toHaveBeenCalledWith({
        content: dto.content,
        chatId,
        senderId: mockUser.id,
        sender: mockUser,
      });
      expect(mockMessagesRepo.save).toHaveBeenCalledWith(mockMessage);
      expect(result).toEqual(mockMessage);
    });

    it('should throw ForbiddenException when user is not participant', async () => {
      mockChatsService.assertParticipant.mockRejectedValue(
        new ForbiddenException('You are not a participant of this chat.'),
      );

      await expect(
        messagesService.create(chatId, dto, mockUser),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        messagesService.create(chatId, dto, mockUser),
      ).rejects.toThrow('You are not a participant of this chat.');

      expect(mockMessagesRepo.create).not.toHaveBeenCalled();
      expect(mockMessagesRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    const chatId = 1;
    const userId = mockUser.id;

    it('should return messages in ascending order when user is participant', async () => {
      mockChatsService.assertParticipant.mockResolvedValue(mockChat);
      const messages = [
        { ...mockMessage, id: 2, createdAt: new Date('2025-01-02') },
        { ...mockMessage, id: 1, createdAt: new Date('2025-01-01') },
      ];
      createMockQueryBuilder(messages);

      const result = await messagesService.findAll(chatId, userId);

      expect(mockChatsService.assertParticipant).toHaveBeenCalledWith(
        chatId,
        userId,
      );
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(2);
    });

    it('should throw ForbiddenException when user is not participant', async () => {
      mockChatsService.assertParticipant.mockRejectedValue(
        new ForbiddenException('You are not a participant of this chat.'),
      );

      await expect(messagesService.findAll(chatId, userId)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockMessagesRepo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should apply cursor filter when before param is provided', async () => {
      mockChatsService.assertParticipant.mockResolvedValue(mockChat);
      const cursorMessage = {
        ...mockMessage,
        id: 5,
        createdAt: new Date('2025-01-15'),
      };
      mockMessagesRepo.findOne.mockResolvedValue(cursorMessage);
      const qb = createMockQueryBuilder([mockMessage]);

      await messagesService.findAll(chatId, userId, 5);

      expect(mockMessagesRepo.findOne).toHaveBeenCalledWith({
        where: { id: 5 },
      });
      expect(qb.andWhere).toHaveBeenCalledWith(
        'message.createdAt < :cursorDate',
        { cursorDate: cursorMessage.createdAt },
      );
    });

    it('should not apply cursor filter when cursor message not found', async () => {
      mockChatsService.assertParticipant.mockResolvedValue(mockChat);
      mockMessagesRepo.findOne.mockResolvedValue(null);
      const qb = createMockQueryBuilder([]);

      await messagesService.findAll(chatId, userId, 999);

      expect(qb.andWhere).not.toHaveBeenCalled();
    });

    it('should return empty array when no messages', async () => {
      mockChatsService.assertParticipant.mockResolvedValue(mockChat);
      createMockQueryBuilder([]);

      const result = await messagesService.findAll(chatId, userId);

      expect(result).toEqual([]);
    });
  });
});
