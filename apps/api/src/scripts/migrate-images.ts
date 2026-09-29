import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import sharp from 'sharp';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { prisma } from '../db/prisma';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('--- STARTING NON-DESTRUCTIVE IMAGE MIGRATION ---');
  
  // 1. Find all screens that have .png or .jpg images
  const screens = await prisma.screen.findMany({
    where: {
      OR: [
        { imageUrl: { endsWith: '.png' } },
        { imageUrl: { endsWith: '.jpg' } },
        { imageUrl: { endsWith: '.jpeg' } }
      ]
    }
  });

  console.log(`Found ${screens.length} screens to migrate.`);

  let count = 0;
  for (const screen of screens) {
    try {
      console.log(`\nProcessing screen: ${screen.name} (${screen.id})`);
      console.log(`Original URL: ${screen.imageUrl}`);

      // We need to extract the path in the bucket from the full URL
      // Example full URL: https://xyz.supabase.co/storage/v1/object/public/apps/folder/image.png
      // We want: folder/image.png (assuming bucket is 'apps')
      
      const publicUrlBase = `${supabaseUrl}/storage/v1/object/public/apps/`;
      if (!screen.imageUrl.startsWith(publicUrlBase)) {
        console.log(`  Skipping: URL does not match expected Supabase apps bucket format.`);
        continue;
      }

      const filePathInBucket = screen.imageUrl.replace(publicUrlBase, '');
      const newFilePathInBucket = filePathInBucket.replace(/\.(png|jpg|jpeg)$/i, '.webp');
      const newFullUrl = `${publicUrlBase}${newFilePathInBucket}`;

      // 2. Download the original image
      console.log(`  Downloading...`);
      const response = await fetch(screen.imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // 3. Compress using Sharp (WebP, 1400px wide, 82% quality)
      console.log(`  Compressing to WebP...`);
      const webpBuffer = await sharp(buffer)
        .resize({ width: 1400, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();

      console.log(`  Size reduced: ${(buffer.length / 1024).toFixed(1)} KB -> ${(webpBuffer.length / 1024).toFixed(1)} KB`);

      // 4. Upload the NEW WebP file alongside the old one
      console.log(`  Uploading new file: ${newFilePathInBucket}`);
      const { error: uploadError } = await supabase.storage
        .from('apps')
        .upload(newFilePathInBucket, webpBuffer, {
          contentType: 'image/webp',
          upsert: false // Fails if it already exists, which is safe
        });

      if (uploadError) {
        // If it already exists, that's fine, we might have run the script before
        if (uploadError.message.includes('already exists')) {
          console.log(`  File already exists in bucket, skipping upload.`);
        } else {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }
      }

      // 5. Update database to point to the new WebP file
      console.log(`  Updating database to new URL...`);
      await prisma.screen.update({
        where: { id: screen.id },
        data: { imageUrl: newFullUrl }
      });

      console.log(`  ✅ Done!`);
      count++;
    } catch (e) {
      console.error(`  ❌ Error processing screen ${screen.id}:`, e);
    }
  }

  console.log(`\n--- MIGRATION COMPLETE ---`);
  console.log(`Successfully migrated ${count}/${screens.length} screens.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
