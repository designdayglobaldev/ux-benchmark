import { prisma } from '../db/prisma';
import { getProposedOrphanMappings } from '../services/search/orphan-resolver';

export async function buildScreenJourneys(buildId: string = 'build-v1') {
  console.log(`=== BUILDING SCREEN JOURNEYS (${buildId}) ===`);
  const start = Date.now();

  // 1. Fetch all screens currently in flows
  const screens = await prisma.screen.findMany({
    where: { flowId: { not: null } },
    select: {
      id: true,
      name: true,
      appId: true,
      flowId: true,
      screenNo: true,
      app: { select: { slug: true, name: true } },
      flow: { select: { name: true, slug: true } },
    },
    orderBy: [{ appId: 'asc' }, { flowId: 'asc' }, { screenNo: 'asc' }],
  });

  console.log(`Found ${screens.length} screens attached to flows.`);

  // Group by (appId, flowId) -> extract clean per-app journeys
  const journeyGroups = new Map<string, typeof screens>();

  for (const s of screens) {
    if (!s.appId || !s.flowId || !s.flow) continue;
    const key = `${s.appId}:::${s.flowId}`;
    if (!journeyGroups.has(key)) {
      journeyGroups.set(key, []);
    }
    journeyGroups.get(key)!.push(s);
  }

  console.log(`Regrouped into ${journeyGroups.size} distinct app journeys (from 305 original flows).`);

  const recordsToInsert: Array<{
    buildId: string;
    appId: string;
    journeySlug: string;
    screenId: string;
    stepNo: number;
    sourceFlowId: string;
  }> = [];

  for (const [key, groupScreens] of journeyGroups.entries()) {
    const first = groupScreens[0];
    const appSlug = first.app.slug.toLowerCase().trim();
    const flowSlug = first.flow.slug.toLowerCase().trim();
    const journeySlug = `${appSlug}:${flowSlug}`;

    // Sort screens strictly by their original screenNo or numeric suffix in title
    groupScreens.sort((a, b) => {
      const numA = extractStepNumber(a.name) ?? a.screenNo ?? 0;
      const numB = extractStepNumber(b.name) ?? b.screenNo ?? 0;
      return numA - numB;
    });

    // Re-index step numbers 1..N within this app journey
    groupScreens.forEach((s, idx) => {
      recordsToInsert.push({
        buildId,
        appId: s.appId,
        journeySlug,
        screenId: s.id,
        stepNo: idx + 1, // Clean contiguous step numbering 1..N
        sourceFlowId: s.flowId!,
      });
    });
  }

  // 2. Add the 68 orphan screens based on proposed mappings
  const orphanMaps = await getProposedOrphanMappings();
  console.log(`Adding ${orphanMaps.length} orphan screens to journeys...`);
  
  for (const o of orphanMaps) {
    recordsToInsert.push({
      buildId,
      appId: o.appId,
      journeySlug: o.inferredJourneySlug,
      screenId: o.screenId,
      stepNo: o.inferredStepNo,
      sourceFlowId: 'orphan-resolved',
    });
  }

  console.log(`Total ScreenJourney records to persist: ${recordsToInsert.length}`);

  // Batch insert in chunks of 500
  const BATCH_SIZE = 500;
  let inserted = 0;

  for (let i = 0; i < recordsToInsert.length; i += BATCH_SIZE) {
    const batch = recordsToInsert.slice(i, i + BATCH_SIZE);
    await prisma.screenJourney.createMany({
      data: batch,
      skipDuplicates: true,
    });
    inserted += batch.length;
    console.log(`Persisted ${inserted}/${recordsToInsert.length} journeys...`);
  }

  console.log(`=== COMPLETED in ${((Date.now() - start) / 1000).toFixed(1)}s ===`);
}

function extractStepNumber(name: string): number | null {
  const match = name.match(/(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
}

if (require.main === module) {
  buildScreenJourneys()
    .catch(console.error)
    .finally(async () => {
      const p: any = prisma;
      await p.$disconnect();
    });
}

