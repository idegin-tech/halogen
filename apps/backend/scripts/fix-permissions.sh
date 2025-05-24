#!/bin/bash
#
# Fix permissions script for Halogen
# Run this script on your production server to create necessary directories with proper permissions
#

# Create the scripts directory
mkdir -p /home/ubuntu/halogen-scripts
chmod 755 /home/ubuntu/halogen-scripts
chown ubuntu:ubuntu /home/ubuntu/halogen-scripts

# Create the ACME directory
mkdir -p /home/ubuntu/.letsencrypt
chmod 755 /home/ubuntu/.letsencrypt
chown ubuntu:ubuntu /home/ubuntu/.letsencrypt

# Create the Nginx templates directory
mkdir -p /home/ubuntu/nginx-templates
chmod 755 /home/ubuntu/nginx-templates
chown ubuntu:ubuntu /home/ubuntu/nginx-templates

# Create the Nginx configs directory
mkdir -p /home/ubuntu/nginx-configs
chmod 755 /home/ubuntu/nginx-configs
chown ubuntu:ubuntu /home/ubuntu/nginx-configs

echo "Directories created successfully with proper permissions"
