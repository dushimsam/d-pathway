import dataSource from '../data-source.js';
import { Pathway } from '../../modules/pathways/entities/pathway.entity.js';
import { PathwayStatus } from '../../common/enums/pathway-status.enum.js';

type SeedPathway = {
  title: string;
  companyName: string;
  description: string;
  eligibilityCriteria: string;
  intakeQuota: number;
  deadlineMonths: number;
  status: PathwayStatus;
};

const seedPathways: SeedPathway[] = [
  {
    title: 'Junior DevOps Engineer Pathway',
    companyName: 'Irembo Ltd',
    description:
      'Climb from Linux fundamentals to shipping a monitored service on our cloud, ending in a systems-design interview.',
    eligibilityCriteria:
      'BSc in Software Engineering or Computer Science, GPA 3.0+, graduated within the last 24 months, based in Rwanda.',
    intakeQuota: 12,
    deadlineMonths: 6,
    status: PathwayStatus.PUBLISHED,
  },
  {
    title: 'Cloud Support Engineer Pathway',
    companyName: 'Strettch Cloud',
    description:
      'Learn to triage, reproduce and resolve real customer infrastructure issues, finishing with a live support simulation.',
    eligibilityCriteria:
      'Bachelor degree in a computing field, strong written English, comfortable with Linux and networking basics, graduated within 36 months.',
    intakeQuota: 6,
    deadlineMonths: 4,
    status: PathwayStatus.PUBLISHED,
  },
  {
    title: 'Junior Backend Engineer Pathway',
    companyName: 'SafeMotos',
    description:
      'Build and test production APIs feature by feature, culminating in a code-review and architecture interview.',
    eligibilityCriteria:
      'BSc SE/CS, portfolio with at least one deployed project, GPA 2.7+, graduated within 24 months.',
    intakeQuota: 10,
    deadlineMonths: 6,
    status: PathwayStatus.DRAFT,
  },
];

async function run(): Promise<void> {
  await dataSource.initialize();
  const repository = dataSource.getRepository(Pathway);

  let created = 0;
  let skipped = 0;

  for (const seed of seedPathways) {
    const existing = await repository.findOne({
      where: { title: seed.title },
      withDeleted: true,
    });
    if (existing) {
      skipped += 1;
      continue;
    }
    const pathway = repository.create({
      ...seed,
      publishedAt:
        seed.status === PathwayStatus.PUBLISHED ? new Date() : null,
    });
    await repository.save(pathway);
    created += 1;
  }

  console.log(`Seed complete: ${created} created, ${skipped} already present.`);
  await dataSource.destroy();
}

run().catch((error: unknown) => {
  console.error('Seed failed:', error);
  process.exitCode = 1;
});
