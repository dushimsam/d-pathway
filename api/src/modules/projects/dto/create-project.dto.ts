import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { DeliverableFormat } from '../../../common/enums/index.js';

export class CreateProjectDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  brief!: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  requiredSkills!: string[];

  @ApiProperty({ description: 'ISO 8601 timestamp' })
  @IsDateString()
  applicationDeadline!: string;

  @ApiProperty({ description: 'ISO 8601 timestamp, after applicationDeadline' })
  @IsDateString()
  submissionDeadline!: string;

  @ApiProperty({ enum: DeliverableFormat })
  @IsEnum(DeliverableFormat)
  deliverableFormat!: DeliverableFormat;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  ipTerms!: string;

  @ApiPropertyOptional({ description: 'Optional cash prize amount; omit for no prize.' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100_000_000)
  prizeAmount?: number;

  @ApiPropertyOptional({ description: 'Prize currency, default RWF.', default: 'RWF' })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  prizeCurrency?: string;
}
