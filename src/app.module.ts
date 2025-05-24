import { FirecrawlModule } from './modules/firecrawl/firecrawl.module';
import configuration from './config/configuration';
import { AIProviderModule } from './modules/ai-provider/ai-provider.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { TextProcessingModule } from './modules/text-processing/text-processing.module';
import { ResearchModule } from './modules/research/research.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRoot([{
      ttl: 60,
      limit: 10,
    }]),    
    AIProviderModule,
    TextProcessingModule,
    ResearchModule,
    FirecrawlModule,
  ],
})
export class AppModule {}


