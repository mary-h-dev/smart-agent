import { Injectable, Logger } from '@nestjs/common';
import { generateObject } from 'ai';
import { z } from 'zod';
import { compact } from 'lodash';
import pLimit from 'p-limit';
import { ConfigService } from '@nestjs/config';
import { AIProviderService } from '../ai-provider/ai-provider.service';
import { FirecrawlService } from '../firecrawl/firecrawl.service';
import {
  ResearchProgress,
  LearningWithSources,
  ResearchResult,
} from './research.interface';
import { getSystemPrompt } from '../../prompt/system-prompt';



@Injectable()
export class DeepResearchService {
  private readonly logger = new Logger(DeepResearchService.name);
  private readonly concurrencyLimit: number;

  constructor(
    private readonly aiProvider: AIProviderService,
    private readonly firecrawl: FirecrawlService,
    private readonly configService: ConfigService,
  ) {
    this.concurrencyLimit = this.configService.get<number>('firecrawl.concurrency') ?? 2;
  }

  async deepResearch({
    query,
    breadth,
    depth,
    learnings = [],
    visitedUrls = [],
    onProgress,
  }: {
    query: string;
    breadth: number;
    depth: number;
    learnings?: LearningWithSources[];
    visitedUrls?: string[];
    onProgress?: (p: ResearchProgress) => void;
  }): Promise<ResearchResult> {
    const progress: ResearchProgress = {
      currentDepth: depth,
      totalDepth: depth,
      currentBreadth: breadth,
      totalBreadth: breadth,
      totalQueries: 0,
      completedQueries: 0,
    };

    const report = (updates: Partial<ResearchProgress>) => {
      Object.assign(progress, updates);
      onProgress?.(progress);
    };

    const serpQueries = await this.generateSerpQueries({ query, numQueries: breadth, learnings });

    report({
      totalQueries: serpQueries.length,
      currentQuery: serpQueries[0]?.query,
    });

    const limit = pLimit(this.concurrencyLimit);
    const results = await Promise.all(
      serpQueries.map(sq =>
        limit(async () => {
          try {
            const result = await this.firecrawl.search(sq.query, {
              timeout: 15000,
              limit: 5,
            });

            const newUrls = compact(result.data.map(r => r.url));
            const newBreadth = Math.ceil(breadth / 2);
            const newDepth = depth - 1;

            const { learnings: fresh, followUpQuestions } =
              await this.processSerpResultWithSources({
                query: sq.query,
                result,
                numLearnings: newBreadth,
                numFollowUpQuestions: newBreadth,
              });

            let merged = this.mergeLearnings(learnings, fresh);
            const urls = [...new Set([...visitedUrls, ...newUrls])];

            if (newDepth > 0) {
              report({
                currentDepth: newDepth,
                currentBreadth: newBreadth,
                completedQueries: progress.completedQueries + 1,
              });

              const nextQuery = `Previous research goal: ${sq.researchGoal}\nFollow-up research directions:\n${followUpQuestions.join('\n')}`;

              const deeper = await this.deepResearch({
                query: nextQuery,
                breadth: newBreadth,
                depth: newDepth,
                learnings: merged,
                visitedUrls: urls,
                onProgress,
              });

              merged = this.mergeLearnings(merged, deeper.learnings);
              return { learnings: merged, visitedUrls: deeper.visitedUrls };
            }

            report({
              currentDepth: 0,
              completedQueries: progress.completedQueries + 1,
            });

            return { learnings: merged, visitedUrls: urls };
          } catch (error) {
            this.logger.error(`Error/timeout for query ${sq.query}`, error);
            return { learnings: [], visitedUrls: [] };
          }
        }),
      ),
    );

    const flatLearnings = results.reduce<LearningWithSources[]>(
      (acc, r) => this.mergeLearnings(acc, r.learnings),
      [],
    );
    const flatUrls = [...new Set(results.flatMap(r => r.visitedUrls))];
    return { learnings: flatLearnings, visitedUrls: flatUrls };
  }

  async writeFinalReport({
    prompt,
    learnings,
    visitedUrls,
  }: {
    prompt: string;
    learnings: LearningWithSources[];
    visitedUrls: string[];
  }): Promise<string> {
    const learningsMd = this.learningListToMarkdown(learnings);

    const enhancedPrompt = `
Write a comprehensive and well-structured research report based on the provided prompt and facts.

<prompt>${prompt}</prompt>

<facts>
${learningsMd}
</facts>

Instructions:
1. The report must be at least **800 words**.
2. Use a **clear and engaging tone**: simple language, but with scientific accuracy.
3. **Cite every fact** using the format: **Sources:** [domain](url).
4. Do **not invent** new information — use only the given facts.
5. Use a professional but friendly style.
6. Structure:
   - **Introduction** (~100 words)
   - **Main Body Sections**
   - **Conclusion** (~150 words)
7. Use **bold** key insights.
8. Avoid formal headers or page numbers — for digital reading.

The reader should **learn** from the report and **enjoy reading it**.
`;

    const ai = await generateObject({
      model: this.aiProvider.getModel(),
      system: getSystemPrompt(),
      prompt: this.aiProvider.trimPrompt(enhancedPrompt),
      schema: z.object({ reportMarkdown: z.string() }),
    });

    return [
      ai.object.reportMarkdown.trim(),
      '',
      '---',
      '## Raw Source URLs',
      '',
      visitedUrls.map(u => `- ${u}`).join('\n'),
    ].join('\n');
  }

  async writeFinalAnswer({
    prompt,
    learnings,
  }: {
    prompt: string;
    learnings: LearningWithSources[];
  }): Promise<string> {
    const urls = [...new Set(learnings.flatMap(l => l.sources))];

    const res = await generateObject({
      model: this.aiProvider.getModel(),
      system: getSystemPrompt(),
      prompt: this.aiProvider.trimPrompt(
        `Answer briefly using ONLY the facts below.\n<prompt>${prompt}</prompt>\n<facts>\n${this.learningListToMarkdown(learnings)}\n</facts>`,
      ),
      schema: z.object({ exactAnswer: z.string() }),
    });

    return `${res.object.exactAnswer.trim()}\n\n**Sources:** ${urls.map(u => `[${new URL(u).hostname}](${u})`).join(', ')}`;
  }

  private learningListToMarkdown(learnings: LearningWithSources[]): string {
    return learnings
      .map(
        l =>
          `- ${l.learning}  \n  **Sources:** ${l.sources.map(u => `[${new URL(u).hostname}](${u})`).join(', ')}`,
      )
      .join('\n');
  }

  private async generateSerpQueries({
    query,
    numQueries = 3,
    learnings,
  }: {
    query: string;
    numQueries?: number;
    learnings?: LearningWithSources[];
  }): Promise<{ query: string; researchGoal: string }[]> {
    const res = await generateObject({
      model: this.aiProvider.getModel(),
      system: getSystemPrompt(),
      prompt: `Generate up to ${numQueries} distinct SERP queries for: <prompt>${query}</prompt>${learnings?.length ? `\nExisting facts:\n${learnings.map(l => l.learning).join('\n')}` : ''}`,
      schema: z.object({
        queries: z
          .array(z.object({ query: z.string(), researchGoal: z.string() }))
          .max(numQueries),
      }),
    });
    return res.object.queries.map(q => ({
      query: q.query ?? '',
      researchGoal: q.researchGoal ?? ''
    }));
  }
  private async processSerpResultWithSources({
    query,
    result,
    numLearnings = 3,
    numFollowUpQuestions = 3,
  }: {
    query: string;
    result: any;
    numLearnings?: number;
    numFollowUpQuestions?: number;
  }): Promise<{ learnings: LearningWithSources[]; followUpQuestions: string[] }> {
    const items = compact(result.data);
    const contents = items.map(
      (it, i) =>
        `<content id="${i}" url="${it.url}">\n${this.aiProvider.trimPrompt(it.markdown ?? '', 25000)}\n</content>`,
    );

    const aiRes = await generateObject({
      model: this.aiProvider.getModel(),
      abortSignal: AbortSignal.timeout(60000),
      system: getSystemPrompt(),
      prompt: this.aiProvider.trimPrompt(
        `Analyse SERP results for <query>${query}</query>. Provide up to ${numLearnings} unique facts with id(s) of sources used.\n\n<contents>\n${contents.join('\n')}\n</contents>`,
      ),
      schema: z.object({
        learnings: z
          .array(z.object({ learning: z.string(), sources: z.array(z.number()) }))
          .max(numLearnings),
        followUpQuestions: z.array(z.string()).max(numFollowUpQuestions),
      }),
    });

    const learnings: LearningWithSources[] = aiRes.object.learnings.map(l => ({
      learning: l.learning.trim(),
      sources: l.sources.map(id => items[id]?.url).filter(Boolean) as string[],
    }));

    return { learnings, followUpQuestions: aiRes.object.followUpQuestions };
  }

  private mergeLearnings(
    a: LearningWithSources[],
    b: LearningWithSources[],
  ): LearningWithSources[] {
    const map = new Map<string, Set<string>>();
    const add = (l: LearningWithSources) => {
      const k = l.learning.trim();
      const set = map.get(k) ?? new Set<string>();
      l.sources.forEach(s => set.add(s));
      map.set(k, set);
    };
    [...a, ...b].forEach(add);
    return Array.from(map.entries()).map(([learning, s]) => ({
      learning,
      sources: [...s],
    }));
  }
}
