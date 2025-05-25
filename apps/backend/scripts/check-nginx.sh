#!/bin/bash
#
# Script to check Nginx configuration and status
# This script should be run on the production server
#
# Usage: ./check-nginx.sh
#

set -e

# Default values
VERBOSE=true

# Set up logging
log() {
  if [ "$VERBOSE" = true ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
  fi
}

log_error() {
  echo "[ERROR] [$(date '+%Y-%m-%d %H:%M:%S')] $1" >&2
}

# Function to check Nginx configuration
check_nginx_config() {
  log "Checking Nginx configuration"
  
  # Check if Nginx is installed
  if ! command -v nginx &>/dev/null; then
    log_error "Nginx is not installed"
    return 1
  fi
  
  # Get Nginx version
  nginx_version=$(nginx -v 2>&1)
  log "Nginx version: $nginx_version"
  
  # Test Nginx configuration
  log "Testing Nginx configuration:"
  nginx -t
  
  # Check Nginx status
  log "Checking Nginx service status:"
  systemctl status nginx
  
  return 0
}

# Function to analyze Nginx configuration
analyze_nginx_config() {
  log "Analyzing Nginx configuration"
  
  # Check sites-available directory
  log "Files in sites-available:"
  ls -la /etc/nginx/sites-available/
  
  # Check sites-enabled directory
  log "Files in sites-enabled:"
  ls -la /etc/nginx/sites-enabled/
  
  # Compare sites-available and sites-enabled
  log "Comparing sites-available and sites-enabled:"
  available_count=$(ls -1 /etc/nginx/sites-available/ | wc -l)
  enabled_count=$(ls -1 /etc/nginx/sites-enabled/ | wc -l)
  
  log "Number of configuration files in sites-available: $available_count"
  log "Number of configuration files in sites-enabled: $enabled_count"
  
  if [ "$available_count" -ne "$enabled_count" ]; then
    log_error "Mismatch between sites-available ($available_count) and sites-enabled ($enabled_count)"
    
    # Find configurations that are not enabled
    log "Configurations in sites-available that are not enabled:"
    for config in /etc/nginx/sites-available/*; do
      config_name=$(basename "$config")
      if [ ! -e "/etc/nginx/sites-enabled/$config_name" ]; then
        log "  $config_name"
      fi
    done
  else
    log "All configurations in sites-available are enabled"
  fi
  
  # Check for broken symlinks in sites-enabled
  log "Checking for broken symlinks in sites-enabled:"
  for link in /etc/nginx/sites-enabled/*; do
    if [ ! -e "$link" ]; then
      log_error "Broken symlink: $link"
    fi
  done
  
  return 0
}

# Function to check domain configurations
check_domain_configs() {
  local msuser_configs_dir="/home/msuser/nginx-configs"
  
  log "Checking domain configurations"
  
  # Check if msuser configs directory exists
  if [ -d "$msuser_configs_dir" ]; then
    log "msuser configs directory exists:"
    ls -la "$msuser_configs_dir"
    
    # Compare configs between msuser directory and sites-available
    log "Comparing configurations between msuser directory and sites-available:"
    
    # Check each config in msuser directory
    for config in "$msuser_configs_dir"/*.conf; do
      if [ -f "$config" ]; then
        config_name=$(basename "$config")
        if [ -f "/etc/nginx/sites-available/$config_name" ]; then
          log "Configuration $config_name exists in both locations"
          
          # Compare file contents
          if cmp -s "$config" "/etc/nginx/sites-available/$config_name"; then
            log "  Files are identical"
          else
            log_error "  Files are different"
            log "  Differences:"
            diff "$config" "/etc/nginx/sites-available/$config_name" || true
          fi
        else
          log_error "Configuration $config_name exists in msuser directory but NOT in sites-available"
        fi
      fi
    done
    
    # Check each config in sites-available
    for config in /etc/nginx/sites-available/*.conf; do
      if [ -f "$config" ]; then
        config_name=$(basename "$config")
        if [ ! -f "$msuser_configs_dir/$config_name" ]; then
          log "Configuration $config_name exists in sites-available but NOT in msuser directory"
        fi
      fi
    done
  else
    log_error "msuser configs directory does not exist"
  fi
  
  return 0
}

# Function to check server blocks
check_server_blocks() {
  log "Checking server blocks in Nginx configurations"
  
  # Find all server_name directives in configuration files
  log "Server names in configuration files:"
  grep -r "server_name" --include="*.conf" /etc/nginx/sites-available/ | sort
  
  return 0
}

# Function to check Nginx logs
check_nginx_logs() {
  log "Checking Nginx logs"
  
  # Check error log
  if [ -f "/var/log/nginx/error.log" ]; then
    log "Last 10 lines of Nginx error log:"
    tail -n 10 /var/log/nginx/error.log
  else
    log_error "Nginx error log not found"
  fi
  
  # Check access log
  if [ -f "/var/log/nginx/access.log" ]; then
    log "Last 10 lines of Nginx access log:"
    tail -n 10 /var/log/nginx/access.log
  else
    log_error "Nginx access log not found"
  fi
  
  return 0
}

# Main process
main() {
  log "Starting Nginx configuration check"
  
  # Check Nginx configuration
  check_nginx_config
  
  # Analyze Nginx configuration
  analyze_nginx_config
  
  # Check domain configurations
  check_domain_configs
  
  # Check server blocks
  check_server_blocks
  
  # Check Nginx logs
  check_nginx_logs
  
  log "Nginx configuration check completed"
}

# Run the main process
main
