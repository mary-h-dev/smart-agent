import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('ResearchController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/api/research (POST) - should return follow-up questions', () => {
    return request(app.getHttpServer())
      .post('/api/research')
      .send({
        query: 'What is the impact of AI on healthcare?',
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.needFollowUp).toBe(true);
        expect(res.body.questions).toHaveLength(3);
        expect(res.body.questionsFormatted).toBeDefined();
      });
  });

  it('/api/research (POST) - should return 400 for missing query', () => {
    return request(app.getHttpServer())
      .post('/api/research')
      .send({})
      .expect(400);
  });

  it('/api/research (POST) - should validate depth parameter', () => {
    return request(app.getHttpServer())
      .post('/api/research')
      .send({
        query: 'Test query',
        depth: 10, // Invalid depth
      })
      .expect(400);
  });
});