import { Module, Global } from '@nestjs/common';
import { TextSplitterService } from './text-splitter.service';

@Global()
@Module({
  providers: [TextSplitterService],
  exports: [TextSplitterService],
})
export class TextProcessingModule {}
