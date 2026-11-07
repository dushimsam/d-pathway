import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class SaveBriefDto {
  @ApiProperty({ description: 'The project to bookmark.' })
  @IsUUID()
  projectId!: string;
}
