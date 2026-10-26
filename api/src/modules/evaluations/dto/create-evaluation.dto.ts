import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsString, Max, Min, MinLength } from 'class-validator';
import { EvaluationOutcome } from '../../../common/enums/index.js';

export class CreateEvaluationDto {
  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  score!: number;

  @ApiProperty({ description: 'Shown to the graduate.' })
  @IsString()
  @MinLength(1)
  feedback!: string;

  @ApiProperty({ enum: EvaluationOutcome })
  @IsEnum(EvaluationOutcome)
  outcome!: EvaluationOutcome;
}
