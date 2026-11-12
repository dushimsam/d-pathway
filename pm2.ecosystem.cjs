// pm2 process file for the whole D-Pathway stack (API + web).
const path = require('node:path');
const root = __dirname;

module.exports = {
  apps: [
    {
      name: 'dpathway-api',
      script: 'dist/main.js',
      cwd: path.join(root, 'api'),
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '500M',
      env: { NODE_ENV: 'production', PORT: '3001' },
    },
    {
      name: 'dpathway-web',
      script: 'npm',
      args: 'run start',
      cwd: path.join(root, 'web'),
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '600M',
      env: { NODE_ENV: 'production' },
    },
  ],
};
