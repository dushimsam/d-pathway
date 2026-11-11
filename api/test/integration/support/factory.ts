import request from 'supertest';
import type { Server } from 'node:http';
import type { DataSource } from 'typeorm';

/**
 * Shared helpers for the integration specs: a thin authenticated HTTP client,
 * registration shortcuts that also resolve the role profile id, and mid-level
 * lifecycle helpers (open a project, apply, accept, submit, evaluate) so each
 * domain spec stays about the behaviour it is testing rather than setup.
 */

// Unique-enough identities within a worker process. The DB is truncated between
// tests, but a monotonic counter keeps emails/company names distinct even within
// a single test (company name carries a global unique index).
let seq = 0;
function next(): number {
  seq += 1;
  return seq;
}

export function uniqueEmail(prefix = 'user'): string {
  return `${prefix}.${next()}@example.com`;
}

export function uniqueName(prefix = 'Company'): string {
  return `${prefix} ${next()}`;
}

/** A supertest wrapper that attaches a bearer token (when present) to each call. */
export class Client {
  constructor(
    private readonly server: Server,
    private readonly token?: string,
  ) {}

  private auth(req: request.Test): request.Test {
    return this.token ? req.set('Authorization', `Bearer ${this.token}`) : req;
  }

  get(path: string): request.Test {
    return this.auth(request(this.server).get(path));
  }

  post(path: string, body?: unknown): request.Test {
    const req = this.auth(request(this.server).post(path));
    return body === undefined ? req : req.send(body as object);
  }

  patch(path: string, body?: unknown): request.Test {
    const req = this.auth(request(this.server).patch(path));
    return body === undefined ? req : req.send(body as object);
  }

  delete(path: string, body?: unknown): request.Test {
    const req = this.auth(request(this.server).delete(path));
    return body === undefined ? req : req.send(body as object);
  }
}

export function anonymous(server: Server): Client {
  return new Client(server);
}

export function asUser(server: Server, token: string): Client {
  return new Client(server, token);
}

export interface TestGraduate {
  token: string;
  userId: string;
  email: string;
  graduateId: string;
  client: Client;
}

export interface TestCompany {
  token: string;
  userId: string;
  email: string;
  companyId: string;
  client: Client;
}

export interface RegisterGraduateOverrides {
  email?: string;
  password?: string;
  fullName?: string;
  education?: string;
  skills?: string[];
  location?: string;
}

export async function registerGraduate(
  server: Server,
  overrides: RegisterGraduateOverrides = {},
): Promise<TestGraduate> {
  const email = overrides.email ?? uniqueEmail('grad');
  const body = {
    email,
    password: overrides.password ?? 'sup3r-secret-pw',
    fullName: overrides.fullName ?? 'Grace Graduate',
    education: overrides.education,
    skills: overrides.skills,
    location: overrides.location,
  };
  const res = await request(server)
    .post('/api/v1/auth/register/graduate')
    .send(body)
    .expect(201);
  const token = res.body.accessToken as string;
  const client = asUser(server, token);
  const me = await client.get('/api/v1/graduates/me').expect(200);
  return {
    token,
    userId: res.body.user.id as string,
    email,
    graduateId: me.body.id as string,
    client,
  };
}

export interface RegisterCompanyOverrides {
  email?: string;
  password?: string;
  companyName?: string;
  industry?: string;
  title?: string;
}

export async function registerCompany(
  server: Server,
  overrides: RegisterCompanyOverrides = {},
): Promise<TestCompany> {
  const email = overrides.email ?? uniqueEmail('company');
  const body = {
    email,
    password: overrides.password ?? 'sup3r-secret-pw',
    companyName: overrides.companyName ?? uniqueName('Acme'),
    industry: overrides.industry,
    title: overrides.title,
  };
  const res = await request(server)
    .post('/api/v1/auth/register/company')
    .send(body)
    .expect(201);
  const token = res.body.accessToken as string;
  const client = asUser(server, token);
  const me = await client.get('/api/v1/companies/me').expect(200);
  return {
    token,
    userId: res.body.user.id as string,
    email,
    companyId: me.body.id as string,
    client,
  };
}

/** Give a company spendable wallet balance (prizes escrow out of it at create). */
export async function creditCompany(
  dataSource: DataSource,
  companyId: string,
  amount: number,
): Promise<void> {
  await dataSource.query('UPDATE companies SET balance = $1 WHERE id = $2', [
    amount,
    companyId,
  ]);
}

const DAY = 24 * 60 * 60 * 1000;

export interface ProjectInputOverrides {
  title?: string;
  brief?: string;
  requiredSkills?: string[];
  applicationDeadline?: string;
  submissionDeadline?: string;
  deliverableFormat?: string;
  ipTerms?: string;
  prizeAmount?: number;
  prizeCurrency?: string;
}

/** A valid CreateProjectDto body with deadlines comfortably in the future. */
export function projectInput(
  overrides: ProjectInputOverrides = {},
): Record<string, unknown> {
  const now = Date.now();
  const body: Record<string, unknown> = {
    title: overrides.title ?? 'Build a landing page',
    brief: overrides.brief ?? 'Design and build a marketing landing page.',
    requiredSkills: overrides.requiredSkills ?? ['react', 'typescript'],
    applicationDeadline:
      overrides.applicationDeadline ?? new Date(now + 7 * DAY).toISOString(),
    submissionDeadline:
      overrides.submissionDeadline ?? new Date(now + 21 * DAY).toISOString(),
    deliverableFormat: overrides.deliverableFormat ?? 'REPOSITORY_LINK',
    ipTerms: overrides.ipTerms ?? 'The company retains all IP in the deliverable.',
  };
  if (overrides.prizeAmount !== undefined) body.prizeAmount = overrides.prizeAmount;
  if (overrides.prizeCurrency !== undefined)
    body.prizeCurrency = overrides.prizeCurrency;
  return body;
}

/** Create a DRAFT project owned by `company`. Returns the project body. */
export async function createDraftProject(
  company: TestCompany,
  overrides: ProjectInputOverrides = {},
): Promise<Record<string, any>> {
  const res = await company.client
    .post('/api/v1/projects', projectInput(overrides))
    .expect(201);
  return res.body;
}

/** Create and publish a project (status OPEN). Returns the published project. */
export async function createOpenProject(
  company: TestCompany,
  overrides: ProjectInputOverrides = {},
): Promise<Record<string, any>> {
  const draft = await createDraftProject(company, overrides);
  const res = await company.client
    .post(`/api/v1/projects/${draft.id}/publish`)
    .expect(201);
  return res.body;
}

/** Graduate applies to a project (accepting IP terms). Returns the application. */
export async function applyToProject(
  graduate: TestGraduate,
  projectId: string,
  note?: string,
): Promise<Record<string, any>> {
  const res = await graduate.client
    .post(`/api/v1/projects/${projectId}/apply`, {
      termsAccepted: true,
      note,
    })
    .expect(201);
  return res.body;
}

/** Company accepts a pending application. Returns the updated application. */
export async function acceptApplication(
  company: TestCompany,
  applicationId: string,
): Promise<Record<string, any>> {
  const res = await company.client
    .post(`/api/v1/applications/${applicationId}/accept`)
    .expect(200);
  return res.body;
}

/** Graduate submits a deliverable for an accepted application. */
export async function submitDeliverable(
  graduate: TestGraduate,
  applicationId: string,
  overrides: { linkUrl?: string; fileUrl?: string; note?: string } = {},
): Promise<Record<string, any>> {
  const res = await graduate.client
    .post(`/api/v1/applications/${applicationId}/deliverable`, {
      linkUrl: overrides.linkUrl ?? 'https://github.com/grace/solution',
      fileUrl: overrides.fileUrl,
      note: overrides.note ?? 'Here is my submission.',
    })
    .expect(201);
  return res.body;
}

/** Company evaluates a deliverable. Returns the evaluation. */
export async function evaluateDeliverable(
  company: TestCompany,
  deliverableId: string,
  overrides: { score?: number; feedback?: string; outcome?: string } = {},
): Promise<Record<string, any>> {
  const res = await company.client
    .post(`/api/v1/deliverables/${deliverableId}/evaluation`, {
      score: overrides.score ?? 4,
      feedback: overrides.feedback ?? 'Solid work.',
      outcome: overrides.outcome ?? 'SELECTED_FOR_INTERVIEW',
    })
    .expect(201);
  return res.body;
}

/**
 * Run the whole happy path and return the key ids. Handy for specs about reads
 * that need a fully-populated project (dashboards, talent, board, award).
 */
export async function runFullLifecycle(
  server: Server,
  dataSource: DataSource,
  opts: { prizeAmount?: number } = {},
): Promise<{
  company: TestCompany;
  graduate: TestGraduate;
  projectId: string;
  applicationId: string;
  deliverableId: string;
  evaluationId: string;
}> {
  const company = await registerCompany(server);
  const graduate = await registerGraduate(server);
  if (opts.prizeAmount) {
    await creditCompany(dataSource, company.companyId, opts.prizeAmount);
  }
  const project = await createOpenProject(
    company,
    opts.prizeAmount ? { prizeAmount: opts.prizeAmount } : {},
  );
  const application = await applyToProject(graduate, project.id);
  await acceptApplication(company, application.id);
  const deliverable = await submitDeliverable(graduate, application.id);
  const evaluation = await evaluateDeliverable(company, deliverable.id);
  return {
    company,
    graduate,
    projectId: project.id,
    applicationId: application.id,
    deliverableId: deliverable.id,
    evaluationId: evaluation.id,
  };
}
