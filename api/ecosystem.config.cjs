// pm2 process file. The API runs directly on Node 24 on the Kigali host
// (never containerised); Postgres runs in Docker from docker-compose.yml.
module.exports = {
  apps: [
    {
      name: 'dpathway-api',
      script: 'dist/main.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '400M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
