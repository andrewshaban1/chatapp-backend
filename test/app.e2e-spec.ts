import request from 'supertest';
import { App } from 'supertest/types';

import { INestApplication } from '@nestjs/common';

import { createE2eApp } from './shared/e2e-app';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createE2eApp();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('/api (GET)', () => {
    return request(app.getHttpServer())
      .get('/api')
      .expect(200)
      .expect('Server is running...');
  });
});
