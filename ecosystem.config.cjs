/** @type {import('@types/pm2').StartOptions} */
module.exports = {
  apps: [
    {
      name: "100t-app",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "/var/www/100t",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
