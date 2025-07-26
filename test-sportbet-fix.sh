#!/bin/bash

# Set the directory of the script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "Starting SportyBet fix test..."

# Check if the server is already running
if nc -z localhost 3001 2>/dev/null; then
  echo "Server already running on port 3001"
else
  echo "Starting reliable-odds-server.js..."
  node reliable-odds-server.js &
  SERVER_PID=$!
  
  # Wait for server to start
  echo "Waiting for server to start..."
  for i in {1..10}; do
    if nc -z localhost 3001 2>/dev/null; then
      echo "Server started successfully"
      break
    fi
    if [ $i -eq 10 ]; then
      echo "Server failed to start"
      kill $SERVER_PID 2>/dev/null
      exit 1
    fi
    sleep 1
  done
fi

# Wait a bit more to ensure server is fully ready
sleep 2

# Run the test script
echo "Running test script..."
node test-sportybet-fix.js

# Check if we started the server and need to shut it down
if [ -n "$SERVER_PID" ]; then
  echo "Shutting down server (PID: $SERVER_PID)..."
  kill $SERVER_PID 2>/dev/null
fi

echo "Test completed." 