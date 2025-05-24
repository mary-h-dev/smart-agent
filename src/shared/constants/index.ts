export const RESEARCH_CONSTANTS = {
    MAX_DEPTH: 5,
    MIN_DEPTH: 1,
    MAX_BREADTH: 10,
    MIN_BREADTH: 2,
    DEFAULT_DEPTH: 2,
    DEFAULT_BREADTH: 4,
    MAX_RETRIES: 3,
    REQUEST_TIMEOUT: 60000,
    CHUNK_SIZE_DEFAULT: 1000,
    CHUNK_OVERLAP_DEFAULT: 200,
  } as const;
  
  export const FILE_CONSTANTS = {
    OUTPUT_DIR: 'outputs',
    REPORTS_DIR: 'outputs/reports',
    LOGS_DIR: 'outputs/logs',
    LEARNINGS_DIR: 'outputs/learnings',
  } as const;
  
  export const ERROR_MESSAGES = {
    MISSING_QUERY: 'Query is required',
    INVALID_DEPTH: 'Depth must be between 1 and 5',
    INVALID_BREADTH: 'Breadth must be between 2 and 10',
    NO_AI_PROVIDER: 'No AI provider configured',
    FIRECRAWL_ERROR: 'Error fetching search results',
  } as const;