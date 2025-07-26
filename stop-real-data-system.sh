#!/bin/bash

# Stop Real Data System
# This script stops all services started by start-real-data-system.sh

echo "Stopping Sport Arbitrage System..."

# Stop the odds refresh process
if [ -f odds_refresh_pid.txt ]; then
  ODDS_REFRESH_PID=$(cat odds_refresh_pid.txt)
  if ps -p $ODDS_REFRESH_PID > /dev/null; then
    echo "Stopping odds refresh process (PID: $ODDS_REFRESH_PID)..."
    kill $ODDS_REFRESH_PID
    rm odds_refresh_pid.txt
  else
    echo "Odds refresh process is not running."
    rm odds_refresh_pid.txt
  fi
else
  echo "No odds refresh PID file found."
fi

# Stop the server
if [ -f server_pid.txt ]; then
  SERVER_PID=$(cat server_pid.txt)
  if ps -p $SERVER_PID > /dev/null; then
    echo "Stopping API server (PID: $SERVER_PID)..."
    kill $SERVER_PID
    rm server_pid.txt
  else
    echo "API server is not running."
    rm server_pid.txt
  fi
else
  echo "No server PID file found."
fi

# Stop the frontend development server
if [ -f frontend_pid.txt ]; then
  FRONTEND_PID=$(cat frontend_pid.txt)
  if ps -p $FRONTEND_PID > /dev/null; then
    echo "Stopping frontend development server (PID: $FRONTEND_PID)..."
    kill $FRONTEND_PID
    rm frontend_pid.txt
  else
    echo "Frontend development server is not running."
    rm frontend_pid.txt
  fi
else
  echo "No frontend PID file found."
fi

# Additional cleanup - kill any remaining node processes if needed
echo "Checking for any remaining processes..."
ps aux | grep fetch-real-odds | grep -v grep
if [ $? -eq 0 ]; then
  echo "Killing remaining fetch-real-odds processes..."
  pkill -f fetch-real-odds
fi

echo "All services stopped." 