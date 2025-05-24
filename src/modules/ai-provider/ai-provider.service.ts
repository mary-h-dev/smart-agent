import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createFireworks } from '@ai-sdk/fireworks';
import { createOpenAI } from '@ai-sdk/openai';
import {
  extractReasoningMiddleware,
  LanguageModelV1,
  wrapLanguageModel,
} from 'ai';
import { getEncoding } from 'js-tiktoken';
import { IAIProviderService } from './ai-provider.interface';
import { AIProvider } from './enums/ai-provider.enum';
import { TextSplitterService } from '../text-processing/text-splitter.service';

@Injectable()
export class AIProviderService implements IAIProviderService {
  private readonly models: Partial<Record<AIProvider, LanguageModelV1>>;
  private readonly encoder = getEncoding('o200k_base');
  private readonly MinChunkSize = 140;

  constructor(
    private readonly configService: ConfigService,
    private readonly textSplitter: TextSplitterService,
  ) {
    this.models = this.initializeModels();
  }

  private initializeModels(): Partial<Record<AIProvider, LanguageModelV1>> {
    const models: Partial<Record<AIProvider, LanguageModelV1>> = {};

    // OpenAI
    const openaiConfig = this.configService.get('ai.openai');
    if (openaiConfig?.apiKey) {
      const openai = createOpenAI({
        apiKey: openaiConfig.apiKey,
        baseURL: openaiConfig.endpoint,
      });
      models[AIProvider.OPENAI] = openai('o3-mini', {
        reasoningEffort: 'medium',
        structuredOutputs: true,
      });
    }

    // Anthropic
    const anthropicConfig = this.configService.get('ai.anthropic');
    if (anthropicConfig?.apiKey) {
      const anthropic = createAnthropic({ apiKey: anthropicConfig.apiKey });
      models[AIProvider.ANTHROPIC] = anthropic('claude-3-haiku-20240307') as LanguageModelV1;
    }

    // Fireworks
    // const fireworksConfig = this.configService.get('ai.fireworks');
    // if (fireworksConfig?.apiKey) {
    //   const fireworks = createFireworks({ apiKey: fireworksConfig.apiKey });
    //   models[AIProvider.FIREWORKS] = wrapLanguageModel({
    //     model: fireworks('accounts/fireworks/models/deepseek-r1') as LanguageModelV1,
    //     middleware: extractReasoningMiddleware({ tagName: 'think' }),
    //   });
    // }

    return models;
  }

  getModel(): LanguageModelV1 {
    const customModelId = this.configService.get<string>('ai.customModel');
    const preferredProvider = this.configService.get<AIProvider>('ai.provider');

    if (customModelId && this.models[AIProvider.OPENAI]) {
      const openai = createOpenAI({
        apiKey: this.configService.get('ai.openai.apiKey'),
        baseURL: this.configService.get('ai.openai.endpoint'),
      });
      return openai(customModelId, { structuredOutputs: true });
    }

    const selected = this.models[preferredProvider];
    if (selected) return selected;

    const fallback = Object.values(this.models).find(Boolean);
    if (!fallback) {
      throw new Error('❌ No available LLM provider configured');
    }
    return fallback;
  }

  trimPrompt(prompt: string, contextSize?: number): string {
    if (!prompt) return '';
    
    const maxContextSize = contextSize || this.configService.get<number>('ai.contextSize');
    const length = this.encoder.encode(prompt).length;
    
    if (length <= maxContextSize) return prompt;

    const overflowTokens = length - maxContextSize;
    const chunkSize = prompt.length - overflowTokens * 3;
    
    if (chunkSize < this.MinChunkSize) {
      return prompt.slice(0, this.MinChunkSize);
    }

    const chunks = this.textSplitter.splitText(prompt, {
      chunkSize,
      chunkOverlap: 0,
    });
    
    const trimmedPrompt = chunks[0] ?? '';

    if (trimmedPrompt.length === prompt.length) {
      return this.trimPrompt(prompt.slice(0, chunkSize), maxContextSize);
    }

    return this.trimPrompt(trimmedPrompt, maxContextSize);
  }
}