#!/bin/bash

# Start Real Data System
# This script starts the complete arbitrage betting system using only real data from the Odds API

echo "Starting Sport Arbitrage System with REAL DATA ONLY..."
echo "======================================================"

# Check if .env file exists, if not create it
if [ ! -f .env ]; then
  echo "Creating .env file with default settings..."
  cat > .env << EOL
# Odds API Configuration
ODDS_API_KEY=24941339955c373fe2eced8f5c5a0f88

# Server Configuration
PORT=3001

# Cache Configuration
CACHE_DURATION_MINUTES=15

# Odds API Settings
USE_MOCK_DATA=false
USE_ODDS_API_ONLY=true
EOL
  echo "Created .env file. Please edit it with your actual API key."
else
  echo ".env file found, continuing..."
fi

# Create required directories if they don't exist
mkdir -p odds-data
mkdir -p cache
mkdir -p public/api

# Initial data fetch using real data only
echo "Performing initial data fetch from The Odds API..."
node fetch-real-odds.js all

# Start the odds refresh in the background
echo "Starting automated odds refresh process..."
(
  while true; do
    echo "Refreshing odds data..."
    node fetch-real-odds.js all
    echo "Waiting 15 minutes before next refresh..."
    sleep 900
  done
) &
ODDS_REFRESH_PID=$!
echo "Odds refresh process started with PID: $ODDS_REFRESH_PID"

# Save the PID for later cleanup
echo $ODDS_REFRESH_PID > odds_refresh_pid.txt

# Start the real data server
echo "Starting Real Data API server..."
node real-odds-server.js &
SERVER_PID=$!
echo "Real Data API server started with PID: $SERVER_PID"

# Save the PID for later cleanup
echo $SERVER_PID > server_pid.txt

# Start the frontend development server
echo "Starting frontend development server..."
npm run dev &
FRONTEND_PID=$!
echo "Frontend development server started with PID: $FRONTEND_PID"

# Save the PID for later cleanup
echo $FRONTEND_PID > frontend_pid.txt

echo ""
echo "System is now running!"
echo "- API server: http://localhost:3001/api/odds"
echo "- Frontend: http://localhost:5173"
echo ""
echo "To stop all services, run: ./stop-real-data-system.sh"

# Trap to clean up child processes on exit
trap "kill $ODDS_REFRESH_PID $SERVER_PID $FRONTEND_PID 2>/dev/null" EXIT

# Wait for user to press Ctrl+C
echo "Press Ctrl+C to stop all services..."
wait 