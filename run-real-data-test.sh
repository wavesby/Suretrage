#!/bin/bash

# Set the directory of the script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "=== Running Direct SportyBet Scraper ==="
echo "This will scrape real data from SportyBet"

# Run the direct scraper
node direct-sportybet-scraper.js

echo ""
echo "=== Starting Reliable Odds Server ==="
echo "This server will use the real data we just scraped"

# Check if the server is already running
if nc -z localhost 3001 2>/dev/null; then
  echo "Server already running on port 3001, stopping it first..."
  # Find and kill the existing server process
  SERVER_PID=$(lsof -i:3001 -t)
  if [ -n "$SERVER_PID" ]; then
    kill $SERVER_PID
    sleep 2
  fi
fi

# Start the reliable odds server
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

# Wait a bit more to ensure server is fully ready
sleep 2

echo ""
echo "=== Testing SportyBet API ==="
echo "Fetching data from /api/odds/sportybet endpoint..."

# Make a request to the SportyBet API and save the response
curl -s http://localhost:3001/api/odds/sportybet > sportybet-api-response.json

# Display the first few matches
echo "First 5 matches from API:"
cat sportybet-api-response.json | jq -r '.[] | "\(.match_name) | Home: \(.home_team) | Away: \(.away_team) | Odds: \(.odds_home)-\(.odds_draw)-\(.odds_away)"' | head -n 5

echo ""
echo "=== Testing All Odds API ==="
echo "Fetching data from /api/odds/all endpoint..."

# Make a request to the All Odds API and save the response
curl -s http://localhost:3001/api/odds/all > all-odds-api-response.json

# Count matches by bookmaker
echo "Match counts by bookmaker:"
cat all-odds-api-response.json | jq -r '.[].bookmaker' | sort | uniq -c

echo ""
echo "=== Server is running ==="
echo "The reliable odds server is now running in the background."
echo "You can access the API at:"
echo "  - http://localhost:3001/api/odds/sportybet"
echo "  - http://localhost:3001/api/odds/all"
echo ""
echo "To stop the server, run: kill $SERVER_PID" 