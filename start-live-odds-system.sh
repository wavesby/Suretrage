#!/bin/bash

# Configure refresh intervals to be more conservative with API calls
export LIVE_ODDS_REFRESH_INTERVAL=900000  # 15 minutes (in milliseconds)

# Kill any existing Node.js processes
echo "Stopping any existing Node.js processes..."
pkill -f "node"

# Wait a moment for processes to stop
sleep 2

# Show API usage warning
echo "====================== API USAGE WARNING ======================"
echo "The ODDS API has limited usage (500 requests/month)"
echo "Current settings: Refresh every $(( $LIVE_ODDS_REFRESH_INTERVAL / 60000 )) minutes"
echo "The system has been configured to be conservative with API calls"
echo "=============================================================="
sleep 2

# Start the live odds refresher in the background
echo "Starting live odds refresher..."
node refresh-live-odds.js &
LIVE_PID=$!

# Wait a moment to ensure live odds refresher is running
sleep 2

# Start the server
echo "Starting server..."
node server.js &
SERVER_PID=$!

# Function to handle cleanup on exit
cleanup() {
    echo "Stopping services..."
    kill $LIVE_PID 2>/dev/null
    kill $SERVER_PID 2>/dev/null
    exit 0
}

# Set up trap for cleanup
trap cleanup SIGINT SIGTERM

# Wait for both processes
wait $LIVE_PID $SERVER_PID 