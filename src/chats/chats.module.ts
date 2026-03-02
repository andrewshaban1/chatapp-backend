import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '@/src/users/user.entity';

import { Chat } from './chat.entity';
import { ChatsController } from './chats.controller';
import { ChatsService } from './chats.service';

@Module({
  imports: [TypeOrmModule.forFeature([Chat, User])],
  providers: [ChatsService],
  controllers: [ChatsController],
  exports: [ChatsService], // MessagesModule needs ChatsService
})
export class ChatsModule {}
