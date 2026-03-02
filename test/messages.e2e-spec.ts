import request from 'supertest';
import { App } from 'supertest/types';

import { INestApplication } from '@nestjs/common';

import { RegisterResponseDto } from '@/src/auth/dto/register.dto';
import { Chat } from '@/src/chats/chat.entity';
import { Message } from '@/src/messages/message.entity';

import { createE2eApp } from './shared/e2e-app';

const uniqueId = () =>
  Math.random().toString(36).slice(2, 11).replace(/-/g, '_');

describe('MessagesController (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;
  let chatId: number;

  beforeAll(async () => {
    app = await createE2eApp();

    const id = uniqueId();

    const resA = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: `msg-a-${id}@example.com`,
        username: `msg_a_${id}`,
        password: 'Password1',
      })
      .expect(201);

    const resB = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: `msg-b-${id}@example.com`,
        username: `msg_b_${id}`,
        password: 'Password1',
      })
      .expect(201);

    const bodyA = resA.body as RegisterResponseDto;
    const bodyB = resB.body as RegisterResponseDto;
    accessToken = bodyA.accessToken;
    const userBId = bodyB.user.id;

    const chatRes = await request(app.getHttpServer())
      .post('/api/chats')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ type: 'direct', participantIds: [userBId] })
      .expect(201);

    const chatBody = chatRes.body as Chat;
    chatId = chatBody.id;
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('GET /api/chats/:chatId/messages', () => {
    it('should return messages array for participant', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/chats/${chatId}/messages`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 when no token', async () => {
      await request(app.getHttpServer())
        .get(`/api/chats/${chatId}/messages`)
        .expect(401);
    });

    it('should return 403 when user is not participant', async () => {
      const id = uniqueId();
      const resC = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: `msg-c-${id}@example.com`,
          username: `msg_c_${id}`,
          password: 'Password1',
        })
        .expect(201);

      const bodyC = resC.body as RegisterResponseDto;
      await request(app.getHttpServer())
        .get(`/api/chats/${chatId}/messages`)
        .set('Authorization', `Bearer ${bodyC.accessToken}`)
        .expect(403);
    });
  });

  describe('POST /api/chats/:chatId/messages', () => {
    it('should create message and return it', async () => {
      const content = 'Hello from e2e test!';

      const res = await request(app.getHttpServer())
        .post(`/api/chats/${chatId}/messages`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content })
        .expect(201);

      const body = res.body as Message;
      expect(body.id).toBeDefined();
      expect(body.content).toBe(content);
      expect(body.chatId).toBe(chatId);
      expect(body.sender).toBeDefined();
      expect(body.createdAt).toBeDefined();
    });

    it('should return 400 for empty content', async () => {
      await request(app.getHttpServer())
        .post(`/api/chats/${chatId}/messages`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: '' })
        .expect(400);
    });

    it('should return 401 when no token', async () => {
      await request(app.getHttpServer())
        .post(`/api/chats/${chatId}/messages`)
        .send({ content: 'Hello' })
        .expect(401);
    });

    it('should return 403 when user is not participant', async () => {
      const id = uniqueId();
      const resC = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: `msg-d-${id}@example.com`,
          username: `msg_d_${id}`,
          password: 'Password1',
        })
        .expect(201);

      const bodyC = resC.body as RegisterResponseDto;
      await request(app.getHttpServer())
        .post(`/api/chats/${chatId}/messages`)
        .set('Authorization', `Bearer ${bodyC.accessToken}`)
        .send({ content: 'Hello' })
        .expect(403);
    });
  });
});
