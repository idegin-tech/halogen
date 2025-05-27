#!/bin/sh
# This script ensures all shell scripts are executable when deployed to Linux
# Run this script after deploying to a Linux server

chmod +x setup.sh
chmod +x start-dev.sh
chmod +x start-prod.sh
chmod +x start.sh
echo "Made all scripts executable."
