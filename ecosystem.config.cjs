module.exports = {
  apps: [
    {
      name: 'support-portal',
      cwd: '/opt/support-portal',
      script: 'server/index.js',
      node_args: '--env-file=server/.env',
      env: { NODE_ENV: 'production' },
      autorestart: true,
      max_restarts: 10,
    },
  ],
};
