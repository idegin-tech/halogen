#!/bin/bash
# Script to set secrets for Fly.io applications

# Navigate to backend directory 
cd "$(dirname "$0")/apps/backend" || exit

# Load env file
ENV_FILE=".env.production"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: $ENV_FILE not found!"
  echo "Please create a .env.production file in apps/backend with your production environment variables."
  exit 1
fi

echo "=========================================="
echo "     Setting Fly.io Secrets Script       "
echo "=========================================="
echo ""

# Backend Secrets
echo "Setting secrets for halogen-backend..."
while IFS= read -r line || [[ -n "$line" ]]; do
  # Skip comments and empty lines
  [[ "$line" =~ ^#.*$ ]] && continue
  [[ -z "$line" ]] && continue
  
  # Extract variable name and value
  KEY=$(echo "$line" | cut -d '=' -f 1)
  VALUE=$(echo "$line" | cut -d '=' -f 2-)
  
  echo "Setting $KEY..."
  flyctl secrets set "$KEY"="$VALUE" --app halogen-backend
done < "$ENV_FILE"

# Frontend Secrets
echo ""
echo "Setting secrets for halogen-frontend..."
flyctl secrets set NEXT_PUBLIC_API_URL=https://halogen-backend.fly.dev --app halogen-frontend

# WWW Secrets
echo ""
echo "Setting secrets for halogen-www..."
flyctl secrets set NEXT_PUBLIC_API_URL=https://halogen-backend.fly.dev --app halogen-www

echo ""
echo "All secrets have been set successfully!"
echo "Return to the root directory"
cd ../../
