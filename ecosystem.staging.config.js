module.exports = {
  apps: [
    {
      name: 'ux-api-staging',
      script: 'apps/api/dist/index.js',
      cwd: '/var/www/ux-library-staging',
      instances: 1, // Staging runs on single instance to keep resources light
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'staging',
        PORT: 5000,
      },
      // Logs configuration
      error_file: './logs/staging-api-err.log',
      out_file: './logs/staging-api-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // Zero-downtime reload configuration
      wait_ready: true,
      listen_timeout: 10000,
      kill_timeout: 5000,
    },
  ],
};
