#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script header
echo -e "${BLUE}=====================================================${NC}"
echo -e "${GREEN}=== SportyBet Scraper Setup (v2.0) ===${NC}"
echo -e "${BLUE}=====================================================${NC}"
echo -e "This script will set up the SportyBet scraper environment"
echo

# Check if Node.js is installed
echo -e "${YELLOW}Checking for Node.js...${NC}"
if ! command -v node &> /dev/null; then
  echo -e "${RED}✗ Node.js is not installed. Please install Node.js to continue.${NC}"
  echo -e "You can download Node.js from: https://nodejs.org/"
  exit 1
else
  NODE_VERSION=$(node -v)
  echo -e "${GREEN}✓ Node.js is installed (${NODE_VERSION})${NC}"
fi

# Check if npm is installed
echo -e "${YELLOW}Checking for npm...${NC}"
if ! command -v npm &> /dev/null; then
  echo -e "${RED}✗ npm is not installed. Please install npm to continue.${NC}"
  exit 1
else
  NPM_VERSION=$(npm -v)
  echo -e "${GREEN}✓ npm is installed (${NPM_VERSION})${NC}"
fi

# Create necessary directories
echo -e "${YELLOW}Creating necessary directories...${NC}"
mkdir -p output cache alternative-data
echo -e "${GREEN}✓ Created directories${NC}"

# Install required npm packages
echo -e "${YELLOW}Installing required npm packages...${NC}"
npm install playwright fs-extra express cors http node-fetch
echo -e "${GREEN}✓ Installed npm packages${NC}"

# Install Playwright browsers
echo -e "${YELLOW}Installing Playwright browsers (this may take a few minutes)...${NC}"
npx playwright install chromium
echo -e "${GREEN}✓ Installed Playwright browsers${NC}"

# Make scripts executable
echo -e "${YELLOW}Making scripts executable...${NC}"
chmod +x run-enhanced-sportybet.sh
chmod +x test-sportybet-api.js
echo -e "${GREEN}✓ Made scripts executable${NC}"

# Prepare initial premium data
echo -e "${YELLOW}Preparing initial premium data...${NC}"

# Create a minimal initial data file if it doesn't exist
if [ ! -f "alternative-data/sportybet-premium.json" ]; then
  echo '[
    {
      "match_id":"sportybet_setup_1",
      "match_name":"Manchester United vs Liverpool",
      "home_team":"Manchester United",
      "away_team":"Liverpool",
      "team_home":"Manchester United",
      "team_away":"Liverpool",
      "league":"Premier League",
      "match_time":"'$(date -d "+1 day" "+%b %d, %Y, %I:%M %p")'",
      "odds_home":2.5,
      "odds_draw":3.4,
      "odds_away":2.8,
      "bookmaker":"SportyBet",
      "updated_at":"'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
      "source":"setup"
    },
    {
      "match_id":"sportybet_setup_2",
      "match_name":"Real Madrid vs Barcelona",
      "home_team":"Real Madrid",
      "away_team":"Barcelona",
      "team_home":"Real Madrid",
      "team_away":"Barcelona",
      "league":"La Liga",
      "match_time":"'$(date -d "+2 days" "+%b %d, %Y, %I:%M %p")'",
      "odds_home":2.2,
      "odds_draw":3.5,
      "odds_away":3.1,
      "bookmaker":"SportyBet",
      "updated_at":"'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
      "source":"setup"
    }
  ]' > alternative-data/sportybet-premium.json
  
  echo -e "${GREEN}✓ Created initial premium data${NC}"
  
  # Create initial cache
  mkdir -p cache
  cp alternative-data/sportybet-premium.json cache/sportybet_odds.json
  echo -e "${GREEN}✓ Created initial cache${NC}"
else
  echo -e "${GREEN}✓ Premium data already exists${NC}"
fi

# Run test to verify everything is working
echo -e "${YELLOW}Running test to verify setup...${NC}"
node test-sportybet-api.js

echo
echo -e "${BLUE}=====================================================${NC}"
echo -e "${GREEN}=== Setup Complete! ===${NC}"
echo -e "${BLUE}=====================================================${NC}"
echo
echo -e "You can now run the SportyBet scraper with:"
echo -e "${GREEN}./run-enhanced-sportybet.sh${NC}"
echo
echo -e "You can test the API with:"
echo -e "${GREEN}node test-sportybet-api.js${NC}"
echo
echo -e "The API endpoint is available at:"
echo -e "${GREEN}http://localhost:3001/api/odds/sportybet${NC}"
echo 