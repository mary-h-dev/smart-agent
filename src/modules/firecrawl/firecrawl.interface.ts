export interface FirecrawlSearchOptions {
    timeout?: number;
    limit?: number;
    scrapeOptions?: {
      formats?: string[];
    };
  }
  
  export interface FirecrawlSearchResult {
    data: Array<{
      url: string;
      markdown?: string;
      title?: string;
      description?: string;
    }>;
  }