import { Controller, Post, Body, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ResearchService } from './research.service';
import { ResearchRequestDto } from './dto/research-request.dto';
import { ResearchResponseDto, QuestionResponseDto } from './dto/research-response.dto';

@ApiTags('research')
@Controller('api/research')
@UseGuards(ThrottlerGuard)
export class ResearchController {
  constructor(private readonly researchService: ResearchService) {}

  @Post()
  @ApiOperation({ summary: 'Process research request' })
  @ApiResponse({ status: 200, type: ResearchResponseDto })
  @ApiResponse({ status: 200, description: 'Follow-up questions needed', type: QuestionResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async research(@Body() dto: ResearchRequestDto) {
    try {
      if (!dto.query) {
        throw new HttpException('missing_query', HttpStatus.BAD_REQUEST);
      }

      const result = await this.researchService.processResearch(
        dto.query,
        dto.depth,
        dto.breadth,
        dto.answers,
      );

      return result;
    } catch (error) {
      console.error('❌ خطا:', error);

      if (error instanceof HttpException) throw error;

      throw new HttpException(
        {
          error: 'server_error',
          message: error.message ?? String(error),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
