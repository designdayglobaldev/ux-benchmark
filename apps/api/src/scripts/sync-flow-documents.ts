import { FlowDocumentService } from '../services/search/flow-document.service';
import { prisma } from '../db/prisma';

async function main() {
  console.log('=== SYNCING FLOW DOCUMENTS (voyage-multimodal-3) ===');
  const start = Date.now();
  const res = await FlowDocumentService.syncAllFlowDocuments();
  console.log('Result:', res);
  console.log(`Finished in ${((Date.now() - start) / 1000).toFixed(1)}s`);

  const count = await prisma.flowDocument.count();
  console.log(`Total FlowDocument rows in DB: ${count}`);
}

main()
  .catch((err) => {
    console.error('FlowDocument sync error:', err);
    process.exit(1);
  })
  .finally(async () => {
    const p: any = prisma;
    await p.$disconnect();
  });


