#!/bin/bash

# Script to periodically refresh odds data from The Odds API

# Set the refresh interval in seconds (default: 30 minutes)
REFRESH_INTERVAL=${1:-1800}

# Default bookmakers to use
BOOKMAKERS="1xbet betway"

# Ensure we're in the project root
cd "$(dirname "$0")"

# Function to display a timestamp message
timestamp() {
  echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1"
}

# Function to handle SIGINT (Ctrl+C)
handle_interrupt() {
  timestamp "Stopping odds API refresh service..."
  exit 0
}

# Set up the interrupt handler
trap handle_interrupt SIGINT

# Display start message
timestamp "Starting Odds API refresh service"
timestamp "Using bookmakers: $BOOKMAKERS"
timestamp "Refresh interval: $REFRESH_INTERVAL seconds"

# Create log directory if it doesn't exist
mkdir -p logs

# Main loop to refresh data periodically
while true; do
  LOG_FILE="logs/odds-api-refresh-$(date +"%Y%m%d").log"
  
  # Run the odds refresh script and log output
  timestamp "Refreshing odds data..." | tee -a "$LOG_FILE"
  node refresh-odds-api.js $BOOKMAKERS 2>&1 | tee -a "$LOG_FILE"
  
  # Check if refresh was successful
  if [ $? -eq 0 ]; then
    timestamp "Odds data refresh completed successfully" | tee -a "$LOG_FILE"
  else
    timestamp "ERROR: Odds data refresh failed" | tee -a "$LOG_FILE"
  fi
  
  # Wait for the next refresh interval
  timestamp "Waiting $REFRESH_INTERVAL seconds until next refresh..." | tee -a "$LOG_FILE"
  sleep $REFRESH_INTERVAL
done 