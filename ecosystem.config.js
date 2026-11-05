module.exports = {
  apps: [
    {
      name: 'ux-api',
      script: 'apps/api/dist/index.js',
      cwd: './',
      instances: 'max', // Scales automatically to all available CPU cores
      exec_mode: 'cluster', // Enables Node.js cluster mode with round-robin load balancing
      watch: false,
      max_memory_restart: '1G', // Automatically restarts if memory exceeds 1GB to prevent leaks
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 4000,
      },
      // Logs configuration
      error_file: './logs/api-err.log',
      out_file: './logs/api-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // Zero-downtime rolling reload configuration
      wait_ready: true,
      listen_timeout: 10000,
      kill_timeout: 5000,
    },
  ],
};

