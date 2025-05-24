export default () => ({
  port: parseInt(process.env.PORT ?? '3051', 10),
  ai: {
    provider: process.env.AI_PROVIDER || 'openai',
    contextSize: parseInt(process.env.CONTEXT_SIZE ?? '128000', 10),
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      endpoint: process.env.OPENAI_ENDPOINT,
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
    },
    google: {
      apiKey: process.env.GOOGLE_API_KEY,
    },
    groq: {
      apiKey: process.env.GROQ_API_KEY,
    },
  },
  firecrawl: {
    apiKey: process.env.FIRECRAWL_KEY || '',
  },
});
