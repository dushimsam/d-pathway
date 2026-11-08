import 'reflect-metadata';
import bcrypt from 'bcrypt';
import { AppDataSource } from '../data-source.js';
import { User } from '../../modules/auth/entities/user.entity.js';
import { Company } from '../../modules/companies/entities/company.entity.js';
import { Graduate } from '../../modules/graduates/entities/graduate.entity.js';
import { Project } from '../../modules/projects/entities/project.entity.js';
import {
  DeliverableFormat,
  PrizeStatus,
  ProjectStatus,
  UserRole,
} from '../../common/enums/index.js';

/** Starting wallet balance for each seeded organisation (demo convenience). */
const SEED_BALANCE = 1_000_000;

/**
 * Pilot seed. The platform is for any organisation posting real work — not just
 * tech companies, but cooperatives and small community groups too. The seed
 * mixes a tailors' cooperative, a farmers' cooperative and a youth media group.
 * Some projects carry a cash prize (Devpost-style); most do not. Idempotent:
 * skips orgs that already exist.
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
  cover?: string;
  status: ProjectStatus;
}

interface OrgDef {
  name: string;
  industry: string;
  email: string;
  title: string;
  description: string;
  cover: string;
  projects: ProjectDef[];
}

const ORGS: OrgDef[] = [
  {
    name: 'Kigali Tailors Cooperative',
    industry: 'Garments & crafts',
    email: 'orders@kigalitailors.rw',
    title: 'Cooperative Coordinator',
    description:
      'A cooperative of 24 tailors in Nyarugenge sharing one workshop and a growing customer list.',
    cover: '/images/real/work-tailors.jpg',
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
        cover: '/images/real/work-fashion.jpg',
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
        cover: '/images/real/work-lookbook.jpg',
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
    cover: '/images/real/work-agritech.jpg',
    projects: [
      {
        title: 'WhatsApp produce order form',
        cover: '/images/real/work-market.jpg',
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
    cover: '/images/real/work-mobile.jpg',
    projects: [
      {
        title: 'Community events landing page',
        cover: '/images/real/work-events.jpg',
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
            balance: SEED_BALANCE,
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
            // Seeded prizes are treated as escrowed (held) against the balance.
            prizeStatus: p.prizeAmount != null ? PrizeStatus.HELD : null,
            coverImageUrl: p.cover ?? org.cover,
            coverImagePublicId: null,
            status: p.status,
            publishedAt: p.status === ProjectStatus.DRAFT ? null : new Date(),
          }),
        ),
      );

      // Reflect the held prizes by reserving them out of the starting balance.
      const heldSum = org.projects.reduce((s, p) => s + (p.prizeAmount ?? 0), 0);
      if (heldSum > 0) {
        company.balance -= heldSum;
        await manager.getRepository(Company).save(company);
      }
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

    // A small talent pool so the search page isn't empty on a fresh install.
    const MORE_STUDENTS = [
      { name: 'Eric Habimana', email: 'eric@alu.edu', edu: 'BSc Computer Science, UR, 2025', skills: ['python', 'data', 'spreadsheets'], loc: 'Kigali, Nyarugenge' },
      { name: 'Chantal Ingabire', email: 'chantal@alu.edu', edu: 'Diploma in Graphic Design, RCA, 2026', skills: ['design', 'branding', 'figma'], loc: 'Kigali, Kicukiro' },
      { name: 'Jean-Paul Niyonsenga', email: 'jp@alu.edu', edu: 'BSc Software Engineering, CMU-Africa, 2025', skills: ['typescript', 'react', 'node', 'web'], loc: 'Kigali, Gasabo' },
      { name: 'Divine Umutoni', email: 'divine@alu.edu', edu: 'BBA, AUCA, 2026', skills: ['spreadsheets', 'data', 'forms'], loc: 'Musanze' },
      { name: 'Kevin Mugisha', email: 'kevin@alu.edu', edu: 'BSc IT, INES-Ruhengeri, 2025', skills: ['web', 'html', 'css', 'forms'], loc: 'Kigali, Gasabo' },
      { name: 'Grace Mukamana', email: 'grace@alu.edu', edu: 'Diploma in Multimedia, RP, 2026', skills: ['video editing', 'design', 'branding'], loc: 'Huye' },
    ];
    for (const s of MORE_STUDENTS) {
      const exists = await manager.getRepository(User).findOne({ where: { email: s.email } });
      if (exists) continue;
      const u = await manager.getRepository(User).save(
        manager.getRepository(User).create({
          email: s.email,
          passwordHash,
          role: UserRole.GRADUATE,
        }),
      );
      await manager.getRepository(Graduate).save(
        manager.getRepository(Graduate).create({
          userId: u.id,
          fullName: s.name,
          education: s.edu,
          skills: s.skills,
          links: [],
          location: s.loc,
        }),
      );
    }
  });

  // eslint-disable-next-line no-console
  console.log(
    'Seed complete: 3 organisations (cooperatives/community groups), 1 graduate, prized and unprized projects.',
  );
  await ds.destroy();
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Seed failed:', err);
  process.exit(1);
});
