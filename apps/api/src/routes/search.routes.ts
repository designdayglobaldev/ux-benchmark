import { Router, Request, Response } from 'express';
import { getSearchClient } from '../services/meilisearch';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const { q = '' } = req.query;

  try {
    const searchClient = await getSearchClient();
    const index = searchClient.index('ux_library');
    
    // Check if Meilisearch is reachable and index exists
    // (In production, you'd handle this more gracefully)
    const searchRes = await index.search(q as string, {
      limit: 15,
      attributesToHighlight: ['*'],
      highlightPreTag: '<em>',
      highlightPostTag: '</em>',
    });

    res.json({
      success: true,
      query: q,
      hits: searchRes.hits,
      estimatedTotalHits: searchRes.estimatedTotalHits,
      processingTimeMs: searchRes.processingTimeMs
    });
  } catch (error: any) {
    console.error('Search error:', error.message);
    
    // Fallback if Meilisearch is down or index doesn't exist
    // Return empty results for now
    res.json({
      success: false,
      query: q,
      hits: [],
      error: 'Search service unavailable'
    });
  }
});

export default router;
