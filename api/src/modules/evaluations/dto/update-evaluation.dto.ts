import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';
import { EvaluationOutcome } from '../../../common/enums/index.js';

/** Partial edit of an existing evaluation; at least one field is meaningful. */
export class UpdateEvaluationDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  score?: number;

  @ApiPropertyOptional({ description: 'Shown to the graduate.' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  feedback?: string;

  @ApiPropertyOptional({ enum: EvaluationOutcome })
  @IsOptional()
  @IsEnum(EvaluationOutcome)
  outcome?: EvaluationOutcome;
}
