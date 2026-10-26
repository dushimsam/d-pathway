import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class DeclineDto {
  @ApiProperty({ description: 'Shown to the graduate (A6).' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  reason!: string;
}
