import request from 'supertest';
import { App } from 'supertest/types';

import { INestApplication } from '@nestjs/common';

import { createE2eApp } from './shared/e2e-app';

const uniqueId = () =>
  Math.random().toString(36).slice(2, 11).replace(/-/g, '_');

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createE2eApp();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('POST /api/auth/register', () => {
    const validPassword = 'Password1';

    it('should register a new user and return accessToken and user', async () => {
      const id = uniqueId();
      const email = `e2e-${id}@example.com`;
      const username = `user_${id}`;

      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email, username, password: validPassword })
        .expect(201);

      const body = res.body as {
        accessToken: string;
        user: {
          id: number;
          email: string;
          username: string;
          createdAt: string;
          updatedAt: string;
        };
      };
      expect(body.accessToken).toBeDefined();
      expect(typeof body.accessToken).toBe('string');
      expect(body.user).toBeDefined();
      expect(body.user.id).toBeDefined();
      expect(body.user.email).toBe(email);
      expect(body.user.username).toBe(username);
      expect(body.user).not.toHaveProperty('passwordHash');
      expect(body.user.createdAt).toBeDefined();
      expect(body.user.updatedAt).toBeDefined();
    });

    it('should return 400 for invalid email', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'not-an-email',
          username: 'validuser',
          password: validPassword,
        })
        .expect(400);

      expect((res.body as { message?: unknown }).message).toBeDefined();
    });

    it('should return 400 for short username', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          username: 'ab',
          password: validPassword,
        })
        .expect(400);

      expect((res.body as { message?: unknown }).message).toBeDefined();
    });

    it('should return 400 for weak password (no uppercase)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          username: 'validuser',
          password: 'password1',
        })
        .expect(400);

      expect((res.body as { message?: unknown }).message).toBeDefined();
    });

    it('should return 409 when email is already taken', async () => {
      const id = uniqueId();
      const email = `dup-${id}@example.com`;
      const username = `user_${id}`;

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email, username, password: validPassword })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          username: `other_${id}`,
          password: validPassword,
        })
        .expect(409);

      expect((res.body as { message?: string }).message).toContain('email');
    });

    it('should return 409 when username is already taken', async () => {
      const id = uniqueId();
      const email = `first-${id}@example.com`;
      const username = `sameuser_${id}`;

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email, username, password: validPassword })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: `second-${id}@example.com`,
          username,
          password: validPassword,
        })
        .expect(409);

      expect((res.body as { message?: string }).message).toContain('username');
    });
  });

  describe('POST /api/auth/login', () => {
    const validPassword = 'Password1';

    it('should return accessToken and user when credentials are valid', async () => {
      const id = uniqueId();
      const email = `login-${id}@example.com`;
      const username = `loginuser_${id}`;

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email, username, password: validPassword })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: validPassword })
        .expect(200);

      const body = res.body as {
        accessToken: string;
        user: { email: string; username: string };
      };
      expect(body.accessToken).toBeDefined();
      expect(body.user.email).toBe(email);
      expect(body.user.username).toBe(username);
      expect(body.user).not.toHaveProperty('passwordHash');
    });

    it('should return 401 when password is wrong', async () => {
      const id = uniqueId();
      const email = `wrongpw-${id}@example.com`;
      const username = `wrongpw_${id}`;

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email, username, password: validPassword })
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: 'WrongPassword1' })
        .expect(401);
    });

    it('should return 401 when user is not found', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: validPassword,
        })
        .expect(401);
    });

    it('should return 400 for invalid body', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'not-email', password: 'short' })
        .expect(400);
    });
  });
});
