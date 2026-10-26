import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { UserRole } from '../../../common/enums/index.js';
import { UploadsService } from '../services/uploads.service.js';
import { SignUploadDto } from '../dto/sign-upload.dto.js';

@ApiTags('uploads')
@ApiBearerAuth()
@Roles(UserRole.GRADUATE)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @HttpCode(HttpStatus.OK)
  @Post('sign')
  sign(@Body() dto: SignUploadDto) {
    return this.uploads.sign(dto.folder);
  }
}
