import { LanguageModelV1 } from 'ai';

export interface IAIProviderService {
  getModel(): LanguageModelV1;
  trimPrompt(prompt: string, contextSize?: number): string;
}
