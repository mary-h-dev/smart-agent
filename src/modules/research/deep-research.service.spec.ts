import { Test, TestingModule } from '@nestjs/testing';
import { DeepResearchService } from './deep-research.service';
import { AIProviderService } from '../ai-provider/ai-provider.service';
import { FirecrawlService } from '../firecrawl/firecrawl.service';
import { ConfigService } from '@nestjs/config';

jest.mock('ai', () => ({
    ...jest.requireActual('ai'),
    generateObject: jest.fn().mockResolvedValue({
      object: {
        queries: [
          { query: 'AI overview', researchGoal: 'Understand basics' },
          { query: 'History of AI', researchGoal: 'Learn background' },
        ],
      },
    }),
  }));
  


describe('DeepResearchService', () => {
  let service: DeepResearchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeepResearchService,
        {
          provide: AIProviderService,
          useValue: {
            getModel: jest.fn(() => ({
              generate: jest.fn(),
            })),
            trimPrompt: jest.fn((p: string) => p),
          },
        },
        {
          provide: FirecrawlService,
          useValue: {
            search: jest.fn().mockResolvedValue({
              data: [
                { url: 'https://example.com', markdown: '# Sample Markdown' },
              ],
            }),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(() => 2), // firecrawl.concurrency
          },
        },
      ],
    }).compile();

    service = module.get<DeepResearchService>(DeepResearchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return default result from deepResearch', async () => {
    const result = await service.deepResearch({
      query: 'What is AI?',
      depth: 1,
      breadth: 2,
    });
    expect(result).toHaveProperty('learnings');
    expect(result).toHaveProperty('visitedUrls');
  });
});
