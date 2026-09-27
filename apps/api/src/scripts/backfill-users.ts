import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { prisma } from '../db/prisma';
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log('Fetching users from Supabase...');
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error('Error fetching users:', error);
    process.exit(1);
  }

  console.log(`Found ${users.length} users. Backfilling into Prisma ClientUser table...`);

  let count = 0;
  for (const user of users) {
    if (!user.email) continue;
    
    try {
      await prisma.clientUser.upsert({
        where: { id: user.id },
        update: {},
        create: {
          id: user.id,
          email: user.email,
          tier: 'FREE',
        },
      });
      count++;
    } catch (e) {
      console.error(`Error inserting user ${user.email}:`, e);
    }
  }

  console.log(`Successfully backfilled ${count} users!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
