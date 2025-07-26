#!/bin/bash

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== GitHub Push Script ===${NC}"
echo -e "${YELLOW}This script will push your committed changes to GitHub${NC}"

# Check if we have commits to push
AHEAD=$(git status | grep "ahead" | wc -l)
if [ "$AHEAD" -eq 0 ]; then
  echo -e "${RED}No commits to push. Your branch is up to date with origin.${NC}"
  exit 0
fi

# Configure git to store credentials temporarily
git config --global credential.helper cache
git config --global credential.helper 'cache --timeout=3600'

echo -e "\n${YELLOW}Attempting to push to GitHub...${NC}"
echo -e "${YELLOW}You will be prompted for GitHub credentials.${NC}"
echo -e "${YELLOW}For password, use a GitHub Personal Access Token, not your regular password.${NC}\n"

# Push to GitHub
git push origin main

# Check if push was successful
if [ $? -eq 0 ]; then
  echo -e "\n${GREEN}Success! Your changes have been pushed to GitHub.${NC}"
else
  echo -e "\n${RED}Push failed. Please try again manually:${NC}"
  echo -e "${YELLOW}git push origin main${NC}"
  echo -e "\n${YELLOW}If you need a Personal Access Token:${NC}"
  echo -e "1. Visit: ${GREEN}https://github.com/settings/tokens${NC}"
  echo -e "2. Click 'Generate new token'"
  echo -e "3. Select 'repo' permissions"
  echo -e "4. Generate and use the token as your password"
fi
