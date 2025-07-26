#!/bin/bash

# Set the directory of the script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "=== Running Direct SportyBet Scraper ==="
echo "This will scrape real data from SportyBet"

# Run the direct scraper
node direct-sportybet-scraper.js

echo ""
echo "=== Starting Server to Test API ==="

# Check if the server is already running
if nc -z localhost 3001 2>/dev/null; then
  echo "Server already running on port 3001"
else
  echo "Starting server.js..."
  node server.js &
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

echo ""
echo "=== Testing SportyBet API ==="

# Make a request to the SportyBet API
curl -s http://localhost:3001/api/odds/sportybet | jq -r '.[] | "\(.match_name) | Home: \(.home_team) | Away: \(.away_team) | Odds: \(.odds_home)-\(.odds_draw)-\(.odds_away)"' | head -n 10

# Check if we started the server and need to shut it down
if [ -n "$SERVER_PID" ]; then
  echo ""
  echo "=== Shutting down server ==="
  kill $SERVER_PID 2>/dev/null
fi

echo ""
echo "=== Test completed ===" 