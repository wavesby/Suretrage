#!/bin/bash

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}    Reliable Odds Provider Starter       ${NC}"
echo -e "${GREEN}=========================================${NC}"

# 1. Kill any existing processes on port 3001
echo -e "${YELLOW}Stopping any existing server processes...${NC}"
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

# 2. Clear cache and create directories
echo -e "${YELLOW}Preparing environment...${NC}"
mkdir -p cache
rm -f cache/*.json cache/*.html cache/*.png
echo "Cache cleared"

# 3. Install required dependencies if they don't exist
echo -e "${YELLOW}Checking dependencies...${NC}"
if ! npm list playwright > /dev/null 2>&1; then
  echo "Installing Playwright..."
  npm install playwright
fi

if ! npm list express > /dev/null 2>&1; then
  echo "Installing Express..."
  npm install express
fi

if ! npm list cors > /dev/null 2>&1; then
  echo "Installing CORS..."
  npm install cors
fi

# 4. Install Playwright browsers if needed
echo -e "${YELLOW}Checking Playwright browsers...${NC}"
if ! npx playwright -V > /dev/null 2>&1; then
  echo "Installing Playwright browsers..."
  npx playwright install chromium
fi

# 5. Start the reliable odds provider
echo -e "${YELLOW}Starting reliable odds provider...${NC}"
node reliable-odds-provider.js > reliable-odds.log 2>&1 &
SERVER_PID=$!
echo "Server started with PID: $SERVER_PID"

# 6. Wait for the server to be ready
echo -e "${YELLOW}Waiting for server to be ready...${NC}"
MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  ((ATTEMPT++))
  if curl -s http://localhost:3001/health > /dev/null; then
    echo -e "${GREEN}✓ Reliable odds server is ready!${NC}"
    break
  else
    echo "Waiting for server to start ($ATTEMPT/$MAX_ATTEMPTS)..."
    sleep 1
  fi
  
  if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo -e "${RED}× Failed to start server${NC}"
    echo "Check reliable-odds.log for details"
    exit 1
  fi
done

# 7. Test the server endpoints
echo -e "${YELLOW}Testing server endpoints...${NC}"

echo -e "\n1. Testing health endpoint..."
curl -s http://localhost:3001/health

echo -e "\n\n2. Testing 1xBet endpoint (first request may take some time)..."
curl -s http://localhost:3001/api/odds/1xbet | head -2
echo -e "\n\n... (truncated for brevity)"

echo -e "\n\n3. Testing SportyBet endpoint (first request may take some time)..."
curl -s http://localhost:3001/api/odds/sportybet | head -2
echo -e "\n\n... (truncated for brevity)"

echo -e "\n\n${GREEN}=====================${NC}"
echo -e "${GREEN}Server is now running!${NC}"
echo -e "${GREEN}=====================${NC}"
echo -e "You can access the endpoints at:"
echo -e "  Health check: http://localhost:3001/health"
echo -e "  1xBet odds:   http://localhost:3001/api/odds/1xbet"
echo -e "  SportyBet:    http://localhost:3001/api/odds/sportybet" 
echo -e "  All odds:     http://localhost:3001/api/odds/all"
echo -e "\nThe server is running in the background. View logs with:"
echo -e "  tail -f reliable-odds.log"
echo -e "\nTo stop the server:"
echo -e "  kill $SERVER_PID"

# Create a script to stop the server later
echo "#!/bin/bash" > stop-reliable-odds.sh
echo "echo 'Stopping reliable odds server...'" >> stop-reliable-odds.sh
echo "kill $SERVER_PID" >> stop-reliable-odds.sh
echo "echo 'Server stopped'" >> stop-reliable-odds.sh
chmod +x stop-reliable-odds.sh
echo -e "\nCreated stop-reliable-odds.sh to stop the server later" 