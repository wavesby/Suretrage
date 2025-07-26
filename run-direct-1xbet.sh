#!/bin/bash

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}    Direct 1xBet Match Data Extractor    ${NC}"
echo -e "${GREEN}=========================================${NC}"

# 1. Create output directory
mkdir -p output
echo -e "${YELLOW}Created output directory${NC}"

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

# 4. Run the direct 1xBet scraper
echo -e "${YELLOW}Running direct 1xBet scraper...${NC}"
node direct-1xbet-scraper.js

# 5. Display results
echo -e "\n${GREEN}===================${NC}"
echo -e "${GREEN}  Scraper Results  ${NC}"
echo -e "${GREEN}===================${NC}"

# Check if we have extracted matches
if [ -d "output" ] && [ "$(ls -A output | grep -c 1xbet)" -gt 0 ]; then
  LATEST_FILE=$(ls -t output/1xbet-matches-* 2>/dev/null | head -n 1)
  if [ -n "$LATEST_FILE" ]; then
    MATCH_COUNT=$(cat "$LATEST_FILE" | grep -c match_id)
    echo -e "${GREEN}Successfully extracted ${MATCH_COUNT} matches${NC}"
    echo -e "Results saved to: ${LATEST_FILE}"
    
    # Check if cache file was created
    if [ -f "cache/1xbet_odds.json" ]; then
      echo -e "${GREEN}API cache updated successfully${NC}"
      echo -e "You can now access the data via the API at:"
      echo -e "  http://localhost:3001/api/odds/1xbet"
    else
      echo -e "${RED}Warning: API cache file was not created${NC}"
    fi
  else
    echo -e "${RED}No matches were extracted${NC}"
  fi
else
  echo -e "${RED}No output files were generated${NC}"
fi

echo -e "\n${GREEN}Done!${NC}" 