#!/bin/bash

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}  Direct Bookmaker Data Extraction Tool  ${NC}"
echo -e "${BLUE}=========================================${NC}"

# 1. Create output directory and cache directory
mkdir -p output
mkdir -p cache
echo -e "${YELLOW}Created output and cache directories${NC}"

# 2. Check dependencies
echo -e "${YELLOW}Checking dependencies...${NC}"
if ! npm list playwright > /dev/null 2>&1; then
  echo "Installing Playwright..."
  npm install playwright
fi

# 3. Install Playwright browsers if needed
echo -e "${YELLOW}Checking Playwright browsers...${NC}"
if ! npx playwright -V > /dev/null 2>&1; then
  echo "Installing Playwright browsers..."
  npx playwright install chromium
fi

# 4. Run 1xBet scraper
echo -e "\n${GREEN}=========================================${NC}"
echo -e "${GREEN}  Running 1xBet Direct Scraper           ${NC}"
echo -e "${GREEN}=========================================${NC}"
node direct-1xbet-scraper.js

# 5. Run SportyBet scraper
echo -e "\n${GREEN}=========================================${NC}"
echo -e "${GREEN}  Running SportyBet Direct Scraper       ${NC}"
echo -e "${GREEN}=========================================${NC}"
node direct-sportybet-scraper.js

# 6. Display combined results
echo -e "\n${BLUE}=========================${NC}"
echo -e "${BLUE}   Extraction Results     ${NC}"
echo -e "${BLUE}=========================${NC}"

# Check 1xBet results
echo -e "\n${YELLOW}1xBet Results:${NC}"
if [ -f "cache/1xbet_odds.json" ]; then
  MATCH_COUNT=$(cat "cache/1xbet_odds.json" | grep -c match_id)
  echo -e "${GREEN}✓ Successfully extracted 1xBet data with ${MATCH_COUNT} matches${NC}"
else
  echo -e "${RED}× No 1xBet data was extracted${NC}"
fi

# Check SportyBet results
echo -e "\n${YELLOW}SportyBet Results:${NC}"
if [ -f "cache/sportybet_odds.json" ]; then
  MATCH_COUNT=$(cat "cache/sportybet_odds.json" | grep -c match_id)
  echo -e "${GREEN}✓ Successfully extracted SportyBet data with ${MATCH_COUNT} matches${NC}"
else
  echo -e "${RED}× No SportyBet data was extracted${NC}"
fi

# 7. Start API server if data was extracted
if [ -f "cache/1xbet_odds.json" ] || [ -f "cache/sportybet_odds.json" ]; then
  echo -e "\n${YELLOW}Starting the API server...${NC}"
  
  # Check if server is already running
  if lsof -i:3001 -t >/dev/null; then
    echo -e "${YELLOW}API server already running on port 3001${NC}"
  else
    # Start the server
    echo -e "${YELLOW}Starting the API server...${NC}"
    echo -e "${YELLOW}You can access the data at:${NC}"
    echo -e "  http://localhost:3001/api/odds/1xbet"
    echo -e "  http://localhost:3001/api/odds/sportybet"
    echo -e "  http://localhost:3001/api/odds/all"
    
    # If real-prematch-scraper.js exists, start it, otherwise use reliable-odds-provider.js
    if [ -f "real-prematch-scraper.js" ]; then
      echo -e "${YELLOW}Starting real-prematch-scraper.js...${NC}"
      node real-prematch-scraper.js > prematch-scraper.log 2>&1 &
    elif [ -f "reliable-odds-provider.js" ]; then
      echo -e "${YELLOW}Starting reliable-odds-provider.js...${NC}"
      node reliable-odds-provider.js > reliable-odds.log 2>&1 &
    else
      echo -e "${RED}No API server script found.${NC}"
    fi
  fi
fi

echo -e "\n${GREEN}Extraction complete!${NC}"
echo -e "You can find detailed extraction results in the 'output' directory." 