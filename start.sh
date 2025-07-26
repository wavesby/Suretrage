#!/bin/bash

# Colors for console output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${MAGENTA}=== Sport Arbitrage Startup Script ===${NC}"
echo -e "${YELLOW}This script will set up and start the Sport Arbitrage application${NC}"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed or not in PATH${NC}"
    echo -e "${YELLOW}Please install Node.js v16 or higher:${NC}"
    echo "  - macOS: brew install node"
    echo "  - Windows: Download from nodejs.org"
    echo "  - Linux: sudo apt install nodejs npm"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2)
NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d '.' -f 1)
if [ "$NODE_MAJOR_VERSION" -lt 16 ]; then
    echo -e "${RED}Node.js version $NODE_VERSION is too old${NC}"
    echo -e "${YELLOW}Please install Node.js v16 or higher${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $NODE_VERSION detected${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm is not installed or not in PATH${NC}"
    echo -e "${YELLOW}Please install npm:${NC}"
    echo "  - macOS: brew install npm"
    echo "  - Windows: Reinstall Node.js from nodejs.org"
    echo "  - Linux: sudo apt install npm"
    exit 1
fi

echo -e "${GREEN}✓ npm detected${NC}"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to install dependencies${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Dependencies already installed${NC}"
fi

# Install Playwright browsers if not already installed
echo -e "${YELLOW}Installing Playwright browsers...${NC}"
npx playwright install chromium --with-deps
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install Playwright browsers${NC}"
    echo -e "${YELLOW}Trying without dependencies...${NC}"
    npx playwright install chromium
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to install Playwright browsers${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✓ Playwright browsers installed${NC}"

# Create cache directory if it doesn't exist
if [ ! -d "cache" ]; then
    echo -e "${YELLOW}Creating cache directory...${NC}"
    mkdir -p cache
    echo -e "${GREEN}✓ Cache directory created${NC}"
else
    echo -e "${GREEN}✓ Cache directory already exists${NC}"
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    cat > .env << EOL
VITE_PROXY_SERVER=http://localhost:3001
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
EOL
    echo -e "${GREEN}✓ .env file created${NC}"
    echo -e "${YELLOW}NOTE: You may need to update the values in .env for production use${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

# Run validation script
echo -e "${YELLOW}Validating code...${NC}"
node validate-code.js
if [ $? -ne 0 ]; then
    echo -e "${RED}Code validation failed${NC}"
    echo -e "${YELLOW}Do you want to continue anyway? (y/n)${NC}"
    read -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Startup aborted${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Code validation passed${NC}"
fi

# Start the application
echo -e "${BLUE}Starting the application...${NC}"
echo -e "${CYAN}Press Ctrl+C to stop${NC}"
echo ""

# Start the proxy server in the background
echo -e "${YELLOW}Starting proxy server...${NC}"
node server.js &
PROXY_PID=$!

# Wait for the proxy server to start
echo -e "${YELLOW}Waiting for proxy server to start...${NC}"
sleep 5

# Verify the setup
echo -e "${YELLOW}Verifying setup...${NC}"
node verify-setup.js
if [ $? -ne 0 ]; then
    echo -e "${RED}Setup verification failed${NC}"
    echo -e "${YELLOW}Do you want to continue anyway? (y/n)${NC}"
    read -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Killing proxy server...${NC}"
        kill $PROXY_PID
        echo -e "${RED}Startup aborted${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Setup verification passed${NC}"
fi

# Start the frontend
echo -e "${YELLOW}Starting frontend...${NC}"
npm run dev

# If the frontend exits, kill the proxy server
echo -e "${YELLOW}Frontend exited, killing proxy server...${NC}"
kill $PROXY_PID 