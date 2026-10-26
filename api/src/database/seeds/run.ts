import 'reflect-metadata';
import bcrypt from 'bcrypt';
import { AppDataSource } from '../data-source.js';
import { User } from '../../modules/auth/entities/user.entity.js';
import { Company } from '../../modules/companies/entities/company.entity.js';
import { Graduate } from '../../modules/graduates/entities/graduate.entity.js';
import { Project } from '../../modules/projects/entities/project.entity.js';
import {
  DeliverableFormat,
  ProjectStatus,
  UserRole,
} from '../../common/enums/index.js';

/**
 * Pilot seed. The platform is for any organisation posting real work — not just
 * tech companies, but cooperatives and small community groups too. The seed
 * mixes Strettch Cloud (tech) with a tailors' cooperative, a farmers'
 * cooperative and a youth media group. Some projects carry a cash prize
 * (Devpost-style); most do not. Idempotent: skips orgs that already exist.
 */

const IP =
  'All work product created for this project is assigned to the organisation. You keep the right to describe the work in your portfolio.';

const daysFromNow = (d: number) => new Date(Date.now() + d * 24 * 60 * 60 * 1000);

interface ProjectDef {
  title: string;
  brief: string;
  requiredSkills: string[];
  format: DeliverableFormat;
  applyIn: number;
  submitIn: number;
  prizeAmount?: number;
  status: ProjectStatus;
}

interface OrgDef {
  name: string;
  industry: string;
  email: string;
  title: string;
  description: string;
  projects: ProjectDef[];
}

const ORGS: OrgDef[] = [
  {
    name: 'Strettch Cloud',
    industry: 'Cloud infrastructure',
    email: 'cto@strettch.com',
    title: 'CTO',
    description: 'A Kigali cloud infrastructure company, first partner on the D-Pathway pilot.',
    projects: [
      {
        title: 'Internal metrics dashboard',
        brief:
          'We have an internal metrics API and no good way to see it. Build a small dashboard that reads it and surfaces the three numbers we check daily. Ship a repo with a README and a short Loom.',
        requiredSkills: ['typescript', 'react'],
        format: DeliverableFormat.REPOSITORY_LINK,
        applyIn: 10,
        submitIn: 24,
        prizeAmount: 150000,
        status: ProjectStatus.OPEN,
      },
      {
        title: 'Data cleanup script',
        brief:
          'A CSV export from a legacy system needs normalising before import. Write a well-tested script that validates and transforms it, with clear error reporting.',
        requiredSkills: ['python', 'data'],
        format: DeliverableFormat.FILE,
        applyIn: 14,
        submitIn: 28,
        status: ProjectStatus.OPEN,
      },
      {
        title: 'Draft: billing export idea',
        brief: 'A rough idea we are still scoping.',
        requiredSkills: ['typescript'],
        format: DeliverableFormat.LINK,
        applyIn: 20,
        submitIn: 34,
        status: ProjectStatus.DRAFT,
      },
    ],
  },
  {
    name: 'Kigali Tailors Cooperative',
    industry: 'Garments & crafts',
    email: 'orders@kigalitailors.rw',
    title: 'Cooperative Coordinator',
    description:
      'A cooperative of 24 tailors in Nyarugenge sharing one workshop and a growing customer list.',
    projects: [
      {
        title: 'Simple order & inventory tracker',
        brief:
          'We track customer orders and fabric stock on paper and keep losing count. Build us a simple spreadsheet or lightweight web page where we record an order, mark it done, and see what fabric is low. Must work on a phone.',
        requiredSkills: ['spreadsheets', 'web'],
        format: DeliverableFormat.LINK,
        applyIn: 9,
        submitIn: 21,
        prizeAmount: 50000,
        status: ProjectStatus.OPEN,
      },
      {
        title: 'Logo and brand kit',
        brief:
          'We want one clean logo, two colours, and a WhatsApp profile picture we can reuse. Deliver the files plus a one-page guide on how to use them.',
        requiredSkills: ['design', 'branding'],
        format: DeliverableFormat.FILE,
        applyIn: 12,
        submitIn: 26,
        status: ProjectStatus.OPEN,
      },
      {
        title: 'Draft: online lookbook',
        brief: 'Idea: a small gallery of our best pieces. Still deciding.',
        requiredSkills: ['web', 'design'],
        format: DeliverableFormat.LINK,
        applyIn: 18,
        submitIn: 32,
        status: ProjectStatus.DRAFT,
      },
    ],
  },
  {
    name: 'Gasabo Farmers Cooperative',
    industry: 'Agriculture',
    email: 'info@gasabofarmers.rw',
    title: 'Secretary',
    description:
      'A cooperative of smallholder vegetable farmers in Gasabo selling to Kigali markets.',
    projects: [
      {
        title: 'WhatsApp produce order form',
        brief:
          'Restaurants message us on WhatsApp and orders get mixed up. Build a simple online form that collects what they want and when, and shows us a clean daily list. Keep it very easy to use.',
        requiredSkills: ['web', 'forms'],
        format: DeliverableFormat.LINK,
        applyIn: 8,
        submitIn: 20,
        prizeAmount: 40000,
        status: ProjectStatus.OPEN,
      },
      {
        title: 'Harvest record spreadsheet',
        brief:
          'We want to record each harvest (crop, quantity, date, price) so we can see trends over a season. Deliver a ready-to-use spreadsheet with a simple summary sheet.',
        requiredSkills: ['spreadsheets', 'data'],
        format: DeliverableFormat.FILE,
        applyIn: 13,
        submitIn: 27,
        status: ProjectStatus.OPEN,
      },
    ],
  },
  {
    name: 'Nyamirambo Youth Media',
    industry: 'Media & community',
    email: 'hello@nyamiramboyouth.rw',
    title: 'Program Lead',
    description:
      'A volunteer youth group in Nyamirambo running community events and a small social-media page.',
    projects: [
      {
        title: 'Community events landing page',
        brief:
          'Build us a one-page website that lists our upcoming events with a photo, date and a "get directions" link. Should look good on a phone and be easy for us to update.',
        requiredSkills: ['html', 'css', 'design'],
        format: DeliverableFormat.REPOSITORY_LINK,
        applyIn: 11,
        submitIn: 25,
        prizeAmount: 75000,
        status: ProjectStatus.OPEN,
      },
      {
        title: 'Edit three short promo videos',
        brief:
          'We have raw phone footage from our last event. Cut three 30-second vertical clips for TikTok and Instagram with captions. Share the exported files via a link.',
        requiredSkills: ['video editing'],
        format: DeliverableFormat.LINK,
        applyIn: 7,
        submitIn: 18,
        status: ProjectStatus.OPEN,
      },
    ],
  },
];

async function run(): Promise<void> {
  const ds = await AppDataSource.initialize();
  const passwordHash = await bcrypt.hash('password123', 10);

  await ds.transaction(async (manager) => {
    for (const org of ORGS) {
      let company = await manager.getRepository(Company).findOne({
        where: { name: org.name },
      });
      if (!company) {
        const user = await manager.getRepository(User).save(
          manager.getRepository(User).create({
            email: org.email,
            passwordHash,
            role: UserRole.COMPANY,
          }),
        );
        company = await manager.getRepository(Company).save(
          manager.getRepository(Company).create({
            userId: user.id,
            name: org.name,
            industry: org.industry,
            representativeTitle: org.title,
            description: org.description,
          }),
        );
      }

      const already = await manager
        .getRepository(Project)
        .count({ where: { companyId: company.id } });
      if (already > 0) continue;

      await manager.getRepository(Project).save(
        org.projects.map((p) =>
          manager.getRepository(Project).create({
            companyId: company!.id,
            title: p.title,
            brief: p.brief,
            requiredSkills: p.requiredSkills,
            applicationDeadline: daysFromNow(p.applyIn),
            submissionDeadline: daysFromNow(p.submitIn),
            deliverableFormat: p.format,
            ipTerms: IP,
            prizeAmount: p.prizeAmount ?? null,
            prizeCurrency: p.prizeAmount != null ? 'RWF' : null,
            status: p.status,
            publishedAt: p.status === ProjectStatus.DRAFT ? null : new Date(),
          }),
        ),
      );
    }

    // A sample graduate to exercise the catalogue during manual testing.
    const gradEmail = 'graduate@alu.edu';
    const hasGrad = await manager.getRepository(User).findOne({
      where: { email: gradEmail },
    });
    if (!hasGrad) {
      const gradUser = await manager.getRepository(User).save(
        manager.getRepository(User).create({
          email: gradEmail,
          passwordHash,
          role: UserRole.GRADUATE,
        }),
      );
      await manager.getRepository(Graduate).save(
        manager.getRepository(Graduate).create({
          userId: gradUser.id,
          fullName: 'Aline Uwimana',
          education: 'BSc Software Engineering, ALU, 2026',
          skills: ['typescript', 'react', 'web', 'design'],
          links: ['https://github.com/aline'],
          location: 'Kigali, Gasabo',
        }),
      );
    }
  });

  // eslint-disable-next-line no-console
  console.log(
    'Seed complete: 4 organisations (1 company + 3 cooperatives/groups), 1 graduate, prized and unprized projects.',
  );
  await ds.destroy();
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Seed failed:', err);
  process.exit(1);
});
