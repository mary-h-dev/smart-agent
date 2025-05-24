import { Module } from '@nestjs/common';
import { ResearchController } from './research.controller';
import { ResearchService } from './research.service';
import { DeepResearchService } from './deep-research.service';
import { FeedbackService } from './feedback.service';
import { FirecrawlModule } from '../firecrawl/firecrawl.module';

@Module({
  imports: [FirecrawlModule],
  controllers: [ResearchController],
  providers: [ResearchService, DeepResearchService, FeedbackService],
  exports: [ResearchService],
})
export class ResearchModule {}
