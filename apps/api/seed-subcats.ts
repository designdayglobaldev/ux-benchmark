import 'dotenv/config';
import { prisma } from './src/db/prisma';

async function main() {
  let cat = await prisma.category.findFirst({ where: { title: { contains: 'Finance' } } });
  
  if (!cat) {
    cat = await prisma.category.create({ 
      data: { 
        title: 'Finance & Banking', 
        slug: 'finance-banking', 
        status: 'LIVE' 
      } 
    });
  }
  
  console.log('Category ID:', cat.id);
  
  const subcats = [
    'Banking (Traditional)',
    'Banking (Digital)',
    'Trading & Investing',
    'Crypto',
    'Personal Finance',
    'Cash Advance & Credit',
    'Prediction Markets',
    'Tax',
    'Lending & Mortgage',
    'Payment & Wallets',
    'Insurance',
    'BNPL'
  ];
  
  for (const s of subcats) {
    const slug = s.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
    const existing = await prisma.subcategory.findFirst({ where: { slug } });
    
    if (!existing) {
      await prisma.subcategory.create({
        data: {
          title: s,
          slug,
          categoryId: cat.id,
          status: 'LIVE'
        }
      });
      console.log('Created:', s);
    } else {
      console.log('Already exists:', s);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
