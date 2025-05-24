import { IsString, IsNumber, IsArray, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResearchRequestDto {
  @ApiProperty({ description: 'Research query' })
  @IsString()
  query: string;

  @ApiPropertyOptional({ description: 'Research depth (1-5)', minimum: 1, maximum: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  depth?: number;

  @ApiPropertyOptional({ description: 'Research breadth (2-10)', minimum: 2, maximum: 10 })
  @IsOptional()
  @IsNumber()
  @Min(2)
  @Max(10)
  breadth?: number;

  @ApiPropertyOptional({ description: 'User answers to follow-up questions' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  answers?: string[];
}