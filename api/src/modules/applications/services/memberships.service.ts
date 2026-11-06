import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { ApplicationStatus, MembershipStatus } from '../../../common/enums/index.js';
import { GraduatesService } from '../../graduates/services/graduates.service.js';
import { Application } from '../entities/application.entity.js';
import { ApplicationMembership } from '../entities/application-membership.entity.js';

/** Lead + at most this many invited teammates (declined seats free up). */
export const MAX_TEAM_SIZE = 4;

@Injectable()
export class MembershipsService {
  constructor(
    @InjectRepository(Application)
    private readonly applications: Repository<Application>,
    @InjectRepository(ApplicationMembership)
    private readonly memberships: Repository<ApplicationMembership>,
    private readonly graduates: GraduatesService,
  ) {}

  /** The lead invites a teammate by account email while the application is pending. */
  async invite(
    leadUserId: string,
    applicationId: string,
    email: string,
  ): Promise<ApplicationMembership> {
    const lead = await this.graduates.getByUserIdOrThrow(leadUserId);
    const application = await this.loadOrThrow(applicationId);
    if (application.graduateId !== lead.id) {
      throw new ForbiddenException('Only the team lead may invite teammates.');
    }
    if (application.status !== ApplicationStatus.PENDING) {
      throw new BadRequestException(
        'Teammates can only be invited while the application is pending.',
      );
    }

    const invitee = await this.graduates.findByEmail(email);
    if (!invitee) {
      throw new NotFoundException('No student account found for that email.');
    }
    if (invitee.id === lead.id) {
      throw new BadRequestException('You are already the team lead.');
    }

    // The invitee must not already have their own application on this project.
    const ownApplication = await this.applications.findOne({
      where: { projectId: application.projectId, graduateId: invitee.id },
    });
    if (ownApplication) {
      throw new BadRequestException(
        'That student has already applied to this project.',
      );
    }

    const existing = await this.memberships.findOne({
      where: { applicationId, graduateId: invitee.id },
    });
    if (existing && existing.status !== MembershipStatus.DECLINED) {
      throw new BadRequestException('That student is already on the team.');
    }

    await this.assertSeatAvailable(applicationId);

    if (existing) {
      // Re-invite a previously-declined teammate by resetting their row.
      existing.status = MembershipStatus.INVITED;
      existing.invitedAt = new Date();
      existing.respondedAt = null;
      return this.memberships.save(existing);
    }

    const membership = this.memberships.create({
      applicationId,
      graduateId: invitee.id,
      status: MembershipStatus.INVITED,
      invitedAt: new Date(),
      respondedAt: null,
    });
    return this.memberships.save(membership);
  }

  /** The invitee accepts or declines; accepting makes them part of the team. */
  async respond(
    userId: string,
    membershipId: string,
    accept: boolean,
  ): Promise<ApplicationMembership> {
    const graduate = await this.graduates.getByUserIdOrThrow(userId);
    const membership = await this.memberships.findOne({
      where: { id: membershipId },
    });
    if (!membership) throw new NotFoundException('Invitation not found.');
    if (membership.graduateId !== graduate.id) {
      throw new ForbiddenException('This invitation is not addressed to you.');
    }
    if (membership.status !== MembershipStatus.INVITED) {
      throw new BadRequestException('This invitation has already been answered.');
    }

    if (accept) await this.assertSeatAvailable(membership.applicationId);
    membership.status = accept
      ? MembershipStatus.ACCEPTED
      : MembershipStatus.DECLINED;
    membership.respondedAt = new Date();
    return this.memberships.save(membership);
  }

  /** The team roster for an application: the lead plus every member. */
  async team(
    user: { id: string; role: string },
    applicationId: string,
  ): Promise<unknown> {
    const application = await this.applications.findOne({
      where: { id: applicationId },
      relations: { graduate: true },
    });
    if (!application) throw new NotFoundException('Application not found.');
    await this.assertCanView(user, application);

    const members = await this.memberships.find({
      where: { applicationId },
      relations: { graduate: true },
      order: { invitedAt: 'ASC' },
    });

    return {
      lead: {
        graduateId: application.graduate.id,
        fullName: application.graduate.fullName,
      },
      members: members.map((m) => ({
        id: m.id,
        graduateId: m.graduateId,
        fullName: m.graduate.fullName,
        status: m.status,
        invitedAt: m.invitedAt,
        respondedAt: m.respondedAt,
      })),
    };
  }

  /** A student's pending invitations, with project context. */
  async myInvitations(userId: string): Promise<unknown[]> {
    const graduate = await this.graduates.getByUserIdOrThrow(userId);
    const invites = await this.memberships.find({
      where: { graduateId: graduate.id, status: MembershipStatus.INVITED },
      relations: { application: { project: { company: true }, graduate: true } },
      order: { invitedAt: 'DESC' },
    });
    return invites.map((m) => ({
      id: m.id,
      invitedAt: m.invitedAt,
      application: {
        id: m.application.id,
        status: m.application.status,
        leadName: m.application.graduate.fullName,
        project: {
          id: m.application.project.id,
          title: m.application.project.title,
          company: { name: m.application.project.company.name },
        },
      },
    }));
  }

  /** Graduate ids on the team (lead implicit) that have accepted — used for visibility. */
  async acceptedMemberGraduateIds(applicationId: string): Promise<string[]> {
    const rows = await this.memberships.find({
      where: { applicationId, status: MembershipStatus.ACCEPTED },
      select: { graduateId: true },
    });
    return rows.map((r) => r.graduateId);
  }

  /** Application ids where this graduate is an accepted teammate. */
  async acceptedApplicationIdsForGraduate(graduateId: string): Promise<string[]> {
    const rows = await this.memberships.find({
      where: { graduateId, status: MembershipStatus.ACCEPTED },
      select: { applicationId: true },
    });
    return rows.map((r) => r.applicationId);
  }

  private async assertSeatAvailable(applicationId: string): Promise<void> {
    // Occupied seats: the lead plus non-declined members.
    const taken = await this.memberships.count({
      where: { applicationId, status: Not(MembershipStatus.DECLINED) },
    });
    if (taken + 1 >= MAX_TEAM_SIZE) {
      throw new BadRequestException(
        `A team may have at most ${MAX_TEAM_SIZE} people, including the lead.`,
      );
    }
  }

  private async assertCanView(
    user: { id: string; role: string },
    application: Application,
  ): Promise<void> {
    if (user.role === 'COMPANY') {
      const owns = await this.applications.findOne({
        where: { id: application.id },
        relations: { project: { company: true } },
      });
      if (owns && owns.project.company.userId === user.id) return;
      throw new ForbiddenException('You cannot view this team.');
    }
    const graduate = await this.graduates.getByUserIdOrThrow(user.id);
    if (application.graduateId === graduate.id) return;
    const membership = await this.memberships.findOne({
      where: { applicationId: application.id, graduateId: graduate.id },
    });
    if (membership) return;
    throw new ForbiddenException('You are not on this team.');
  }

  private async loadOrThrow(applicationId: string): Promise<Application> {
    const application = await this.applications.findOne({
      where: { id: applicationId },
    });
    if (!application) throw new NotFoundException('Application not found.');
    return application;
  }
}
