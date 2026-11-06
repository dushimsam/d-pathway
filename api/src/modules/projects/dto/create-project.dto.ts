import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { DeliverableFormat } from '../../../common/enums/index.js';
import { MaxWords } from '../../../common/validators/max-words.validator.js';

/** IP terms cap, kept in step with the web schema (schemas.ts). */
export const IP_TERMS_MAX_WORDS = 500;

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

  @ApiProperty({ description: `Up to ${IP_TERMS_MAX_WORDS} words.` })
  @IsString()
  @MinLength(1)
  // Generous character ceiling as an abuse guard; the word cap is the real limit.
  @MaxLength(20000)
  @MaxWords(IP_TERMS_MAX_WORDS)
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

  @ApiPropertyOptional({ description: 'Cover photo URL (Cloudinary or hosted).' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  coverImageUrl?: string;

  @ApiPropertyOptional({ description: 'Cover photo Cloudinary public id.' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  coverImagePublicId?: string;
}
