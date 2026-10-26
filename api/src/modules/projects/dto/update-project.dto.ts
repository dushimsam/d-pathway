import { PartialType } from '@nestjs/swagger';
import { CreateProjectDto } from './create-project.dto.js';

/** All create fields, each optional. Editable only while DRAFT (P2, P-LOCK). */
export class UpdateProjectDto extends PartialType(CreateProjectDto) {}
