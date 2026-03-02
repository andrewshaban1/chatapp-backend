// src/database/data-source.ts
import { config } from 'dotenv';
import { DataSource } from 'typeorm';

import { Chat } from '@/src/chats/chat.entity';
import { Message } from '@/src/messages/message.entity';
import { User } from '@/src/users/user.entity';

config({ path: '.env.local' }); // .evn.local because .env is used in docker-compose and it confuses dabase host

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [User, Chat, Message],
  migrations: ['src/database/migrations/*{.ts,.js}'],
});
