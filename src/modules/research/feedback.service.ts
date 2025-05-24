import { Injectable } from '@nestjs/common';
import { generateObject } from 'ai';
import { z } from 'zod';
import { AIProviderService } from '../ai-provider/ai-provider.service';
import { ProfessionalQuestions } from './research.interface';
import { getSystemPrompt } from '../../prompt/system-prompt';


@Injectable()
export class FeedbackService {
  constructor(private readonly aiProvider: AIProviderService) {}

  async buildProfessionalQuestions(query: string): Promise<ProfessionalQuestions> {
    const res = await generateObject({
      model: this.aiProvider.getModel(),
      system: getSystemPrompt(),
      prompt: `
با توجه به نیاز زیر، دقیقاً 3 سؤال طراحی کن که:

1. موضوع را شفاف‌تر کند و کمک کند کاربر دقیق‌تر توضیح دهد دنبال چه اطلاعاتی‌ست
2. به کاربرد و هدف کاربر از تحقیق اشاره کند (مثلاً برای مقاله، تصمیم‌گیری، درمان، یادگیری و ...)
3. به اولویت‌های کاربر اشاره کند (چه چیزی برای او مهم‌تر است)

ویژگی سؤالات:
- قابل فهم برای عموم باشد، ولی دقیق و هدفمند هم باشد
- نه خیلی ساده، نه خیلی تخصصی
- زبان محترمانه، حرفه‌ای و کمی دوستانه
- طوری طراحی شود که هم برای دانش‌آموز، هم برای پزشک، یا محقق مناسب باشد
- کاربر را به ارائه پاسخ‌های مفید راهنمایی کند

<query>${query}</query>`,
      schema: z.object({
        questions: z.array(
          z.object({
            question: z.string().describe('متن سؤال'),
            purpose: z.string().describe('هدف از طرح این سؤال'),
            expectedInsight: z.string().describe('بینشی که از پاسخ به‌دست می‌آید'),
          })
        ).length(3),
        researchCategory: z.enum([
          'technical_deep',
          'market_analysis', 
          'academic_research',
          'strategic_planning',
          'general_inquiry'
        ]).describe('دسته‌بندی نوع تحقیق'),
      }),
    });

    const formatted = res.object.questions
      .map((q, i) => `${i + 1}. ${q.question}`)
      .join('\n');

    return {
      questions: res.object.questions.map(q => q.question),
      formatted,
    };
  }

  async analyzeAnswerQuality(
    questions: string[],
    answers: string[]
  ): Promise<{
    quality: 'low' | 'medium' | 'high';
    suggestions?: string[];
  }> {
    const analysis = await generateObject({
      model: this.aiProvider.getModel(),
      system: getSystemPrompt(),
      prompt: `
ارزیابی کیفیت پاسخ‌های زیر به سؤالات تحقیقاتی:

سؤالات:
${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

پاسخ‌ها:
${answers.map((a, i) => `${i + 1}. ${a}`).join('\n')}

کیفیت کلی را ارزیابی کن و در صورت نیاز، چند پیشنهاد برای بهبود ارائه بده.
`,
      schema: z.object({
        quality: z.enum(['low', 'medium', 'high']),
        completeness: z.number().min(0).max(100),
        suggestions: z.array(z.string()).optional(),
        missingAspects: z.array(z.string()).optional(),
      }),
    });

    return {
      quality: analysis.object.quality,
      suggestions: analysis.object.suggestions,
    };
  }
}
