# Hosting & Deployment Documentation

*This document outlines the infrastructure and deployment architecture for hosting the UX Library on a Hostinger KVM VPS.*

## 1. Server Infrastructure & Dependencies

This phase involves transforming a raw Hostinger KVM VPS into a production-ready web server capable of running Node.js applications and serving them to the public internet.

### OS & Core Packages
The server was initialized with a fresh installation of **Ubuntu 24.04**. Before installing any specific runtimes, we updated the system package repositories and installed essential utilities to ensure the server had the fundamental tools required for building and networking.
- **Commands used:**
  ```bash
  sudo apt update && sudo apt upgrade -y
  sudo apt install -y curl git build-essential nginx ufw postgresql postgresql-contrib
  ```
- *Note:* During `apt upgrade`, the system may prompt for configuration changes to `sshd_config` (OpenSSH). It is critical to select "keep the local version currently installed" to ensure Hostinger's custom SSH login integrations are not overwritten, which would otherwise lock us out of the server.

### Node.js & Package Manager setup
Because Ubuntu's default package manager often distributes an outdated version of Node.js, we fetched the official setup script directly from NodeSource to install **Node.js v20 LTS**. This version provides the necessary modern features for Vite and Prisma.
- **Commands used:**
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
  ```
Once Node.js was installed, we globally installed two critical Node utilities:
- **`pnpm`**: Chosen over `npm` for managing the monorepo workspaces and faster dependency resolution.
- **`pm2`**: A production process manager used to keep the backend API alive continuously.
- **Commands used:**
  ```bash
  sudo npm install -g pnpm pm2
  ```

### Firewall Rules (UFW)
For security, we configured the Uncomplicated Firewall (UFW) to block all unauthorized traffic, only opening the specific ports our applications require:
- **Port 22 (OpenSSH)**: Allows us to continue remotely connecting to the server.
- **Port 80 (HTTP)**: Allows public internet users to access the Client app.
- **Port 8080**: A custom port opened specifically to serve the Admin Dashboard.
- **Commands used:**
  ```bash
  sudo ufw allow OpenSSH
  sudo ufw allow 'Nginx HTTP'
  sudo ufw allow 8080
  sudo ufw --force enable
  ```
*(Note: Port 4000, which the API runs on, was deliberately left closed to the public firewall. External traffic reaches the API securely through Nginx instead).*

## 2. Codebase & Environment Strategy

With the server dependencies installed, the next step was bringing the application source code onto the server securely and configuring it for the live environment.

### GitHub Deploy Keys Setup
To securely clone a private GitHub repository without requiring a personal password, we generated an SSH key directly on the VPS. 
- **Command used:**
  ```bash
  ssh-keygen -t ed25519 -C "vps-deploy-key"
  ```
The resulting public key was added to the repository's **Deploy Keys** in GitHub settings. This restricts the key's access to *only* this repository, which is significantly more secure than tying the server to a personal GitHub account. The repository was then cloned into the standard Linux web directory: `/var/www/ux-library`.

### Monorepo Build Process (Turborepo)
The UX Library is a Turborepo monorepo encompassing an Admin React app, a Client React app, a Node API, and shared packages. 
- Before building, we resolved a breaking change from Turborepo v2 by renaming the `pipeline` key to `tasks` inside `turbo.json`.
- With dependencies installed via `pnpm install`, we compiled all applications simultaneously using `pnpm run build`.

### Environment Variables & Dynamic Routing
A major architectural shift was required to make the React frontend functional in production. Initially, the React apps were hardcoded to fetch data from `http://localhost:4000`. 
1. **Dynamic URL Replacement:** We ran a mass-replace script across 20+ frontend files to dynamically fetch the API URL using `import.meta.env.VITE_API_URL`.
2. **Server `.env` Configuration:** We created `.env` files on the server (`apps/admin/.env` and `apps/client/.env`) setting `VITE_API_URL="http://200.141.5.239"`. This allows the same compiled frontend code to work seamlessly across both local development and the live VPS.
3. **Supabase Auth Configuration:** To enable authentication, `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` were also added to the server's `.env` files. Without these, the frontend defaults to searching for a local Supabase instance (port 54321), which causes login failures.

## 3. Backend Service Management (PM2)

Once the application is built, the backend Node.js API must be executed in a way that keeps it alive indefinitely, even if the terminal is closed or the server reboots.

### Prisma Configuration
Before the backend can successfully start, the Prisma ORM must generate its database client and synchronize with the remote Supabase database.
1. The `apps/api/.env` file was populated with the `DATABASE_URL` pointing to the remote Supabase PostgreSQL instance.
2. We generated the Prisma client inside the `api` workspace:
   ```bash
   npx prisma generate
   ```
*(Note: Because the database schema was already fully managed and migrated in Supabase via the remote connection, running `prisma db push` or `prisma migrate` on the server was unnecessary and avoided).*

### PM2 Daemonization
Instead of running `node dist/index.js` (which would kill the server as soon as the SSH session ended), we used PM2 to daemonize the process.
- **Starting the API:**
  ```bash
  pm2 start dist/index.js --name "ux-api"
  ```
- **Ensuring Persistence on Reboot:**
  To guarantee the API automatically restarts if the VPS experiences a reboot or crash, we ran the PM2 startup script and saved the current process list.
  ```bash
  pm2 startup
  pm2 save
  ```
- **Log Management:**
  PM2 natively handles log rotation and error output. The application logs can be monitored at any time using:
  ```bash
  pm2 logs ux-api
  ```

## 4. Web Server & Reverse Proxy (Nginx)

Nginx is the web server responsible for taking incoming HTTP traffic from the public internet and routing it to the correct static files or backend processes. 

### Frontend Static File Serving
Because the React applications were built using Vite, they are compiled into plain HTML, CSS, and JS files located in their respective `dist` folders. Nginx was configured to serve these directly:
- **Client App (Port 80):** We configured a `server` block listening on port 80 with the `root` pointing to `/var/www/ux-library/apps/client/dist`.
- **Admin App (Port 8080):** We configured a secondary `server` block listening on port 8080 with the `root` pointing to `/var/www/ux-library/apps/admin/dist`.

To ensure React Router works correctly on page refreshes (since it is a Single Page Application), both blocks include a fallback directive:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### Reverse Proxying the API
The backend Node.js API runs on port 4000 (managed by PM2), which is firewalled from the outside world. To allow the frontend apps to securely communicate with it, we created a reverse proxy rule inside both Nginx server blocks.
```nginx
location /api/ {
    proxy_pass http://localhost:4000/api/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```
This tells Nginx: *"If any request comes in starting with `/api/`, do not look for a static file. Instead, forward it internally to `http://localhost:4000/api/` and return the response."*

### Finalizing
Once the configuration was written to `/etc/nginx/nginx.conf`, we tested and restarted the service to bring the entire ecosystem online:
```bash
nginx -t
sudo systemctl restart nginx
```
