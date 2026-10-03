import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { PathwayStatus } from '../../../common/enums/pathway-status.enum.js';
import { PathwaysService } from '../services/pathways.service.js';
import { CreatePathwayDto } from '../dto/create-pathway.dto.js';
import { UpdatePathwayDto } from '../dto/update-pathway.dto.js';
import { PathwayResponseDto } from '../dto/pathway-response.dto.js';

@ApiTags('pathways')
@Controller('pathways')
export class PathwaysController {
  constructor(private readonly pathwaysService: PathwaysService) {}

  // TODO: guard with JwtAuthGuard + RolesGuard(COMPANY) in the auth phase
  @Post()
  @ApiOperation({ summary: 'Create a pathway (starts as DRAFT)' })
  @ApiCreatedResponse({ type: PathwayResponseDto })
  create(@Body() dto: CreatePathwayDto): Promise<PathwayResponseDto> {
    return this.pathwaysService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List pathways, newest first' })
  @ApiQuery({ name: 'status', enum: PathwayStatus, required: false })
  @ApiOkResponse({ type: PathwayResponseDto, isArray: true })
  findAll(
    @Query('status') status?: PathwayStatus,
  ): Promise<PathwayResponseDto[]> {
    return this.pathwaysService.findAll(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single pathway' })
  @ApiOkResponse({ type: PathwayResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PathwayResponseDto> {
    return this.pathwaysService.findOne(id);
  }

  // TODO: guard with JwtAuthGuard + RolesGuard(COMPANY) in the auth phase
  @Patch(':id')
  @ApiOperation({ summary: 'Update a draft pathway (409 if published)' })
  @ApiOkResponse({ type: PathwayResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePathwayDto,
  ): Promise<PathwayResponseDto> {
    return this.pathwaysService.update(id, dto);
  }

  // TODO: guard with JwtAuthGuard + RolesGuard(COMPANY) in the auth phase
  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish a pathway (409 if already published)' })
  @ApiOkResponse({ type: PathwayResponseDto })
  publish(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PathwayResponseDto> {
    return this.pathwaysService.publish(id);
  }

  // TODO: guard with JwtAuthGuard + RolesGuard(COMPANY) in the auth phase
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a pathway' })
  @ApiNoContentResponse()
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.pathwaysService.remove(id);
  }
}
