import { prisma } from '../db/prisma';

async function main() {
  await prisma.clientUser.deleteMany({
    where: { email: 'admin@designday.io' }
  });
  console.log('Deleted admin from ClientUser');
}

main().catch(console.error).finally(() => prisma.$disconnect());
