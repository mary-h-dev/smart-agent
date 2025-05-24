import { Module, Global } from '@nestjs/common';
import { FirecrawlService } from './firecrawl.service';

@Global()
@Module({
  providers: [FirecrawlService],
  exports: [FirecrawlService],
})
export class FirecrawlModule {}
