### Migration

When updating to the new system, run the migration script to generate verification tokens for existing projects:

```bash
node apps/backend/scripts/generate-project-tokens.js
```

## Nginx Configuration
- Edit Nginx config <br/> ```sudo nano /etc/nginx/sites-available/mortarstudio```

- Fresh linking <br /> ```sudo ln -s /etc/nginx/sites-available/mortarstudio /etc/nginx/sites-enabled/```

- Move edits to sites enables <br/> ```sudo ln -s /etc/nginx/sites-available/mortarstudio /etc/nginx/sites-enabled/```
  
- Test Nginx config<br/> ```sudo nginx -t && sudo systemctl reload nginx```

- Delete and replace old link ```sudo rm /etc/nginx/sites-enabled/mortarstudio``` and run ```sudo ln -s /etc/nginx/sites-available/mortarstudio /etc/nginx/sites-enabled/```

- Restart Nginx: ```sudo systemctl restart nginx```






```/etc/sudoers.d/msuser```
msuser ALL=(ALL) NOPASSWD: /bin/cp /home/msuser/nginx-configs/* /etc/nginx/sites-available/
msuser ALL=(ALL) NOPASSWD: /bin/ln -s /etc/nginx/sites-available/* /etc/nginx/sites-enabled/
msuser ALL=(ALL) NOPASSWD: /bin/rm /etc/nginx/sites-enabled/*
msuser ALL=(ALL) NOPASSWD: /usr/sbin/nginx -t
msuser ALL=(ALL) NOPASSWD: /usr/sbin/nginx -s reload
msuser ALL=(ALL) NOPASSWD: /usr/bin/certbot
msuser ALL=(ALL) NOPASSWD: /bin/mkdir -p /var/www/certbot
msuser ALL=(ALL) NOPASSWD: /bin/chown -R www-data\:www-data /var/www/certbot
msuser ALL=(ALL) NOPASSWD: /bin/chmod -R 755 /var/www/certbot
msuser ALL=(ALL) NOPASSWD: /bin/mkdir -p /var/www/certbot*
msuser ALL=(ALL) NOPASSWD: /bin/chown -R www-data\:www-data /var/www/certbot*
msuser ALL=(ALL) NOPASSWD: /bin/chmod -R 755 /var/www/certbot*
msuser ALL=(ALL) NOPASSWD: /bin/chown -R www-data\:www-data /var/www/certbot*
msuser ALL=(ALL) NOPASSWD: /bin/chmod -R 755 /var/www/certbot*
msuser ALL=(ALL) NOPASSWD: /bin/systemctl is-active --quiet nginx
msuser ALL=(ALL) NOPASSWD: /bin/ls -la /etc/nginx/sites-enabled/
msuser ALL=(ALL) NOPASSWD: /bin/systemctl status nginx
msuser ALL=(ALL) NOPASSWD: /bin/mkdir -p /var/www/certbot/.well-known/acme-challenge
msuser ALL=(ALL) NOPASSWD: /bin/echo * | /usr/bin/tee /var/www/certbot/.well-known/acme-challenge/*
msuser ALL=(ALL) NOPASSWD: /bin/chmod 644 /var/www/certbot/.well-known/acme-challenge/*
msuser ALL=(ALL) NOPASSWD: /bin/rm -f /var/www/certbot/.well-known/acme-challenge/*
msuser ALL=(ALL) NOPASSWD: /usr/sbin/nginx -t
msuser ALL=(ALL) NOPASSWD: /usr/sbin/nginx -s reload
msuser ALL=(ALL) NOPASSWD: /usr/bin/test -f *
msuser ALL=(ALL) NOPASSWD: /usr/bin/openssl x509 -in * -noout -dates