import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PathwayStatus } from '../../../common/enums/pathway-status.enum.js';
import { Pathway } from '../entities/pathway.entity.js';
import { CreatePathwayDto } from '../dto/create-pathway.dto.js';
import { UpdatePathwayDto } from '../dto/update-pathway.dto.js';
import { PathwayResponseDto } from '../dto/pathway-response.dto.js';

@Injectable()
export class PathwaysService {
  constructor(
    @InjectRepository(Pathway)
    private readonly pathwaysRepository: Repository<Pathway>,
  ) {}

  async create(dto: CreatePathwayDto): Promise<PathwayResponseDto> {
    const pathway = this.pathwaysRepository.create({
      ...dto,
      status: PathwayStatus.DRAFT,
    });
    const saved = await this.pathwaysRepository.save(pathway);
    return new PathwayResponseDto(saved);
  }

  async findAll(status?: PathwayStatus): Promise<PathwayResponseDto[]> {
    const pathways = await this.pathwaysRepository.find({
      where: status ? { status } : {},
      order: { createdAt: 'DESC' },
    });
    return pathways.map((pathway) => new PathwayResponseDto(pathway));
  }

  async findOne(id: string): Promise<PathwayResponseDto> {
    const pathway = await this.getOrFail(id);
    return new PathwayResponseDto(pathway);
  }

  async update(id: string, dto: UpdatePathwayDto): Promise<PathwayResponseDto> {
    const pathway = await this.getOrFail(id);
    if (pathway.status === PathwayStatus.PUBLISHED) {
      throw new ConflictException('A published pathway cannot be edited');
    }
    Object.assign(pathway, dto);
    const saved = await this.pathwaysRepository.save(pathway);
    return new PathwayResponseDto(saved);
  }

  async publish(id: string): Promise<PathwayResponseDto> {
    const pathway = await this.getOrFail(id);
    if (pathway.status === PathwayStatus.PUBLISHED) {
      throw new ConflictException('Pathway is already published');
    }
    pathway.status = PathwayStatus.PUBLISHED;
    pathway.publishedAt = new Date();
    const saved = await this.pathwaysRepository.save(pathway);
    return new PathwayResponseDto(saved);
  }

  async remove(id: string): Promise<void> {
    const pathway = await this.getOrFail(id);
    await this.pathwaysRepository.softRemove(pathway);
  }

  private async getOrFail(id: string): Promise<Pathway> {
    const pathway = await this.pathwaysRepository.findOne({ where: { id } });
    if (!pathway) {
      throw new NotFoundException(`Pathway ${id} not found`);
    }
    return pathway;
  }
}
