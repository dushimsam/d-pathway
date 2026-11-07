import { User } from '../modules/auth/entities/user.entity.js';
import { Graduate } from '../modules/graduates/entities/graduate.entity.js';
import { Company } from '../modules/companies/entities/company.entity.js';
import { Project } from '../modules/projects/entities/project.entity.js';
import { Application } from '../modules/applications/entities/application.entity.js';
import { ApplicationMembership } from '../modules/applications/entities/application-membership.entity.js';
import { Deliverable } from '../modules/deliverables/entities/deliverable.entity.js';
import { Evaluation } from '../modules/evaluations/entities/evaluation.entity.js';
import { Activity } from '../modules/activity/entities/activity.entity.js';
import { WalletTransaction } from '../modules/wallet/entities/wallet-transaction.entity.js';
import { CompanyReview } from '../modules/reviews/entities/company-review.entity.js';
import { SavedBrief } from '../modules/catalogue/entities/saved-brief.entity.js';

/** The single source of truth for the entity set, shared by the app and the CLI. */
export const entities = [
  User,
  Graduate,
  Company,
  Project,
  Application,
  ApplicationMembership,
  Deliverable,
  Evaluation,
  Activity,
  WalletTransaction,
  CompanyReview,
  SavedBrief,
];
