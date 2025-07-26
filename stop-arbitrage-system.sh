#!/bin/bash

# Sports Arbitrage System - Stop Script
# This script will stop all running services

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo ""
echo -e "${BLUE}🛑 Stopping Sports Arbitrage System${NC}"
echo "========================================"

# Stop server
if [ -f "server_pid.txt" ]; then
    SERVER_PID=$(cat server_pid.txt)
    if kill -0 $SERVER_PID 2>/dev/null; then
        kill $SERVER_PID
        print_success "API Server stopped (PID: $SERVER_PID)"
    else
        print_warning "Server was not running"
    fi
    rm -f server_pid.txt
else
    print_info "No server PID file found"
fi

# Stop frontend
if [ -f "frontend_pid.txt" ]; then
    FRONTEND_PID=$(cat frontend_pid.txt)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        kill $FRONTEND_PID
        print_success "Frontend stopped (PID: $FRONTEND_PID)"
    else
        print_warning "Frontend was not running"
    fi
    rm -f frontend_pid.txt
else
    print_info "No frontend PID file found"
fi

# Kill any remaining processes on the ports
print_info "Checking for any remaining processes on ports 3001 and 5173..."

if lsof -ti:3001 > /dev/null 2>&1; then
    print_warning "Killing remaining processes on port 3001..."
    kill -9 $(lsof -ti:3001) 2>/dev/null || true
fi

if lsof -ti:5173 > /dev/null 2>&1; then
    print_warning "Killing remaining processes on port 5173..."
    kill -9 $(lsof -ti:5173) 2>/dev/null || true
fi

# Clean up log files
if [ -f "server.log" ]; then
    print_info "Server logs available in: server.log"
fi

if [ -f "frontend.log" ]; then
    print_info "Frontend logs available in: frontend.log"
fi

echo ""
print_success "All services stopped successfully!"
echo "" 