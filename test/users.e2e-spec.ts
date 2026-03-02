import request from 'supertest';
import { App } from 'supertest/types';

import { INestApplication } from '@nestjs/common';

import { RegisterResponseDto } from '@/src/auth/dto/register.dto';
import { User } from '@/src/users/user.entity';

import { createE2eApp } from './shared/e2e-app';

const uniqueId = () =>
  Math.random().toString(36).slice(2, 11).replace(/-/g, '_');

describe('UsersController (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;

  beforeAll(async () => {
    app = await createE2eApp();

    const id = uniqueId();
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: `users-e2e-${id}@example.com`,
        username: `users_e2e_${id}`,
        password: 'Password1',
      })
      .expect(201);

    const body = res.body as RegisterResponseDto;
    accessToken = body.accessToken;
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('GET /api/users/me', () => {
    it('should return current user with valid Bearer token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const body = res.body as User;
      expect(body.id).toBeDefined();
      expect(body.email).toBeDefined();
      expect(body.username).toBeDefined();
      expect(body).not.toHaveProperty('passwordHash');
      expect(body.createdAt).toBeDefined();
      expect(body.updatedAt).toBeDefined();
    });

    it('should return 401 when no token is provided', async () => {
      await request(app.getHttpServer()).get('/api/users/me').expect(401);
    });

    it('should return 401 when token is invalid', async () => {
      await request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('GET /api/users', () => {
    it('should return array of users with valid token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const body = res.body as User[];
      expect(Array.isArray(body)).toBe(true);
      if (body.length > 0) {
        expect(body[0]).toHaveProperty('id');
        expect(body[0]).toHaveProperty('username');
        expect(body[0]).toHaveProperty('email');
        expect(body[0]).not.toHaveProperty('passwordHash');
      }
    });

    it('should return 401 when no token is provided', async () => {
      await request(app.getHttpServer()).get('/api/users').expect(401);
    });
  });
});
