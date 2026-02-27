// src/database/data-source.ts
import { config } from 'dotenv';
import { DataSource } from 'typeorm';

import { User } from '../users/user.entity';

config({ path: '.env.local' }); // .evn.local because .env is used in docker-compose and it confuses dabase host

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [User], // add Chat, Message here in Phase 2
  migrations: ['src/database/migrations/*{.ts,.js}'],
});
