import request from 'supertest';
import { App } from 'supertest/types';

import { INestApplication } from '@nestjs/common';

import { RegisterResponseDto } from '@/src/auth/dto/register.dto';
import { Chat } from '@/src/chats/chat.entity';

import { createE2eApp } from './shared/e2e-app';

const uniqueId = () =>
  Math.random().toString(36).slice(2, 11).replace(/-/g, '_');

describe('ChatsController (e2e)', () => {
  let app: INestApplication<App>;
  let accessTokenA: string;
  let userBId: number;

  beforeAll(async () => {
    app = await createE2eApp();

    const id = uniqueId();

    const resA = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: `chats-a-${id}@example.com`,
        username: `chats_a_${id}`,
        password: 'Password1',
      })
      .expect(201);

    const resB = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: `chats-b-${id}@example.com`,
        username: `chats_b_${id}`,
        password: 'Password1',
      })
      .expect(201);

    const bodyA = resA.body as RegisterResponseDto;
    const bodyB = resB.body as RegisterResponseDto;
    accessTokenA = bodyA.accessToken;
    userBId = bodyB.user.id;
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('POST /api/chats', () => {
    it('should create direct chat with one participant', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/chats')
        .set('Authorization', `Bearer ${accessTokenA}`)
        .send({ type: 'direct', participantIds: [userBId] })
        .expect(201);

      const body = res.body as Chat;
      expect(body.id).toBeDefined();
      expect(body.type).toBe('direct');
      expect(body.participants).toBeDefined();
      expect(Array.isArray(body.participants)).toBe(true);
      expect(body.participants.length).toBe(2);
    });

    it('should create group chat with name', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/chats')
        .set('Authorization', `Bearer ${accessTokenA}`)
        .send({
          type: 'group',
          name: 'Test Group',
          participantIds: [userBId],
        })
        .expect(201);

      const body = res.body as Chat;
      expect(body.id).toBeDefined();
      expect(body.type).toBe('group');
      expect(body.name).toBe('Test Group');
    });

    it('should return 400 when direct chat has zero participants', async () => {
      await request(app.getHttpServer())
        .post('/api/chats')
        .set('Authorization', `Bearer ${accessTokenA}`)
        .send({ type: 'direct', participantIds: [] })
        .expect(400);
    });

    it('should return 400 when direct chat has more than one participant', async () => {
      const id = uniqueId();
      const resC = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: `chats-c-${id}@example.com`,
          username: `chats_c_${id}`,
          password: 'Password1',
        })
        .expect(201);

      const bodyC = resC.body as RegisterResponseDto;
      await request(app.getHttpServer())
        .post('/api/chats')
        .set('Authorization', `Bearer ${accessTokenA}`)
        .send({ type: 'direct', participantIds: [userBId, bodyC.user.id] })
        .expect(400);
    });

    it('should return 404 when participant not found', async () => {
      await request(app.getHttpServer())
        .post('/api/chats')
        .set('Authorization', `Bearer ${accessTokenA}`)
        .send({ type: 'direct', participantIds: [999999] })
        .expect(404);
    });

    it('should return 401 when no token', async () => {
      await request(app.getHttpServer())
        .post('/api/chats')
        .send({ type: 'direct', participantIds: [userBId] })
        .expect(401);
    });
  });

  describe('GET /api/chats', () => {
    it('should return chats for authenticated user', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/chats')
        .set('Authorization', `Bearer ${accessTokenA}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 when no token', async () => {
      await request(app.getHttpServer()).get('/api/chats').expect(401);
    });
  });

  describe('GET /api/chats/:id', () => {
    it('should return chat when user is participant', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/chats')
        .set('Authorization', `Bearer ${accessTokenA}`)
        .send({ type: 'direct', participantIds: [userBId] })
        .expect(201);

      const createBody = createRes.body as Chat;
      const chatId = createBody.id;

      const res = await request(app.getHttpServer())
        .get(`/api/chats/${chatId}`)
        .set('Authorization', `Bearer ${accessTokenA}`)
        .expect(200);

      const body = res.body as Chat;
      expect(body.id).toBe(chatId);
      expect(body.participants).toBeDefined();
    });

    it('should return 404 when chat not found or user not participant', async () => {
      await request(app.getHttpServer())
        .get('/api/chats/999999')
        .set('Authorization', `Bearer ${accessTokenA}`)
        .expect(404);
    });

    it('should return 401 when no token', async () => {
      await request(app.getHttpServer()).get('/api/chats/1').expect(401);
    });
  });
});
