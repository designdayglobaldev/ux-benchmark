import { Meilisearch } from 'meilisearch';
import dotenv from 'dotenv';

dotenv.config();

// Create Meilisearch client
const meiliHost = process.env.MEILISEARCH_HOST || 'http://127.0.0.1:7700';
const meiliApiKey = process.env.MEILISEARCH_API_KEY || 'masterKey'; // Default master key for dev

export const searchClient = new Meilisearch({
  host: meiliHost,
  apiKey: meiliApiKey,
});

// Helper to initialize indexes if they don't exist
export const initMeilisearch = async () => {
  try {
    const index = searchClient.index('ux_library');
    
    // Set searchable attributes (what fields meilisearch looks at)
    await index.updateSearchableAttributes([
      'title',
      'name',
      'description',
      'subtitle',
      'category',
      'tags'
    ]);

    // Set filterable attributes
    await index.updateFilterableAttributes([
      'type',
      'category'
    ]);
    
    console.log('✅ Meilisearch initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Meilisearch. Is the server running?');
    console.error(error);
  }
};
