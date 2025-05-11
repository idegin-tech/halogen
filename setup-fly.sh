#!/bin/bash
# Script to help with initial Fly.io setup and deployment

echo "=========================================="
echo "     Fly.io Deployment Setup Script      "
echo "=========================================="
echo ""

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo "Installing Fly.io CLI tool..."
    # For Windows using WSL/Git Bash
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        echo "Detected Windows environment"
        powershell.exe -Command "iwr https://fly.io/install.ps1 -useb | iex"
    else
        # For Linux/macOS
        curl -L https://fly.io/install.sh | sh
        export FLYCTL_INSTALL="$HOME/.fly"
        export PATH="$FLYCTL_INSTALL/bin:$PATH"
    fi
fi

# Authenticate with Fly.io
echo "Authenticating with Fly.io..."
echo "Please login to your Fly.io account:"
flyctl auth login

# Create volumes for backend logs
echo "Creating volume for backend logs..."
flyctl volumes create halogen_logs --region dfw --size 1 -a halogen-backend

# Launch backend
echo "Launching backend application..."
cd apps/backend || exit
flyctl launch --dockerfile Dockerfile --no-deploy

# Launch frontend
echo "Launching frontend application..."
cd ../frontend || exit
flyctl launch --dockerfile Dockerfile --no-deploy

# Launch www
echo "Launching www application..."
cd ../www || exit
flyctl launch --dockerfile Dockerfile --no-deploy

# Return to the root directory
cd ../../ || exit

echo ""
echo "Setup completed! You can now deploy your applications using:"
echo "cd apps/backend && flyctl deploy"
echo "cd apps/frontend && flyctl deploy"
echo "cd apps/www && flyctl deploy"
echo ""
echo "Or use the GitHub Actions workflow for automated deployments"
