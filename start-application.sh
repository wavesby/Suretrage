#!/bin/bash

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}   Sports Arbitrage Application Starter  ${NC}"
echo -e "${GREEN}=========================================${NC}"

# 1. Kill any existing processes on port 3001
echo -e "${YELLOW}Stopping any existing odds server...${NC}"
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

# 2. Clear cache directory
echo -e "${YELLOW}Preparing cache directory...${NC}"
if [ -d "cache" ]; then
  rm -f cache/*.json
  echo "Cache cleared"
else
  mkdir -p cache
  echo "Cache directory created"
fi

# 3. Start the reliable odds server in the background
echo -e "${YELLOW}Starting reliable odds server...${NC}"
node reliable-odds-server.js > odds-server.log 2>&1 &
SERVER_PID=$!
echo "Odds server started with PID: $SERVER_PID"

# 4. Wait for the server to be ready
echo -e "${YELLOW}Waiting for odds server to be ready...${NC}"
MAX_ATTEMPTS=10
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  ((ATTEMPT++))
  if curl -s http://localhost:3001/health > /dev/null; then
    echo -e "${GREEN}✓ Odds server is ready!${NC}"
    break
  else
    echo "Waiting for server to start ($ATTEMPT/$MAX_ATTEMPTS)..."
    sleep 1
  fi
  
  if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo -e "${RED}× Failed to start odds server${NC}"
    exit 1
  fi
done

# 5. Start the frontend application
echo -e "${YELLOW}Starting frontend application...${NC}"
echo -e "${GREEN}✨ All systems go! Opening application...${NC}"

if [ "$(uname)" == "Darwin" ]; then
  # macOS
  npm start
else
  # Linux/Windows
  npm start
fi

# Note: The npm start command will keep running in the foreground
# When the user presses Ctrl+C, we should also stop the odds server
trap "echo -e '${YELLOW}Shutting down...${NC}'; kill $SERVER_PID; echo 'Odds server stopped'; exit 0" INT TERM EXIT 