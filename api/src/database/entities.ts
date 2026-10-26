import { User } from '../modules/auth/entities/user.entity.js';
import { Graduate } from '../modules/graduates/entities/graduate.entity.js';
import { Company } from '../modules/companies/entities/company.entity.js';
import { Project } from '../modules/projects/entities/project.entity.js';
import { Application } from '../modules/applications/entities/application.entity.js';
import { Deliverable } from '../modules/deliverables/entities/deliverable.entity.js';
import { Evaluation } from '../modules/evaluations/entities/evaluation.entity.js';

/** The single source of truth for the entity set, shared by the app and the CLI. */
export const entities = [
  User,
  Graduate,
  Company,
  Project,
  Application,
  Deliverable,
  Evaluation,
];
