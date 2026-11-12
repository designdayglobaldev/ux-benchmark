#!/bin/bash

# Exit on error
set -e

echo "Deploying updates to UX Library Staging (/var/www/ux-library-staging)..."

cd /var/www/ux-library-staging

# 1. Pull latest changes from staging
git fetch origin staging
git checkout staging
git pull origin staging

# 2. Install dependencies
pnpm install

# 3. Prisma generate & migrate
cd apps/api
npx prisma generate
npx prisma migrate deploy || true
cd ../..

# 4. Build all workspaces
pnpm run build

# 5. Reload PM2 process
pm2 restart ecosystem.staging.config.js || pm2 start ecosystem.staging.config.js

echo "=========================================================="
echo "STAGING DEPLOYMENT COMPLETE!"
echo "Live at: https://dev.zibo.design"
echo "Admin at: https://dev.admin.zibo.design"
echo "=========================================================="
