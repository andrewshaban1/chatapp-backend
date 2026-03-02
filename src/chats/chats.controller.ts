import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Request,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { JwtAuthGuard } from '@/src/auth/guards/jwt-auth.guard';
import type { AuthorizedRequest } from '@/src/types/auth.type';

import { ChatsService } from './chats.service';
import { CreateChatDto } from './dto/create-chat.dto';

@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  /**
   * POST /api/chats
   * Create a direct or group chat.
   * Body: { type: 'direct' | 'group', name?: string, participantIds: string[] }
   */
  @Post()
  create(@Body() dto: CreateChatDto, @Request() req: AuthorizedRequest) {
    return this.chatsService.create(dto, req.user);
  }

  /**
   * GET /api/chats
   * List all chats the authenticated user is a participant of.
   */
  @Get()
  findAll(@Request() req: AuthorizedRequest) {
    return this.chatsService.findAllForUser(req.user.id);
  }

  /**
   * GET /api/chats/:id
   * Get a single chat by ID (user must be a participant).
   */
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthorizedRequest,
  ) {
    return this.chatsService.findOne(id, req.user.id);
  }
}
