#!/bin/bash

# Get user credentials
read -p "GitHub Username: " USERNAME
read -sp "GitHub Token (will not be shown): " TOKEN
echo ""

# Push using credentials in URL
git push https://${USERNAME}:${TOKEN}@github.com/sportArbitrage/Sport-arbitrage.git main

# Clear variables for security
USERNAME=""
TOKEN=""
