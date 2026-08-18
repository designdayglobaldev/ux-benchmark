import { prisma } from '../db/prisma';
import { getSearchClient, initMeilisearch } from '../services/meilisearch';

async function main() {
  console.log('🔄 Starting Search Synchronization...');
  await initMeilisearch();
  
  const searchClient = await getSearchClient();
  const index = searchClient.index('ux_library');

  // Fetch all apps
  const apps = await prisma.app.findMany({
    include: {
      category: true,
    }
  });

  const documents = [];

  for (const app of apps) {
    documents.push({
      id: `app_${app.id}`,
      originalId: app.id,
      slug: app.slug,
      type: 'app',
      title: app.name,
      subtitle: app.category?.title || 'App',
      description: app.description || '',
      category: app.category?.title || '',
      iconChar: app.name.substring(0, 1).toUpperCase(),
      imageUrl: app.appThumbnail || app.appLogo,
      tags: app.tags || []
    });
  }

  // Add the documents to the index
  console.log(`📤 Pushing ${documents.length} documents to Meilisearch...`);
  
  try {
    const response = await index.addDocuments(documents, { primaryKey: 'id' });
    console.log('✅ Documents added successfully. Task UID:', response.taskUid);
  } catch (err) {
    console.error('❌ Failed to push documents:', err);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
