#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "Configuring Nginx for UX Library Staging (dev.zibo.design & dev.admin.zibo.design)..."

# Create the Nginx configuration file for staging
cat << 'EOF' | sudo tee /etc/nginx/sites-available/ux-library-staging
# 1. Staging Client & API Proxy (dev.zibo.design)
server {
    listen 80;
    listen [::]:80;
    server_name dev.zibo.design;

    root /var/www/ux-library-staging/apps/client/dist;
    index index.html;

    # Serve Client React App
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API Requests to Staging Node.js Backend on port 5000
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Proxy WebSocket / Socket.io Connections to Staging Backend
    location /socket.io/ {
        proxy_pass http://localhost:5000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 2. Staging Admin App (dev.admin.zibo.design)
server {
    listen 80;
    listen [::]:80;
    server_name dev.admin.zibo.design;

    root /var/www/ux-library-staging/apps/admin/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

# Enable the staging site in Nginx
sudo ln -sf /etc/nginx/sites-available/ux-library-staging /etc/nginx/sites-enabled/

# Test Nginx configuration and reload
sudo nginx -t
sudo systemctl reload nginx

echo "=========================================================="
echo "STAGING NGINX CONFIGURED SUCCESSFULLY!"
echo "Client App: http://dev.zibo.design"
echo "Admin App:  http://dev.admin.zibo.design"
echo "API Route:  http://dev.zibo.design/api"
echo "=========================================================="
echo "Next: Run Certbot to enable HTTPS for both subdomains:"
echo "sudo certbot --nginx -d dev.zibo.design -d dev.admin.zibo.design"
echo "=========================================================="
