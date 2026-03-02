import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Request,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { JwtAuthGuard } from '@/src/auth/guards/jwt-auth.guard';
import type { AuthorizedRequest } from '@/src/types/auth.type';

import { CreateMessageRequestDto } from './dto/create-message.dto';
import { Message } from './message.entity';
import { MessagesService } from './messages.service';

@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('chats/:chatId/messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  /**
   * GET /api/chats/:chatId/messages
   * Returns up to 30 messages, newest first.
   * Pass ?before=<messageId> for cursor-based pagination (infinite scroll).
   */
  @Get()
  findAll(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Query('before') before: number | undefined,
    @Request() req: AuthorizedRequest,
  ): Promise<Message[]> {
    return this.messagesService.findAll(chatId, req.user.id, before);
  }

  /**
   * POST /api/chats/:chatId/messages
   * Send a message to the chat.
   * Body: { content: string }
   */
  @Post()
  create(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Body() dto: CreateMessageRequestDto,
    @Request() req: AuthorizedRequest,
  ): Promise<Message> {
    return this.messagesService.create(chatId, dto, req.user);
  }
}
