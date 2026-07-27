#!/bin/bash

# Exit on error
set -e

echo "Configuring Nginx for UX Library..."

# Create the Nginx configuration file
cat << 'EOF' | sudo tee /etc/nginx/sites-available/ux-library
# Main App (Client) on Port 80
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    root /var/www/ux-library/apps/client/dist;
    index index.html;

    # Serve Client React App
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API Requests to Node.js Backend
    location /api/ {
        proxy_pass http://localhost:4000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Admin App on Port 8080
server {
    listen 8080;
    listen [::]:8080;
    server_name _;

    root /var/www/ux-library/apps/admin/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/ux-library /etc/nginx/sites-enabled/

# Remove the default nginx site to avoid conflicts
sudo rm -f /etc/nginx/sites-enabled/default

# Open port 8080 on the firewall for the Admin panel
sudo ufw allow 8080/tcp

# Test Nginx configuration and restart
sudo nginx -t
sudo systemctl restart nginx

echo "=========================================================="
echo "NGINX CONFIGURED SUCCESSFULLY!"
echo "Your apps are now live on your server's IP address."
echo "Client App: http://YOUR_SERVER_IP"
echo "Admin App:  http://YOUR_SERVER_IP:8080"
echo "API Route:  http://YOUR_SERVER_IP/api"
echo "=========================================================="
