module.exports = {
  apps: [
    {
      name: 'darsnote-web',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/darsnote',
      env_file: '.env.production',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      max_memory_restart: '512M',
      restart_delay: 3000,
      max_restarts: 10,
      watch: false,
    },
    {
      name: 'darsnote-worker',
      script: 'npm',
      args: 'run worker',
      cwd: '/var/www/darsnote',
      env_file: '.env.production',
      env_production: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '512M',
      restart_delay: 5000,
      max_restarts: 10,
      watch: false,
    },
  ],
};
