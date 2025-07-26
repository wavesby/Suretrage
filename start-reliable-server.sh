#!/bin/bash

# Kill any existing Node.js processes on port 3001
echo "Stopping any existing Node.js processes on port 3001..."
if [ "$(uname)" == "Darwin" ]; then
  # macOS
  PID=$(lsof -i :3001 -t 2>/dev/null)
  if [ ! -z "$PID" ]; then
    echo "Killing process $PID on port 3001"
    kill -9 $PID
  else
    echo "No process found on port 3001"
  fi
else
  # Linux/Windows with WSL
  PID=$(netstat -tulpn 2>/dev/null | grep :3001 | awk '{print $7}' | cut -d'/' -f1)
  if [ ! -z "$PID" ]; then
    echo "Killing process $PID on port 3001"
    kill -9 $PID
  else
    echo "No process found on port 3001"
  fi
fi

# Clear cache directory
echo "Clearing cache directory..."
if [ -d "cache" ]; then
  rm -f cache/*.json
  echo "Cache cleared"
else
  mkdir -p cache
  echo "Cache directory created"
fi

# Start the reliable server
echo "Starting reliable odds server..."
node reliable-odds-server.js 