#!/bin/bash

# Start the complete system: API server, odds refresh, and frontend

# Function to display a timestamp message
timestamp() {
  echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1"
}

# Function to handle cleanup when script exits
cleanup() {
  timestamp "Shutting down all services..."
  
  # Stop the frontend
  if [ ! -z "$FRONTEND_PID" ]; then
    timestamp "Stopping frontend (PID: $FRONTEND_PID)"
    kill $FRONTEND_PID 2>/dev/null || true
  fi
  
  # Stop the API server and odds refresh
  ./start-odds-system.sh cleanup || true
  
  exit 0
}

# Set up trap for graceful shutdown
trap cleanup SIGINT SIGTERM

# Make this script executable
chmod +x start-odds-system.sh

# Step 1: Start the API server and odds refresh
timestamp "Starting API server and odds refresh service..."
./start-odds-system.sh &
ODDS_SYSTEM_PID=$!
timestamp "Odds system started with PID: $ODDS_SYSTEM_PID"

# Step 2: Wait for the API server to be ready
timestamp "Waiting for API server to be ready..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if curl -s http://localhost:3001/health > /dev/null; then
    timestamp "API server is ready"
    break
  fi
  
  RETRY_COUNT=$((RETRY_COUNT + 1))
  sleep 1
  
  if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    timestamp "ERROR: API server failed to start after $MAX_RETRIES seconds"
    cleanup
    exit 1
  fi
done

# Step 3: Start the frontend development server
timestamp "Starting frontend development server..."
npm run dev &
FRONTEND_PID=$!
timestamp "Frontend started with PID: $FRONTEND_PID"

# Display URLs
timestamp "System started successfully!"
timestamp "API server: http://localhost:3001/api/odds"
timestamp "Frontend: http://localhost:5173"
timestamp "Press Ctrl+C to stop all services"

# Keep the script running
while true; do
  sleep 1
done 