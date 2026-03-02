import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ChatsModule } from '@/src/chats/chats.module';

import { Message } from './message.entity';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message]),
    ChatsModule, // gives us ChatsService for participant checks
  ],
  providers: [MessagesService],
  controllers: [MessagesController],
  exports: [MessagesService], // WebSocket gateway will need this in Phase 3
})
export class MessagesModule {}
