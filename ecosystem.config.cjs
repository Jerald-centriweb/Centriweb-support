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
    {
      // Manual-trigger endpoint for the Notion -> guides sync (own process/
      // port, 127.0.0.1:4301 — see server/notion-sync-server.mjs for why this
      // is deliberately not a route on the main support-portal app). The
      // recurring sync itself runs from cron (server/notion-sync.mjs), not
      // from this process; this just lets a change be pushed immediately via
      // POST /trigger instead of waiting for the next scheduled tick.
      name: 'support-portal-notion-sync',
      cwd: '/opt/support-portal',
      script: 'server/notion-sync-server.mjs',
      node_args: '--env-file=server/.env --env-file-if-exists=.secrets/notion.env',
      env: { NODE_ENV: 'production' },
      autorestart: true,
      max_restarts: 10,
    },
  ],
};
