import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ApplicationStatus } from '../../../common/enums/index.js';
import { GraduatesService } from '../../graduates/services/graduates.service.js';
import { CompaniesService } from '../../companies/services/companies.service.js';
import { ProjectsService } from '../../projects/services/projects.service.js';
import { Deliverable } from '../../deliverables/entities/deliverable.entity.js';
import { Evaluation } from '../../evaluations/entities/evaluation.entity.js';
import { Application } from '../entities/application.entity.js';
import { ApplyDto } from '../dto/apply.dto.js';
import {
  assertBeforeApplicationDeadline,
  assertDeclineReason,
  assertPending,
  assertProjectOpen,
  assertTermsAccepted,
} from '../rules/application.rules.js';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private readonly applications: Repository<Application>,
    // Read-only enrichment of the graduate's applications list. Writes to these
    // tables go through their owning services.
    @InjectRepository(Deliverable)
    private readonly deliverables: Repository<Deliverable>,
    @InjectRepository(Evaluation)
    private readonly evaluations: Repository<Evaluation>,
    private readonly graduates: GraduatesService,
    private readonly companies: CompaniesService,
    private readonly projects: ProjectsService,
  ) {}

  async apply(userId: string, projectId: string, dto: ApplyDto): Promise<Application> {
    const graduate = await this.graduates.getByUserIdOrThrow(userId);
    const project = await this.projects.ensureDeadlineTransition(
      await this.projects.findByIdOrThrow(projectId),
    );

    assertTermsAccepted(dto.termsAccepted); // A2
    assertProjectOpen(project.status); // A1
    assertBeforeApplicationDeadline(project.applicationDeadline, new Date()); // A3

    const existing = await this.applications.findOne({
      where: { projectId, graduateId: graduate.id },
    });
    if (existing) {
      // A4: at most one application per (project, graduate).
      throw new ForbiddenException('You have already applied to this project.');
    }

    const application = this.applications.create({
      projectId,
      graduateId: graduate.id,
      status: ApplicationStatus.PENDING,
      termsAcceptedAt: new Date(),
      note: dto.note ?? null,
      declineReason: null,
      decidedAt: null,
    });
    return this.applications.save(application);
  }

  /** The graduate's own applications with project, status and evaluation summary. */
  async listMine(userId: string): Promise<unknown[]> {
    const graduate = await this.graduates.getByUserIdOrThrow(userId);
    const apps = await this.applications.find({
      where: { graduateId: graduate.id },
      relations: { project: { company: true } },
      order: { createdAt: 'DESC' },
    });
    const appIds = apps.map((a) => a.id);
    const deliverables = appIds.length
      ? await this.deliverables.find({ where: { applicationId: In(appIds) } })
      : [];
    const deliverableByApp = new Map(deliverables.map((d) => [d.applicationId, d]));
    const evalByDeliverable = deliverables.length
      ? new Map(
          (
            await this.evaluations.find({
              where: { deliverableId: In(deliverables.map((d) => d.id)) },
            })
          ).map((e) => [e.deliverableId, e]),
        )
      : new Map<string, Evaluation>();

    return apps.map((a) => {
      const deliverable = deliverableByApp.get(a.id) ?? null;
      const evaluation = deliverable
        ? evalByDeliverable.get(deliverable.id) ?? null
        : null;
      return {
        id: a.id,
        status: a.status,
        note: a.note,
        declineReason: a.declineReason,
        termsAcceptedAt: a.termsAcceptedAt,
        decidedAt: a.decidedAt,
        createdAt: a.createdAt,
        project: {
          id: a.project.id,
          title: a.project.title,
          status: a.project.status,
          submissionDeadline: a.project.submissionDeadline,
          deliverableFormat: a.project.deliverableFormat,
          company: { id: a.project.company.id, name: a.project.company.name },
        },
        deliverable: deliverable
          ? { id: deliverable.id, submittedAt: deliverable.submittedAt }
          : null,
        evaluation: evaluation
          ? {
              score: evaluation.score,
              outcome: evaluation.outcome,
              feedback: evaluation.feedback,
              evaluatedAt: evaluation.evaluatedAt,
            }
          : null,
      };
    });
  }

  /** The review queue for one project owned by the calling company. */
  async reviewQueue(userId: string, projectId: string): Promise<unknown[]> {
    const company = await this.companies.getByUserIdOrThrow(userId);
    const project = await this.projects.findByIdOrThrow(projectId);
    this.projects.assertOwnedByCompany(project, company.id);

    const apps = await this.applications.find({
      where: { projectId },
      relations: { graduate: true },
      order: { createdAt: 'ASC' },
    });
    return apps.map((a) => ({
      id: a.id,
      status: a.status,
      note: a.note,
      declineReason: a.declineReason,
      termsAcceptedAt: a.termsAcceptedAt,
      decidedAt: a.decidedAt,
      createdAt: a.createdAt,
      graduate: {
        id: a.graduate.id,
        fullName: a.graduate.fullName,
        education: a.graduate.education,
        skills: a.graduate.skills,
        links: a.graduate.links,
        location: a.graduate.location,
      },
    }));
  }

  async accept(userId: string, applicationId: string): Promise<Application> {
    const { application, companyId } =
      await this.loadForOwningCompany(userId, applicationId);
    assertPending(application.status); // A5
    assertBeforeApplicationDeadline(
      application.project.applicationDeadline,
      new Date(),
    ); // A3
    void companyId;
    application.status = ApplicationStatus.ACCEPTED;
    application.decidedAt = new Date(); // A7
    return this.applications.save(application);
  }

  async decline(
    userId: string,
    applicationId: string,
    reason: string,
  ): Promise<Application> {
    const { application } = await this.loadForOwningCompany(userId, applicationId);
    assertPending(application.status); // A5
    assertDeclineReason(reason); // A6
    application.status = ApplicationStatus.DECLINED;
    application.declineReason = reason.trim();
    application.decidedAt = new Date(); // A7
    return this.applications.save(application);
  }

  // ---- helpers used by this and other modules ----

  async getByIdOrThrow(applicationId: string): Promise<Application> {
    const application = await this.applications.findOne({
      where: { id: applicationId },
      relations: { project: { company: true }, graduate: true },
    });
    if (!application) throw new NotFoundException('Application not found.');
    return application;
  }

  /** V1: load an application only if the graduate owns it. */
  async loadForOwningGraduate(
    userId: string,
    applicationId: string,
  ): Promise<Application> {
    const graduate = await this.graduates.getByUserIdOrThrow(userId);
    const application = await this.getByIdOrThrow(applicationId);
    if (application.graduateId !== graduate.id) {
      throw new ForbiddenException('You do not own this application.');
    }
    return application;
  }

  /** V2: load an application only if the calling company owns its project. */
  async loadForOwningCompany(
    userId: string,
    applicationId: string,
  ): Promise<{ application: Application; companyId: string }> {
    const company = await this.companies.getByUserIdOrThrow(userId);
    const application = await this.getByIdOrThrow(applicationId);
    if (application.project.companyId !== company.id) {
      throw new ForbiddenException(
        'You do not own the project for this application.',
      );
    }
    return { application, companyId: company.id };
  }
}
