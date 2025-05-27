module.exports = {
  apps: [
    {
      name: 'halogen-sudo-api',
      script: 'main.py',
      interpreter: 'python3',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        API_PORT: 8082,
        API_HOST: '0.0.0.0',
        API_RELOAD: 'False',
        API_LOG_LEVEL: 'info'
      },
      env_production: {
        NODE_ENV: 'production',
        API_PORT: 8082,
        API_HOST: '0.0.0.0',
        API_RELOAD: 'False',
        API_LOG_LEVEL: 'info',
        NGINX_SITES_AVAILABLE: '/etc/nginx/sites-available',
        NGINX_SITES_ENABLED: '/etc/nginx/sites-enabled',
        NGINX_CONFIG_DIR: '/home/msuser/nginx-configs',
        NGINX_TEMPLATES_DIR: '/home/msuser/nginx-templates',
        WEBROOT_DIR: '/var/www/certbot',
        CERTBOT_LIVE_DIR: '/etc/letsencrypt/live'
      }
    }
  ]
};
