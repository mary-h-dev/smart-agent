import { Module, Global } from '@nestjs/common';
import { AIProviderService } from './ai-provider.service';
import { TextProcessingModule } from '../text-processing/text-processing.module';

@Global()
@Module({
  imports: [TextProcessingModule],
  providers: [AIProviderService],
  exports: [AIProviderService],
})
export class AIProviderModule {}
