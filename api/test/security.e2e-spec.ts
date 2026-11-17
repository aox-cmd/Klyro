
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Klyro API Security (e2e)', () => {
  let app: INestApplication;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    project: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    task: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  beforeAll(async () => {
    process.env.JWT_SECRET =
      'test-only-secret-not-for-production';

    const moduleFixture: TestingModule =
      await Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideProvider(PrismaService)
        .useValue(prismaMock)
        .compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('rejects unauthenticated project requests', async () => {
    await request(app.getHttpServer())
      .get('/projects')
      .expect(401);
  });

  it('rejects unauthenticated task requests', async () => {
    await request(app.getHttpServer())
      .get('/projects/1/tasks')
      .expect(401);
  });

  it('rejects invalid login data', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'not-an-email',
        password: '',
      })
      .expect(400);
  });

  it('rejects unexpected registration fields', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'StrongPassword123!',
        isAdmin: true,
      })
      .expect(400);
  });

  it('rejects an invalid bearer token', async () => {
    await request(app.getHttpServer())
      .get('/projects')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });
});

