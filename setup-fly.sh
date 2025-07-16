#!/bin/bash

set -e

echo "🛠️  Setting up Fly.io for Halogen Backend"

if ! command -v flyctl &> /dev/null; then
    echo "❌ flyctl is not installed. Please install it first:"
    echo "https://fly.io/docs/hands-on/install-flyctl/"
    exit 1
fi

echo "🔐 Please log in to Fly.io if you haven't already:"
flyctl auth login

echo "📦 Creating Fly.io app..."
flyctl apps create halogen-backend --generate-name || echo "App might already exist"

echo "💾 Creating persistent volume for data..."
flyctl volumes create halogen_data --region iad --size 1 || echo "Volume might already exist"

echo "🗄️  Setting up MongoDB environment variables..."
echo "Please set your MongoDB URI:"
read -p "Enter your MongoDB connection string: " MONGODB_URI

flyctl secrets set MONGODB_URI="$MONGODB_URI"

echo "🔑 Setting other required environment variables..."
read -p "Enter SESSION_SECRET (or press enter for auto-generated): " SESSION_SECRET
if [ -z "$SESSION_SECRET" ]; then
    SESSION_SECRET=$(openssl rand -base64 32)
fi
flyctl secrets set SESSION_SECRET="$SESSION_SECRET"

read -p "Enter JWT_SECRET (or press enter for auto-generated): " JWT_SECRET
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 32)
fi
flyctl secrets set JWT_SECRET="$JWT_SECRET"

read -p "Enter ADMIN_EMAIL: " ADMIN_EMAIL
flyctl secrets set ADMIN_EMAIL="$ADMIN_EMAIL"

read -p "Enter API_ENDPOINT (your domain): " API_ENDPOINT
flyctl secrets set API_ENDPOINT="$API_ENDPOINT"

read -p "Enter REDIS_URL: " REDIS_URL
flyctl secrets set REDIS_URL="$REDIS_URL"

echo "☁️  Setting Cloudinary credentials..."
read -p "Enter CLOUDINARY_CLOUD_NAME: " CLOUDINARY_CLOUD_NAME
flyctl secrets set CLOUDINARY_CLOUD_NAME="$CLOUDINARY_CLOUD_NAME"

read -p "Enter CLOUDINARY_API_KEY: " CLOUDINARY_API_KEY
flyctl secrets set CLOUDINARY_API_KEY="$CLOUDINARY_API_KEY"

read -p "Enter CLOUDINARY_API_SECRET: " CLOUDINARY_API_SECRET
flyctl secrets set CLOUDINARY_API_SECRET="$CLOUDINARY_API_SECRET"

echo "📧 Setting email configuration..."
read -p "Enter EMAIL_HOST: " EMAIL_HOST
flyctl secrets set EMAIL_HOST="$EMAIL_HOST"

read -p "Enter EMAIL_USER: " EMAIL_USER
flyctl secrets set EMAIL_USER="$EMAIL_USER"

read -p "Enter EMAIL_PASS: " EMAIL_PASS
flyctl secrets set EMAIL_PASS="$EMAIL_PASS"

read -p "Enter EMAIL_FROM: " EMAIL_FROM
flyctl secrets set EMAIL_FROM="$EMAIL_FROM"

read -p "Enter PREVIEW_URL: " PREVIEW_URL
flyctl secrets set PREVIEW_URL="$PREVIEW_URL"

echo "✅ Setup complete! You can now deploy with:"
echo "./deploy.sh"
