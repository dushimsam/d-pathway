import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { EvaluationOutcome, PrizeStatus } from '../../../common/enums/index.js';
import { paginate, type PaginatedResult } from '../../../common/dto/pagination-query.dto.js';
import { Graduate } from '../../graduates/entities/graduate.entity.js';
import { Evaluation } from '../../evaluations/entities/evaluation.entity.js';
import { Project } from '../../projects/entities/project.entity.js';

export interface TalentStats {
  briefsCompleted: number;
  avgScore: number; // 0 when none
  interviewsSelected: number;
  prizesWon: number;
  prizeTotal: number;
}

@Injectable()
export class TalentService {
  constructor(
    @InjectRepository(Graduate) private readonly graduates: Repository<Graduate>,
    @InjectRepository(Evaluation) private readonly evaluations: Repository<Evaluation>,
    @InjectRepository(Project) private readonly projects: Repository<Project>,
  ) {}

  /** Company-facing talent search; filter by skill, each row carries real stats. */
  async search(params: {
    skill?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResult<unknown>> {
    const page = params.page && params.page > 0 ? params.page : 1;
    const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : 12;

    const qb = this.graduates
      .createQueryBuilder('g')
      .orderBy('g.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);
    if (params.skill) {
      qb.where(':skill = ANY(g.skills)', { skill: params.skill.trim().toLowerCase() });
    }
    const [rows, total] = await qb.getManyAndCount();

    const ids = rows.map((g) => g.id);
    const statsById = await this.statsFor(ids);

    const items = rows.map((g) => ({
      id: g.id,
      fullName: g.fullName,
      education: g.education,
      location: g.location,
      skills: g.skills,
      photoUrl: g.photoUrl,
      stats: statsById.get(g.id) ?? emptyStats(),
    }));
    return paginate(items, total, page, pageSize);
  }

  /** Rich student profile: identity, aggregate stats, and scored work history. */
  async profile(graduateId: string): Promise<unknown> {
    const g = await this.graduates.findOne({ where: { id: graduateId } });
    if (!g) throw new NotFoundException('Student not found.');

    const history = await this.evaluations
      .createQueryBuilder('e')
      .innerJoin('e.deliverable', 'd')
      .innerJoin('d.application', 'a')
      .innerJoin('a.project', 'p')
      .innerJoin('p.company', 'c')
      .where('a.graduate_id = :gid', { gid: graduateId })
      .select('p.id', 'projectId')
      .addSelect('p.title', 'projectTitle')
      .addSelect('c.id', 'companyId')
      .addSelect('c.name', 'companyName')
      .addSelect('e.score', 'score')
      .addSelect('e.outcome', 'outcome')
      .addSelect('e.evaluated_at', 'evaluatedAt')
      .orderBy('e.evaluated_at', 'DESC')
      .getRawMany();

    const stats = (await this.statsFor([graduateId])).get(graduateId) ?? emptyStats();

    return {
      id: g.id,
      fullName: g.fullName,
      education: g.education,
      location: g.location,
      skills: g.skills,
      links: g.links,
      photoUrl: g.photoUrl,
      stats,
      history: history.map((h) => ({
        projectId: h.projectId,
        projectTitle: h.projectTitle,
        companyId: h.companyId,
        companyName: h.companyName,
        score: Number(h.score),
        outcome: h.outcome,
        evaluatedAt: h.evaluatedAt,
      })),
    };
  }

  /** Aggregate stats for a set of graduate ids in two grouped queries. */
  private async statsFor(ids: string[]): Promise<Map<string, TalentStats>> {
    const map = new Map<string, TalentStats>();
    if (ids.length === 0) return map;

    const evalRows = await this.evaluations
      .createQueryBuilder('e')
      .innerJoin('e.deliverable', 'd')
      .innerJoin('d.application', 'a')
      .where('a.graduate_id IN (:...ids)', { ids })
      .select('a.graduate_id', 'gid')
      .addSelect('COUNT(e.id)', 'completed')
      .addSelect('AVG(e.score)', 'avg')
      .addSelect(
        `SUM(CASE WHEN e.outcome = :sel THEN 1 ELSE 0 END)`,
        'selected',
      )
      .setParameter('sel', EvaluationOutcome.SELECTED_FOR_INTERVIEW)
      .groupBy('a.graduate_id')
      .getRawMany();

    const prizeRows = await this.projects
      .createQueryBuilder('p')
      .where('p.winner_graduate_id IN (:...ids)', { ids })
      .andWhere('p.prize_status = :rel', { rel: PrizeStatus.RELEASED })
      .select('p.winner_graduate_id', 'gid')
      .addSelect('COUNT(p.id)', 'wins')
      .addSelect('COALESCE(SUM(p.prize_amount), 0)', 'total')
      .groupBy('p.winner_graduate_id')
      .getRawMany();

    for (const id of ids) map.set(id, emptyStats());
    for (const r of evalRows) {
      const s = map.get(r.gid)!;
      s.briefsCompleted = Number(r.completed);
      s.avgScore = r.avg ? Math.round(Number(r.avg) * 10) / 10 : 0;
      s.interviewsSelected = Number(r.selected);
    }
    for (const r of prizeRows) {
      const s = map.get(r.gid)!;
      s.prizesWon = Number(r.wins);
      s.prizeTotal = Number(r.total);
    }
    return map;
  }
}

function emptyStats(): TalentStats {
  return {
    briefsCompleted: 0,
    avgScore: 0,
    interviewsSelected: 0,
    prizesWon: 0,
    prizeTotal: 0,
  };
}
