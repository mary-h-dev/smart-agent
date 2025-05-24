import { ApiProperty } from '@nestjs/swagger';

export class QuestionResponseDto {
  @ApiProperty()
  needFollowUp: boolean;

  @ApiProperty({ type: [String] })
  questions: string[];

  @ApiProperty()
  questionsFormatted: string;
}

export class LearningDto {
  @ApiProperty()
  fact: string;

  @ApiProperty({ type: [Object] })
  sources: Array<{
    url: string;
    domain: string;
  }>;
}

export class ResearchParametersDto {
  @ApiProperty()
  depth: number;

  @ApiProperty()
  breadth: number;

  @ApiProperty()
  reasoning: string;
}

export class ResearchFilesDto {
  @ApiProperty()
  report: string;

  @ApiProperty()
  progress: string;

  @ApiProperty()
  learnings: string;

  @ApiProperty()
  answer: string;

  @ApiProperty()
  urls: string;
}

export class ResearchResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  report: string;

  @ApiProperty()
  answer: string;

  @ApiProperty({ type: ResearchParametersDto })
  parameters: ResearchParametersDto;

  @ApiProperty({ type: [LearningDto] })
  learnings: LearningDto[];

  @ApiProperty()
  visitedUrls: number;

  @ApiProperty({ type: ResearchFilesDto })
  files: ResearchFilesDto;
}