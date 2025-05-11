# Fly.io Deployment for Halogen Monorepo

This guide provides instructions for deploying the Halogen monorepo to Fly.io.

## Prerequisites

1. Install the Fly.io CLI
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. Log in to your Fly.io account
   ```bash
   fly auth login
   ```

3. Create a Fly.io account if you don't have one
   ```bash
   fly auth signup
   ```

## Initial Setup

1. Run the setup script to create the necessary resources
   ```bash
   bash setup-fly.sh
   ```

   This will:
   - Create a volume for backend logs
   - Initialize each app (backend, frontend, www)
   - Set up the necessary Fly.io configurations

2. Create a `.env.production` file based on the `.env.example` in the backend folder
   ```bash
   cp apps/backend/.env.example apps/backend/.env.production
   ```

3. Edit the `.env.production` file with your production values
   ```bash
   nano apps/backend/.env.production
   ```

4. Set all secrets for the applications
   ```bash
   bash set-fly-secrets.sh
   ```

## Manual Deployment

If you want to deploy manually, use the following commands:

1. Deploy the backend first
   ```bash
   cd apps/backend
   fly deploy
   ```

2. Deploy the frontend
   ```bash
   cd ../frontend
   fly deploy
   ```

3. Deploy the www app
   ```bash
   cd ../www
   fly deploy
   ```

## Using GitHub Actions for Automated Deployment

This repository includes a GitHub Actions workflow that automatically deploys to Fly.io when changes are pushed to the main branch.

To set up GitHub Actions:

1. Add a FLY_API_TOKEN secret to your GitHub repository:
   - Generate a new token: `fly auth token`
   - Add this token as a secret in your GitHub repository settings named `FLY_API_TOKEN`

2. Push changes to the main branch, and the workflow will deploy all applications.

## Configuring Custom Domains

To add a custom domain to any of the applications:

```bash
# For the backend
fly domains add api.yourdomain.com -a halogen-backend

# For the frontend
fly domains add app.yourdomain.com -a halogen-frontend

# For the www app
fly domains add www.yourdomain.com -a halogen-www
fly domains add yourdomain.com -a halogen-www
```

Follow the instructions to configure DNS records for your domain.

## Scaling

To scale an application vertically (more resources per instance):

```bash
fly scale vm shared-cpu-1x --memory 2048 -a halogen-backend
```

To scale horizontally (more instances):

```bash
fly scale count 2 -a halogen-backend
```

## Monitoring

View logs for any application:

```bash
fly logs -a halogen-backend
```

Monitor application status:

```bash
fly status -a halogen-backend
```

## Troubleshooting

- If you encounter database connection issues, make sure your MongoDB instance is accessible from Fly.io's network.
- For CORS errors, verify that the CORS_ORIGIN environment variable includes all your application domains.
- If the deploy fails, check the logs using `fly logs -a halogen-backend`.

## Important Notes

- The backend, frontend, and www applications are deployed separately but can communicate with each other.
- Environment variables are managed as secrets in Fly.io.
- Each application has its own Dockerfile and fly.toml configuration.
- The backend has a persistent volume for logs.
