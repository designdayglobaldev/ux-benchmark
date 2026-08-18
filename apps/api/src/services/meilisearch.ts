import dotenv from 'dotenv';

dotenv.config();

// Create Meilisearch client
const meiliHost = process.env.MEILISEARCH_HOST || 'http://127.0.0.1:7700';
const meiliApiKey = process.env.MEILISEARCH_API_KEY || 'masterKey'; // Default master key for dev

let _searchClient: any = null;

export const getSearchClient = async () => {
  if (!_searchClient) {
    const { Meilisearch } = await import('meilisearch');
    _searchClient = new Meilisearch({
      host: meiliHost,
      apiKey: meiliApiKey,
    });
  }
  return _searchClient;
};

// Helper to initialize indexes if they don't exist
export const initMeilisearch = async () => {
  try {
    const searchClient = await getSearchClient();
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
