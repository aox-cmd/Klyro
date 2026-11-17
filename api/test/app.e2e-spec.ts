
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Klyro Application (e2e)', () => {
  let app: INestApplication;

  const prismaMock = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),

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
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
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

    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('starts the application successfully', () => {
    expect(app).toBeDefined();
  });

  it('protects the projects endpoint', async () => {
    await request(app.getHttpServer())
      .get('/projects')
      .expect(401);
  });
});
