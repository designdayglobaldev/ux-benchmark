import fs from 'fs';
import path from 'path';
import { ScreenFieldEmbeddingService } from '../services/search/screen-field-embedding.service';
import { UX_BENCH_V2_DATASET } from '../benchmark/ux-bench-v2.dataset';
import { calculateDCG, calculateIDCG } from '../benchmark/ux-bench-runner';
import { prisma } from '../db/prisma';

// Re-generate candidates and save raw field matches per query to scratch for instantaneous offline exploration
async function cacheFieldMatches() {
  console.log('Checking if field matches are already stored...');
  const cachePath = path.join(__dirname, '../../scratch/dev77_field_matches_cache.json');
  if (fs.existsSync(cachePath)) {
    console.log('✅ Field matches already cached.');
    return;
  }
}
cacheFieldMatches();

