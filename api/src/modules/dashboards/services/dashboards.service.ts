import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ApplicationStatus,
  EvaluationOutcome,
  ProjectStatus,
} from '../../../common/enums/index.js';
import { ApplicationsService } from '../../applications/services/applications.service.js';
import { ProjectsService } from '../../projects/services/projects.service.js';
import { CompaniesService } from '../../companies/services/companies.service.js';
import { Deliverable } from '../../deliverables/entities/deliverable.entity.js';
import { Evaluation } from '../../evaluations/entities/evaluation.entity.js';

@Injectable()
export class DashboardsService {
  constructor(
    @InjectRepository(Deliverable)
    private readonly deliverables: Repository<Deliverable>,
    @InjectRepository(Evaluation)
    private readonly evaluations: Repository<Evaluation>,
    private readonly applications: ApplicationsService,
    private readonly projects: ProjectsService,
    private readonly companies: CompaniesService,
  ) {}

  /** Graduate dashboard: applications by status, evaluations, invitations. */
  async graduate(userId: string): Promise<unknown> {
    const apps = (await this.applications.listMine(userId)) as Array<{
      status: ApplicationStatus;
      project: { title: string; company: { name: string } };
      evaluation: {
        score: number;
        outcome: EvaluationOutcome;
        feedback: string;
        evaluatedAt: Date;
      } | null;
    }>;

    const applicationsByStatus = DashboardsService.tally(
      apps.map((a) => a.status),
      Object.values(ApplicationStatus),
    );

    const evaluations = apps
      .filter((a) => a.evaluation)
      .map((a) => ({
        projectTitle: a.project.title,
        companyName: a.project.company.name,
        score: a.evaluation!.score,
        outcome: a.evaluation!.outcome,
        feedback: a.evaluation!.feedback,
        evaluatedAt: a.evaluation!.evaluatedAt,
      }));

    const invitations = evaluations.filter(
      (e) => e.outcome === EvaluationOutcome.SELECTED_FOR_INTERVIEW,
    );

    return {
      applicationsByStatus,
      applications: apps,
      evaluations,
      invitations,
    };
  }

  /** Company dashboard: projects by status, review load, evaluation load, invitations. */
  async company(userId: string): Promise<unknown> {
    const company = await this.companies.getByUserIdOrThrow(userId);
    const projects = (await this.projects.listMine(userId)) as Array<{
      status: ProjectStatus;
      applicationCounts: Record<string, number>;
    }>;

    const projectsByStatus = DashboardsService.tally(
      projects.map((p) => p.status),
      Object.values(ProjectStatus),
    );
    const pendingApplications = projects.reduce(
      (sum, p) => sum + (p.applicationCounts[ApplicationStatus.PENDING] ?? 0),
      0,
    );

    const awaitingEvaluation = await this.deliverables
      .createQueryBuilder('d')
      .innerJoin('d.application', 'app')
      .innerJoin('app.project', 'project')
      .innerJoin('app.graduate', 'graduate')
      .leftJoin(Evaluation, 'e', 'e.deliverableId = d.id')
      .where('project.companyId = :cid', { cid: company.id })
      .andWhere('e.id IS NULL')
      .select('d.id', 'deliverableId')
      .addSelect('d.submittedAt', 'submittedAt')
      .addSelect('project.id', 'projectId')
      .addSelect('project.title', 'projectTitle')
      .addSelect('graduate.fullName', 'graduateName')
      .orderBy('d.submittedAt', 'ASC')
      .getRawMany<{
        deliverableId: string;
        submittedAt: Date;
        projectId: string;
        projectTitle: string;
        graduateName: string;
      }>();

    const invitationsIssued = await this.evaluations
      .createQueryBuilder('e')
      .innerJoin('e.deliverable', 'd')
      .innerJoin('d.application', 'app')
      .innerJoin('app.project', 'project')
      .where('project.companyId = :cid', { cid: company.id })
      .andWhere('e.outcome = :o', {
        o: EvaluationOutcome.SELECTED_FOR_INTERVIEW,
      })
      .getCount();

    return {
      projects,
      summary: {
        projectsByStatus,
        pendingApplications,
        deliverablesAwaitingEvaluation: awaitingEvaluation.length,
        invitationsIssued,
      },
      awaitingEvaluation,
    };
  }

  private static tally(values: string[], keys: string[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const key of keys) counts[key] = 0;
    for (const value of values) counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }
}
