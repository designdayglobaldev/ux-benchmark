#!/bin/bash

# Exit on error
set -e

echo "Starting Ubuntu 24.04 Server Setup for UX Library Monorepo..."

# 1. Update and install basic dependencies
echo "Updating packages..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential nginx ufw postgresql postgresql-contrib

# 2. Install Node.js v20 LTS
echo "Installing Node.js v20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Install Global NPM packages (pnpm, pm2)
echo "Installing pnpm and pm2..."
sudo npm install -g pnpm pm2

# 4. Setup Firewall
echo "Configuring UFW Firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'

# 5. Database Setup (PostgreSQL)
echo "Setting up PostgreSQL database..."
sudo -u postgres psql -c "CREATE DATABASE ux_library_db;" || true
sudo -u postgres psql -c "CREATE USER ux_admin WITH PASSWORD 'secure_password_here';" || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ux_library_db TO ux_admin;" || true

# 6. Generate SSH Key for GitHub
echo "Generating SSH key for GitHub..."
if [ ! -f ~/.ssh/id_rsa ]; then
  ssh-keygen -t rsa -b 4096 -C "server@hostinger" -N "" -f ~/.ssh/id_rsa
fi

echo "=========================================================="
echo "SERVER PROVISIONING COMPLETE!"
echo "=========================================================="
echo "Next Steps:"
echo "1. Run 'sudo ufw enable' to turn on the firewall."
echo "2. Copy the SSH key below and add it to your GitHub account (Settings -> SSH Keys):"
cat ~/.ssh/id_rsa.pub
echo "=========================================================="
echo "3. After adding the key to GitHub, clone your repo:"
echo "   mkdir -p /var/www"
echo "   cd /var/www"
echo "   git clone git@github.com:YOUR_USERNAME/ux-library.git"
echo "4. CD into the directory and run 'pnpm install' and 'pnpm run build'"
echo "=========================================================="
