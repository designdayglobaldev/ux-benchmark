import { prisma } from '../src/db/prisma';

async function seedOnboardingOptions() {
  console.log('Seeding initial onboarding options...');

  const initialRoles = [
    { label: 'Product Designer', iconName: 'PenTool', sortOrder: 1 },
    { label: 'Product Manager', iconName: 'BarChart3', sortOrder: 2 },
    { label: 'Developer', iconName: 'Code2', sortOrder: 3 },
    { label: 'CEO/CTO', iconName: 'Briefcase', sortOrder: 4 },
  ];

  const initialChallenges = [
    { label: 'Proving design decisions with real benchmarks', sortOrder: 1 },
    { label: 'Aligning stakeholders on product flow trade-offs', sortOrder: 2 },
    { label: 'Gathering competitor references quickly', sortOrder: 3 },
    { label: 'Communicating UI decisions to engineers', sortOrder: 4 },
  ];

  for (const role of initialRoles) {
    const existing = await prisma.onboardingOption.findFirst({
      where: { type: 'ROLE', label: role.label },
    });
    if (!existing) {
      await prisma.onboardingOption.create({
        data: {
          type: 'ROLE',
          label: role.label,
          iconName: role.iconName,
          sortOrder: role.sortOrder,
          isActive: true,
        },
      });
      console.log(`Created role: ${role.label}`);
    }
  }

  for (const challenge of initialChallenges) {
    const existing = await prisma.onboardingOption.findFirst({
      where: { type: 'CHALLENGE', label: challenge.label },
    });
    if (!existing) {
      await prisma.onboardingOption.create({
        data: {
          type: 'CHALLENGE',
          label: challenge.label,
          sortOrder: challenge.sortOrder,
          isActive: true,
        },
      });
      console.log(`Created challenge: ${challenge.label}`);
    }
  }

  console.log('Onboarding options seeding completed!');
  process.exit(0);
}

seedOnboardingOptions().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
