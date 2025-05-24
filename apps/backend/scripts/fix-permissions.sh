#!/bin/bash
#
# Fix permissions script for Halogen
# Run this script on your production server to create necessary directories with proper permissions
#

# Create the scripts directory
mkdir -p /home/msuser/halogen-scripts
chmod 755 /home/msuser/halogen-scripts
chown msuser:msuser /home/msuser/halogen-scripts

# Create the ACME directory
mkdir -p /home/msuser/.letsencrypt
chmod 755 /home/msuser/.letsencrypt
chown msuser:msuser /home/msuser/.letsencrypt

# Create the Nginx templates directory
mkdir -p /home/msuser/nginx-templates
chmod 755 /home/msuser/nginx-templates
chown msuser:msuser /home/msuser/nginx-templates

# Create the Nginx configs directory
mkdir -p /home/msuser/nginx-configs
chmod 755 /home/msuser/nginx-configs
chown msuser:msuser /home/msuser/nginx-configs

echo "Directories created successfully with proper permissions"
