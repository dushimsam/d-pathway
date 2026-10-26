import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength } from 'class-validator';

export class SignUploadDto {
  @ApiProperty({ description: 'Cloudinary folder, e.g. "deliverables".' })
  @IsString()
  @MaxLength(128)
  @Matches(/^[a-zA-Z0-9/_-]+$/, {
    message: 'folder may contain only letters, numbers, slashes, dashes and underscores',
  })
  folder!: string;
}
