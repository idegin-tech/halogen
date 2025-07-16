#!/bin/bash

# Halogen General Deployment Script
# This script handles both local production setup and Fly.io deployment

set -e

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Change to the root directory of the project
cd "$SCRIPT_DIR"

echo "🚀 Starting Halogen deployment..."
echo "📁 Current directory: $(pwd)"

# Function to display usage
usage() {
    echo "Usage: $0 [local|fly|help]"
    echo ""
    echo "Commands:"
    echo "  local  - Deploy locally using Docker"
    echo "  fly    - Deploy to Fly.io"
    echo "  help   - Show this help message"
    echo ""
    exit 1
}

# Function for local deployment
deploy_local() {
    echo "🏠 Starting local deployment..."
    
    # Verify Docker is running
    if ! docker info &> /dev/null; then
        echo "❌ Error: Docker is not running"
        echo "Please start Docker and try again"
        exit 1
    fi
    
    echo "✅ Docker is running"
    
    # Build the Docker image
    echo "🏗️  Building Docker image..."
    docker build -t halogen:latest .
    
    # Stop existing container if running
    echo "🛑 Stopping existing container..."
    docker stop halogen-app 2>/dev/null || true
    docker rm halogen-app 2>/dev/null || true
    
    # Run the container
    echo "🚀 Starting Halogen container..."
    docker run -d \
        --name halogen-app \
        -p 80:80 \
        -v halogen_mongodb_data:/data/db \
        -v halogen_logs:/app/logs \
        --env-file .env \
        halogen:latest
    
    echo "🎉 Local deployment completed successfully!"
    echo "🌐 Your app should be available at: http://localhost"
    
    # Show container status
    echo ""
    echo "📊 Container status:"
    docker ps | grep halogen-app
}

# Function for Fly.io deployment
deploy_fly() {
    echo "☁️  Starting Fly.io deployment..."
    
    # Run the Fly.io deployment script
    bash deploy-fly.sh
}

# Parse command line arguments
case "${1:-help}" in
    local)
        deploy_local
        ;;
    fly)
        deploy_fly
        ;;
    help|*)
        usage
        ;;
esac