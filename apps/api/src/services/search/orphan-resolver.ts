import { prisma } from '../../db/prisma';

export interface ProposedOrphanMapping {
  screenId: string;
  screenName: string;
  appId: string;
  appName: string;
  inferredJourneySlug: string;
  inferredJourneyName: string;
  inferredStepNo: number;
  confidence: 'HIGH_NAME_MATCH' | 'STANDALONE_FEATURE';
}

export async function getProposedOrphanMappings(): Promise<ProposedOrphanMapping[]> {
  const orphans = await prisma.screen.findMany({
    where: { flowId: null },
    include: {
      app: { select: { id: true, name: true, slug: true } },
    },
    orderBy: [{ appId: 'asc' }, { name: 'asc' }],
  });

  const mappings: ProposedOrphanMapping[] = [];

  for (const s of orphans) {
    const name = s.name.trim();
    const appSlug = s.app?.slug || 'unknown';
    const appName = s.app?.name || 'Unknown';

    // Regex check for numeric step suffixes like "Subscribing & Upgrading 4"
    const match = name.match(/^(?:.*?\s+)?(.+?)\s+(\d+)$/);
    if (match) {
      const journeyBase = match[1].trim();
      const stepNo = parseInt(match[2], 10);
      const journeySlug = `${appSlug}:${journeyBase.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

      mappings.push({
        screenId: s.id,
        screenName: name,
        appId: s.appId,
        appName,
        inferredJourneySlug: journeySlug,
        inferredJourneyName: `${appName}: ${journeyBase}`,
        inferredStepNo: stepNo,
        confidence: 'HIGH_NAME_MATCH',
      });
    } else {
      // Standalone single-screen features (e.g. "Dark Mode Widget")
      const journeySlug = `${appSlug}:${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      mappings.push({
        screenId: s.id,
        screenName: name,
        appId: s.appId,
        appName,
        inferredJourneySlug: journeySlug,
        inferredJourneyName: `${appName}: ${name}`,
        inferredStepNo: 1,
        confidence: 'STANDALONE_FEATURE',
      });
    }
  }

  return mappings;
}

