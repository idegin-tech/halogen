#!/bin/bash
#
# Script to check and verify sudo permissions for the msuser account
# This script should be run on the production server
#
# Usage: ./check-sudoers.sh
#

set -e

# Default values
VERBOSE=true
USER="msuser"

# Set up logging
log() {
  if [ "$VERBOSE" = true ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
  fi
}

log_error() {
  echo "[ERROR] [$(date '+%Y-%m-%d %H:%M:%S')] $1" >&2
}

# Function to check if running as root
check_root() {
  if [ "$(id -u)" -ne 0 ]; then
    log_error "This script must be run as root"
    exit 1
  fi
}

# Function to check sudoers.d configuration
check_sudoers() {
  local user="$1"
  
  log "Checking sudoers configuration for $user"
  
  # Check if the user exists
  if ! id "$user" &>/dev/null; then
    log_error "User $user does not exist"
    return 1
  fi
  
  # Check sudoers.d directory
  if [ -d "/etc/sudoers.d" ]; then
    log "Sudoers.d directory exists"
    
    # List files in sudoers.d
    log "Files in /etc/sudoers.d:"
    ls -la /etc/sudoers.d
    
    # Check for files related to the user
    log "Checking for $user in sudoers.d files:"
    grep -r "$user" /etc/sudoers.d/ || log "No entries found for $user in sudoers.d"
  else
    log_error "Sudoers.d directory does not exist"
    return 1
  fi
  
  # Check main sudoers file
  log "Checking main sudoers file for $user:"
  grep "$user" /etc/sudoers || log "No entries found for $user in main sudoers file"
  
  # Check sudo permissions for the user
  log "Checking sudo permissions for $user:"
  sudo -l -U "$user" || log_error "Failed to get sudo permissions for $user"
  
  return 0
}

# Function to verify nginx permissions
check_nginx_permissions() {
  local user="$1"
  
  log "Checking Nginx directory permissions"
  
  # Check if Nginx directories exist
  if [ -d "/etc/nginx/sites-available" ]; then
    log "Nginx sites-available directory exists:"
    ls -la /etc/nginx/sites-available/
    
    # Check ownership and permissions
    log "Ownership and permissions of /etc/nginx/sites-available:"
    stat -c "%U:%G %a" /etc/nginx/sites-available/
  else
    log_error "Nginx sites-available directory does not exist"
  fi
  
  if [ -d "/etc/nginx/sites-enabled" ]; then
    log "Nginx sites-enabled directory exists:"
    ls -la /etc/nginx/sites-enabled/
    
    # Check ownership and permissions
    log "Ownership and permissions of /etc/nginx/sites-enabled:"
    stat -c "%U:%G %a" /etc/nginx/sites-enabled/
  else
    log_error "Nginx sites-enabled directory does not exist"
  fi
  
  # Check if user can write to Nginx directories
  log "Testing if $user can write to Nginx directories:"
  sudo -u "$user" touch /etc/nginx/sites-available/test-file.conf && \
    log "User $user can write to sites-available" && \
    rm /etc/nginx/sites-available/test-file.conf || \
    log_error "User $user CANNOT write to sites-available"
  
  # Check if user can create symlinks in sites-enabled
  log "Testing if $user can create symlinks in sites-enabled:"
  sudo -u "$user" ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/test-link && \
    log "User $user can create symlinks in sites-enabled" && \
    rm /etc/nginx/sites-enabled/test-link || \
    log_error "User $user CANNOT create symlinks in sites-enabled"
  
  return 0
}

# Function to check local config directories
check_local_configs() {
  local user="$1"
  
  log "Checking local Nginx config directories"
  
  # Check if local directories exist
  if [ -d "/home/$user/nginx-templates" ]; then
    log "nginx-templates directory exists:"
    ls -la /home/$user/nginx-templates/
    
    # Check ownership and permissions
    log "Ownership and permissions of /home/$user/nginx-templates:"
    stat -c "%U:%G %a" /home/$user/nginx-templates/
    
    # List the template files
    if [ "$(ls -A /home/$user/nginx-templates/)" ]; then
      log "Template files:"
      for file in /home/$user/nginx-templates/*; do
        log "File: $file"
        head -n 3 "$file"
        echo "..."
      done
    else
      log_error "No template files found in /home/$user/nginx-templates/"
    fi
  else
    log_error "nginx-templates directory does not exist"
  fi
  
  if [ -d "/home/$user/nginx-configs" ]; then
    log "nginx-configs directory exists:"
    ls -la /home/$user/nginx-configs/
    
    # Check ownership and permissions
    log "Ownership and permissions of /home/$user/nginx-configs:"
    stat -c "%U:%G %a" /home/$user/nginx-configs/
    
    # List the config files
    if [ "$(ls -A /home/$user/nginx-configs/)" ]; then
      log "Config files:"
      for file in /home/$user/nginx-configs/*.conf; do
        if [ -f "$file" ]; then
          log "Config file: $file"
          # Check if corresponding file exists in sites-available
          domain=$(basename "$file")
          if [ -f "/etc/nginx/sites-available/$domain" ]; then
            log "Corresponding file exists in sites-available"
          else
            log_error "NO corresponding file in sites-available for $domain"
          fi
        fi
      done
    else
      log_error "No config files found in /home/$user/nginx-configs/"
    fi
  else
    log_error "nginx-configs directory does not exist"
  fi
  
  return 0
}

# Function to check script permissions
check_script_permissions() {
  local user="$1"
  
  log "Checking script permissions"
  
  # Check if scripts directory exists
  if [ -d "/home/$user/halogen-scripts" ]; then
    log "halogen-scripts directory exists:"
    ls -la /home/$user/halogen-scripts/
    
    # Check ownership and permissions
    log "Ownership and permissions of /home/$user/halogen-scripts:"
    stat -c "%U:%G %a" /home/$user/halogen-scripts/
    
    # Check setup-domain.sh specifically
    if [ -f "/home/$user/halogen-scripts/setup-domain.sh" ]; then
      log "setup-domain.sh exists:"
      stat -c "%U:%G %a" /home/$user/halogen-scripts/setup-domain.sh
      
      # Check if executable
      if [ -x "/home/$user/halogen-scripts/setup-domain.sh" ]; then
        log "setup-domain.sh is executable"
      else
        log_error "setup-domain.sh is NOT executable"
      fi
    else
      log_error "setup-domain.sh does not exist"
    fi
  else
    log_error "halogen-scripts directory does not exist"
  fi
  
  return 0
}

# Main process
main() {
  check_root
  
  log "Starting permission verification for $USER"
  
  # Check sudoers configuration
  check_sudoers "$USER"
  
  # Check Nginx permissions
  check_nginx_permissions "$USER"
  
  # Check local config directories
  check_local_configs "$USER"
  
  # Check script permissions
  check_script_permissions "$USER"
  
  log "Permission verification completed"
}

# Run the main process
main
