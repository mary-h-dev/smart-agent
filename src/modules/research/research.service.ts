import { Injectable, Logger } from '@nestjs/common';
import { generateObject } from 'ai';
import { z } from 'zod';
import * as fs from 'fs/promises';
import { AIProviderService } from '../ai-provider/ai-provider.service';
import { DeepResearchService } from './deep-research.service';
import { FeedbackService } from './feedback.service';
import { EstimationResult } from './research.interface';
import { getSystemPrompt } from '../../prompt/system-prompt';



@Injectable()
export class ResearchService {
  private readonly logger = new Logger(ResearchService.name);

  constructor(
    private readonly aiProvider: AIProviderService,
    private readonly deepResearch: DeepResearchService,
    private readonly feedback: FeedbackService,
  ) {}

  async estimateResearchParameters(
    query: string,
    answers: string[],
  ): Promise<EstimationResult> {
    const combinedContext = `
سؤال اصلی: ${query}

پاسخ‌های کاربر:
${answers.map((a, i) => `${i + 1}. ${a}`).join('\n')}
`;

    const estimation = await generateObject({
      model: this.aiProvider.getModel(),
      system: getSystemPrompt(),
      prompt: `
بر اساس سؤال و پاسخ‌های زیر، پیچیدگی موضوع و پارامترهای مناسب برای تحقیق عمیق را تعیین کن.

${combinedContext}

معیارهای تصمیم‌گیری:
- DEPTH (1-5): عمق تحقیق - هرچه موضوع تخصصی‌تر و نیاز به جزئیات بیشتر، عمق بالاتر
  * 1: سؤال ساده و سطحی
  * 2: نیاز به اطلاعات متوسط
  * 3: موضوع نسبتاً پیچیده
  * 4: موضوع بسیار تخصصی
  * 5: تحقیق بسیار عمیق و جامع

- BREADTH (2-10): گستردگی تحقیق - هرچه موضوع چندوجهی‌تر، گستردگی بالاتر
  * 2-3: موضوع محدود و متمرکز
  * 4-6: موضوع با چند جنبه مرتبط
  * 7-8: موضوع چندرشته‌ای
  * 9-10: موضوع بسیار گسترده با ابعاد متعدد

با توجه به:
1. میزان تخصصی بودن موضوع
2. وسعت دامنه سؤال
3. جزئیات درخواستی در پاسخ‌ها
4. اهمیت و حساسیت موضوع

پارامترهای بهینه را تعیین کن.`,
      schema: z.object({
        depth: z.number().min(1).max(5),
        breadth: z.number().min(2).max(10),
        reasoning: z.string(),
        complexity: z.enum(['low', 'medium', 'high', 'very_high']),
        researchScope: z.array(z.string()),
      }),
    });

    this.logger.log('🎯 تخمین پارامترها:', estimation.object);
    return estimation.object;
  }

  async processResearch(
    query: string,
    depth?: number,
    breadth?: number,
    answers?: string[],
  ): Promise<any> {
    if (!Array.isArray(answers)) {
      this.logger.log('🔍 تولید سؤالات حرفه‌ای برای:', query);
      const questions = await this.feedback.buildProfessionalQuestions(query);
      return {
        needFollowUp: true,
        questions: questions.questions,
        questionsFormatted: questions.formatted,
      };
    }

    this.logger.log('📊 تحلیل پاسخ‌ها و تخمین پارامترها...');
    const params = await this.estimateResearchParameters(query, answers);
    const finalDepth = depth ?? params.depth;
    const finalBreadth = breadth ?? params.breadth;

    this.logger.log(`🎯 پارامترهای نهایی: Depth=${finalDepth}, Breadth=${finalBreadth}`);
    this.logger.log(`📝 دلیل: ${params.reasoning}`);

    const combinedPrompt = `
پرسش اصلی: ${query}

پاسخ‌های تفصیلی کاربر:
${answers.map((a, i) => `${i + 1}. ${a}`).join('\n')}

پارامترهای تحقیق: عمق=${finalDepth}, گستردگی=${finalBreadth}`;

    const progressLog: string[] = [];
    progressLog.push(`تخمین پارامترها: ${params.reasoning}`);
    progressLog.push(`Depth: ${finalDepth}, Breadth: ${finalBreadth}`);

    this.logger.log('🚀 شروع تحقیق عمیق...');

    const { learnings, visitedUrls } = await this.deepResearch.deepResearch({
      query: combinedPrompt,
      depth: finalDepth,
      breadth: finalBreadth,
      onProgress: p => {
        const msg = `Progress: D${p.currentDepth}/${p.totalDepth} B${p.currentBreadth}/${p.totalBreadth} [${p.completedQueries}/${p.totalQueries}] \"${p.currentQuery}\"`;
        this.logger.log(msg);
        progressLog.push(msg);
      },
    });

    this.logger.log('📄 تولید گزارش نهایی...');

    const report = await this.deepResearch.writeFinalReport({
      prompt: combinedPrompt,
      learnings,
      visitedUrls,
    });

    const answer = await this.deepResearch.writeFinalAnswer({
      prompt: combinedPrompt,
      learnings,
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFilename = `report_${timestamp}.md`;
    const progressFilename = `progress_${timestamp}.log`;
    const learningsFilename = `learnings_${timestamp}.json`;
    const answerFilename = `answer_${timestamp}.md`;
    const urlsFilename = `visited_${timestamp}.txt`;

    await fs.writeFile(reportFilename, report);
    await fs.writeFile(progressFilename, progressLog.join('\n'));
    await fs.writeFile(answerFilename, answer);
    await fs.writeFile(urlsFilename, visitedUrls.join('\n'));
    await fs.writeFile(
      learningsFilename,
      JSON.stringify(
        {
          query,
          answers,
          parameters: {
            depth: finalDepth,
            breadth: finalBreadth,
            reasoning: params.reasoning,
          },
          learnings: learnings.map(l => ({
            fact: l.learning,
            sources: l.sources,
          })),
          visitedUrls,
          timestamp,
        },
        null,
        2,
      ),
    );

    this.logger.log(`✅ فایل‌ها ذخیره شدند: ${reportFilename}, ${answerFilename}, ${urlsFilename}, ${progressFilename}, ${learningsFilename}`);

    return {
      success: true,
      report,
      answer,
      parameters: {
        depth: finalDepth,
        breadth: finalBreadth,
        reasoning: params.reasoning,
      },
      learnings: learnings.map(l => ({
        fact: l.learning,
        sources: l.sources.map(url => ({
          url,
          domain: new URL(url).hostname,
        })),
      })),
      visitedUrls: visitedUrls.length,
      files: {
        report: reportFilename,
        progress: progressFilename,
        learnings: learningsFilename,
        answer: answerFilename,
        urls: urlsFilename,
      },
    };
  }
}
