import { prisma } from './src/db/prisma';

async function main() {
  console.log('🌱 Seeding Banking Apps...');

  // Create or get Finance category
  let category = await prisma.category.findUnique({
    where: { slug: 'finance' }
  });

  if (!category) {
    category = await prisma.category.create({
      data: {
        title: 'Finance',
        slug: 'finance',
        description: 'App Category',
        status: 'LIVE'
      }
    });
  }

  const appsToSeed = [
    {
      name: 'Lloyds Mobile Banking',
      description: 'Your bank in your pocket',
      logo: 'https://via.placeholder.com/150/10B981/000000?text=L',
      bg: '#10B981'
    },
    {
      name: 'Revolut',
      description: 'All-in-one finance app for your money',
      logo: 'https://via.placeholder.com/150/FFFFFF/000000?text=R',
      bg: '#FFFFFF'
    },
    {
      name: 'Monzo',
      description: 'Personal & business banking',
      logo: 'https://via.placeholder.com/150/14233C/00C09E?text=M',
      bg: '#14233C'
    },
    {
      name: 'Starling',
      description: 'Good with money',
      logo: 'https://via.placeholder.com/150/2A1B38/3BBAA5?text=S',
      bg: '#2A1B38'
    },
    {
      name: 'Neo Financial',
      description: 'Spend, save, earn cashback',
      logo: 'https://via.placeholder.com/150/000000/FFFFFF?text=neo',
      bg: '#000000'
    },
    {
      name: 'Chime',
      description: 'The #1 choice for banking',
      logo: 'https://via.placeholder.com/150/25C87E/FFFFFF?text=C',
      bg: '#25C87E'
    }
  ];

  for (const app of appsToSeed) {
    const slug = app.name.toLowerCase().replace(/\s+/g, '-');
    await prisma.app.upsert({
      where: { slug },
      update: {},
      create: {
        name: app.name,
        slug,
        description: app.description,
        appLogo: app.logo,
        appThumbnail: app.logo,
        categoryId: category.id,
        status: 'LIVE',
      }
    });
  }

  console.log('✅ Banking Apps Seeded Successfully');
  await prisma.$disconnect();
}

main().catch(console.error);
