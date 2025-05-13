### Nginx
- Edit Nginx config <br/> ```sudo nano /etc/nginx/sites-available/mortarstudio```

- Fresh linking <br /> ```sudo ln -s /etc/nginx/sites-available/mortarstudio /etc/nginx/sites-enabled/```

- Move edits to sites enables <br/> ```sudo ln -s /etc/nginx/sites-available/mortarstudio /etc/nginx/sites-enabled/```
  
- Test Nginx config<br/> ```sudo nginx -t && sudo systemctl reload nginx```

- Delete and replace old link ```sudo rm /etc/nginx/sites-enabled/mortarstudio``` and run ```sudo ln -s /etc/nginx/sites-available/mortarstudio /etc/nginx/sites-enabled/```

- Restart Nginx: ```sudo systemctl restart nginx```