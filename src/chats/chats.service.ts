import { In, Repository } from 'typeorm';

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { User } from '@/src/users/user.entity';

import { Chat, ChatType } from './chat.entity';
import { CreateChatRequestDto } from './dto/create-chat.dto';

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(Chat)
    private readonly chatsRepo: Repository<Chat>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  // Create chat
  async create(dto: CreateChatRequestDto, creator: User): Promise<Chat> {
    // For direct chats enforce exactly 1 other participant
    if (dto.type === ChatType.DIRECT && dto.participantIds.length !== 1) {
      throw new BadRequestException(
        'Direct chats must have exactly one other participant.',
      );
    }

    // Resolve all participant users
    const participantUsers = await this.usersRepo.findBy({
      id: In([...dto.participantIds]),
    });

    if (participantUsers.length !== dto.participantIds.length) {
      throw new NotFoundException('One or more participants not found.');
    }

    // Prevent duplicate direct chats between the same two users
    if (dto.type === ChatType.DIRECT) {
      const existing = await this.findDirectChat(
        creator.id,
        dto.participantIds[0],
      );
      if (existing) return existing;
    }

    const chat = this.chatsRepo.create({
      type: dto.type,
      name: dto.name ?? null,
      createdBy: creator.id,
      participants: [creator, ...participantUsers],
    });

    return this.chatsRepo.save(chat);
  }

  // List chats for a user
  async findAllForUser(userId: number): Promise<Chat[]> {
    return this.chatsRepo
      .createQueryBuilder('chat')
      .innerJoin(
        'chat.participants',
        'participant',
        'participant.id = :userId',
        { userId },
      )
      .leftJoinAndSelect('chat.participants', 'allParticipants')
      .leftJoinAndMapOne(
        'chat.lastMessage',
        'chat.messages',
        'lastMessage',
        // Subquery: pick only the most recent message per chat
        'lastMessage.created_at = (SELECT MAX(m.created_at) FROM messages m WHERE m.chat_id = chat.id)',
      )
      .orderBy('chat.updatedAt', 'DESC')
      .getMany();
  }

  // Get single chat (verify user is a participant)
  async findOne(chatId: number, userId: number): Promise<Chat> {
    const chat = await this.chatsRepo
      .createQueryBuilder('chat')
      .innerJoin(
        'chat.participants',
        'participant',
        'participant.id = :userId',
        { userId },
      )
      .leftJoinAndSelect('chat.participants', 'allParticipants')
      .where('chat.id = :chatId', { chatId })
      .getOne();

    if (!chat)
      throw new NotFoundException(
        'Chat not found or you are not a participant.',
      );
    return chat;
  }

  // Helper: find existing direct chat between two users
  private async findDirectChat(
    userAId: number,
    userBId: number,
  ): Promise<Chat | null> {
    return this.chatsRepo
      .createQueryBuilder('chat')
      .innerJoin('chat.participants', 'a', 'a.id = :userAId', { userAId })
      .innerJoin('chat.participants', 'b', 'b.id = :userBId', { userBId })
      .where('chat.type = :type', { type: ChatType.DIRECT })
      .getOne();
  }

  // Verify membership (used by MessagesService)
  async assertParticipant(chatId: number, userId: number): Promise<Chat> {
    const chat = await this.chatsRepo
      .createQueryBuilder('chat')
      .innerJoin('chat.participants', 'p', 'p.id = :userId', { userId })
      .where('chat.id = :chatId', { chatId })
      .getOne();

    if (!chat)
      throw new ForbiddenException('You are not a participant of this chat.');
    return chat;
  }
}
