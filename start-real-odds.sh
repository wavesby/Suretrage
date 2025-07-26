#!/bin/bash

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}    Real Odds Extraction Server Starter  ${NC}"
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

# 5. Update the scraper to run in headless mode for production
echo -e "${YELLOW}Setting scraper to headless mode...${NC}"
sed -i'' -e 's/headless: false/headless: true/g' real-odds-extractor.js

# 6. Start the real odds extractor server
echo -e "${YELLOW}Starting real odds extractor server...${NC}"
node real-odds-extractor.js > real-odds.log 2>&1 &
SERVER_PID=$!
echo "Server started with PID: $SERVER_PID"

# 7. Wait for the server to be ready
echo -e "${YELLOW}Waiting for server to be ready...${NC}"
MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  ((ATTEMPT++))
  if curl -s http://localhost:3001/health > /dev/null; then
    echo -e "${GREEN}✓ Real odds server is ready!${NC}"
    break
  else
    echo "Waiting for server to start ($ATTEMPT/$MAX_ATTEMPTS)..."
    sleep 1
  fi
  
  if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo -e "${RED}× Failed to start server${NC}"
    echo "Check real-odds.log for details"
    exit 1
  fi
done

# 8. Test the server endpoints
echo -e "${YELLOW}Testing server endpoints...${NC}"

echo "1. Testing health endpoint..."
curl -s http://localhost:3001/health

echo -e "\n\n2. Testing 1xBet endpoint..."
echo "Fetching 1xBet odds (this may take a moment as it scrapes the website)..."
echo "Data will be saved to cache/1xbet_odds.json"

echo -e "\n\n3. Testing SportyBet endpoint..."
echo "Fetching SportyBet odds (this may take a moment as it scrapes the website)..."
echo "Data will be saved to cache/sportybet_odds.json"

echo -e "\n${GREEN}=====================${NC}"
echo -e "${GREEN}Server is now running!${NC}"
echo -e "${GREEN}=====================${NC}"
echo -e "You can access the endpoints at:"
echo -e "  Health check: http://localhost:3001/health"
echo -e "  1xBet odds:   http://localhost:3001/api/odds/1xbet"
echo -e "  SportyBet:    http://localhost:3001/api/odds/sportybet" 
echo -e "  All odds:     http://localhost:3001/api/odds/all"
echo -e "\nThe server is running in the background. View logs with:"
echo -e "  tail -f real-odds.log"
echo -e "\nTo stop the server:"
echo -e "  kill $SERVER_PID"

# Create a script to stop the server later
echo "#!/bin/bash" > stop-real-odds.sh
echo "echo 'Stopping real odds server...'" >> stop-real-odds.sh
echo "kill $SERVER_PID" >> stop-real-odds.sh
echo "echo 'Server stopped'" >> stop-real-odds.sh
chmod +x stop-real-odds.sh
echo -e "\nCreated stop-real-odds.sh to stop the server later" 