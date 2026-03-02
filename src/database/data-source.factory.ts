import { config } from 'dotenv';
import { DataSource } from 'typeorm';

import { Chat } from '@/src/chats/chat.entity';
import { Message } from '@/src/messages/message.entity';
import { User } from '@/src/users/user.entity';

config({ path: '.env.local' });

/**
 * Creates a TypeORM DataSource instance with the given database name.
 * Uses DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD from environment.
 */
export function createDataSource(database: string | undefined): DataSource {
  return new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database,
    entities: [User, Chat, Message],
    migrations: ['src/database/migrations/*{.ts,.js}'],
  });
}
