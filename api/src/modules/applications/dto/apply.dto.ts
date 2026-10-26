import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Equals, IsOptional, IsString, MaxLength } from 'class-validator';

export class ApplyDto {
  @ApiProperty({ description: 'Must be true; records IP terms acceptance (A2).' })
  @Equals(true)
  termsAccepted!: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}
