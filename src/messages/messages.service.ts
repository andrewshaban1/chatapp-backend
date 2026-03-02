import { Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { ChatsService } from '@/src/chats/chats.service';
import { User } from '@/src/users/user.entity';

import { CreateMessageRequestDto } from './dto/create-message.dto';
import { Message } from './message.entity';

// Number of messages returned per page
const PAGE_SIZE = 30;

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messagesRepo: Repository<Message>,
    private readonly chatsService: ChatsService,
  ) {}

  // Send a message
  async create(
    chatId: number,
    dto: CreateMessageRequestDto,
    sender: User,
  ): Promise<Message> {
    // Throws ForbiddenException if user is not a participant
    await this.chatsService.assertParticipant(chatId, sender.id);

    const message = this.messagesRepo.create({
      content: dto.content,
      chatId,
      senderId: sender.id,
      sender,
    });

    return this.messagesRepo.save(message);
  }

  // Get paginated messages for a chat
  // Uses cursor-based pagination via `before` (a message ID) for infinite scroll
  async findAll(
    chatId: number,
    userId: number,
    before?: number, // load messages older than this message ID
  ): Promise<Message[]> {
    // Verify membership
    await this.chatsService.assertParticipant(chatId, userId);

    const qb = this.messagesRepo
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .where('message.chatId = :chatId', { chatId })
      .orderBy('message.createdAt', 'DESC')
      .take(PAGE_SIZE);

    if (before) {
      // Find the createdAt of the cursor message and load messages older than it
      const cursor = await this.messagesRepo.findOne({ where: { id: before } });
      if (cursor) {
        qb.andWhere('message.createdAt < :cursorDate', {
          cursorDate: cursor.createdAt,
        });
      }
    }

    const messages = await qb.getMany();
    // Return in ascending order so the UI renders oldest → newest
    return messages.reverse();
  }
}
