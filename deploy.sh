#!/bin/bash

set -e

echo "🚀 Deploying Halogen Backend to Fly.io"

if ! command -v flyctl &> /dev/null; then
    echo "❌ flyctl is not installed. Please install it first:"
    echo "https://fly.io/docs/hands-on/install-flyctl/"
    exit 1
fi

if [ ! -f "fly.toml" ]; then
    echo "❌ fly.toml not found. Make sure you're in the project root."
    exit 1
fi

echo "📦 Building and deploying..."
flyctl deploy

echo "✅ Deployment complete!"
echo "🔗 Your app should be available at: https://halogen-backend.fly.dev"

echo "📊 Checking app status..."
flyctl status

echo "📋 To view logs, run: flyctl logs"
echo "🔧 To scale up/down, run: flyctl scale count 2"
