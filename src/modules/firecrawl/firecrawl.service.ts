import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import FirecrawlApp from '@mendable/firecrawl-js';

import {
  FirecrawlSearchOptions,
  FirecrawlSearchResult,
} from './firecrawl.interface';

@Injectable()
export class FirecrawlService {
  private readonly firecrawl: any;

  constructor(private readonly configService: ConfigService) {
    this.firecrawl = new FirecrawlApp({
      apiKey: this.configService.get<string>('firecrawl.apiKey') || '',
    });
  }

  async search(
    query: string,
    options: FirecrawlSearchOptions = {},
  ): Promise<FirecrawlSearchResult> {
    const defaultOptions: FirecrawlSearchOptions = {
      timeout: 15000,
      limit: 5,
      scrapeOptions: {
        formats: ['markdown'],
      },
    };

    const mergedOptions = { ...defaultOptions, ...options };
    return await this.firecrawl.search(query, mergedOptions);

}
}
