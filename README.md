# Halogen Website Builder Platform

## Domain Verification System

Halogen's domain verification system allows users to connect custom domains to their projects. The system verifies domain ownership using DNS TXT records before setting up website configuration.

### Key Components

1. **Project-Level Verification Tokens**
   - Each project has a persistent verification token
   - Tokens are stored in the Project model and used for all domains in that project
   - Tokens are generated when a domain is added if one doesn't already exist

2. **Domain Verification Process**
   - When a user adds a domain, they must add a TXT record to their DNS settings
   - The TXT record contains the project's verification token
   - The system periodically checks for the presence of this token
   - Once verified, the domain status changes to "Active"

3. **Domain Management**
   - Users can remove domains at any stage of verification
   - Domain removal cleans up all associated configurations
   - SSL certificates are automatically generated for verified domains

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