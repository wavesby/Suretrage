#!/bin/bash

# Combined script to start the Odds API system and server

# Default refresh interval in seconds (30 minutes)
REFRESH_INTERVAL=${1:-1800}

# Make sure the scripts are executable
chmod +x start-odds-api-refresh.sh

# Create logs directory if it doesn't exist
mkdir -p logs

# Function to display a timestamp message
timestamp() {
  echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1"
}

# Check if the .env file exists
if [ ! -f .env ]; then
  timestamp "Creating .env file with API key"
  echo "ODDS_API_KEY=24941339955c373fe2eced8f5c5a0f88" > .env
fi

# Kill any existing processes
stop_processes() {
  timestamp "Stopping any existing processes..."
  pkill -f "node refresh-odds-api.js" 2>/dev/null
  pkill -f "node server.js" 2>/dev/null
  sleep 2
}

# Start the refresh script in the background
start_refresh_service() {
  timestamp "Starting Odds API refresh service..."
  ./start-odds-api-refresh.sh $REFRESH_INTERVAL > logs/odds-api-refresh.log 2>&1 &
  REFRESH_PID=$!
  timestamp "Odds API refresh service started with PID: $REFRESH_PID"
}

# Run initial refresh to make sure we have data
run_initial_refresh() {
  timestamp "Running initial odds data refresh..."
  node refresh-odds-api.js 1xbet betway > logs/initial-refresh.log 2>&1
  
  if [ $? -eq 0 ]; then
    timestamp "Initial odds data refresh completed successfully"
  else
    timestamp "WARNING: Initial odds data refresh failed, check logs/initial-refresh.log"
  fi
}

# Start the server
start_server() {
  timestamp "Starting API server..."
  node server.js > logs/server.log 2>&1 &
  SERVER_PID=$!
  timestamp "API server started with PID: $SERVER_PID"
}

# Function to handle shutdown
cleanup() {
  timestamp "Shutting down..."
  pkill -f "node refresh-odds-api.js" 2>/dev/null
  pkill -f "node server.js" 2>/dev/null
  exit 0
}

# Set up cleanup on Ctrl+C
trap cleanup SIGINT SIGTERM

# Stop any existing processes
stop_processes

# Run the initial refresh to ensure we have data
run_initial_refresh

# Start the server and refresh service
start_refresh_service
start_server

# Display info message
timestamp "System started successfully"
timestamp "Server API available at http://localhost:3001/api/odds"
timestamp "Odds data will refresh every $REFRESH_INTERVAL seconds"
timestamp "Press Ctrl+C to stop all services"

# Keep the script running to allow for easy shutdown with Ctrl+C
while true; do
  sleep 1
done 