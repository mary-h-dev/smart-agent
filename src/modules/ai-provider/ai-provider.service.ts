import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';
import { createOpenAI } from '@ai-sdk/openai';
import { getEncoding } from 'js-tiktoken';
import { LanguageModelV1 } from 'ai';
import { AIProvider } from './enums/ai-provider.enum';
import { IAIProviderService } from './ai-provider.interface';

@Injectable()
export class AIProviderService implements IAIProviderService {
  private readonly encoder = getEncoding('o200k_base');
  private readonly MinChunkSize = 140;
  private readonly models: Partial<Record<AIProvider, LanguageModelV1>>;

  constructor(private readonly configService: ConfigService) {
    this.models = this.initializeModels();
  }

  private initializeModels(): Partial<Record<AIProvider, LanguageModelV1>> {
    const models: Partial<Record<AIProvider, LanguageModelV1>> = {};

    const openaiKey = this.configService.get<string>('ai.openai.apiKey');
    const openaiEndpoint = this.configService.get<string>('ai.openai.endpoint');
    if (openaiKey) {
      const openai = createOpenAI({ apiKey: openaiKey, baseURL: openaiEndpoint });
      models[AIProvider.OPENAI] = openai('gpt-4o');
    }

    const anthropicKey = this.configService.get<string>('ai.anthropic.apiKey');
    if (anthropicKey) {
      const anthropic = createAnthropic({ apiKey: anthropicKey });
      models[AIProvider.ANTHROPIC] = anthropic('claude-3-haiku-20240307');
    }

    const googleKey = this.configService.get<string>('ai.google.apiKey');
    if (googleKey) {
      const google = createGoogleGenerativeAI({ apiKey: googleKey });
      models[AIProvider.GOOGLE] = google('models/gemini-pro');
    }

    const groqKey = this.configService.get<string>('ai.groq.apiKey');
    if (groqKey) {
      const groq = createGroq({ apiKey: groqKey });
      models[AIProvider.GROQ] = groq('mixtral-8x7b-32768');
    }

    return models;
  }

  getModel(): LanguageModelV1 {
    const provider = this.configService.get<AIProvider>('ai.provider') ?? AIProvider.OPENAI;
    const model = this.models[provider];

    if (!model) throw new Error(`❌ No LLM model configured for provider "${provider}"`);
    return model;
  }

  trimPrompt(prompt: string, contextSize?: number): string {
    const maxContextSize = contextSize ?? this.configService.get<number>('ai.contextSize') ?? 128000;
    const length = this.encoder.encode(prompt).length;

    if (length <= maxContextSize) return prompt;

    const overflow = length - maxContextSize;
    const safeLength = prompt.length - overflow * 3;

    return prompt.slice(0, Math.max(safeLength, this.MinChunkSize));
  }
}
