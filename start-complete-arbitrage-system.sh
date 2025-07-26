#!/bin/bash

# Sports Arbitrage System - Complete Startup Script
# This script will start the complete system and verify everything works

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo ""
    echo -e "${PURPLE}================================================================${NC}"
    echo -e "${PURPLE}🚀 $1${NC}"
    echo -e "${PURPLE}================================================================${NC}"
}

print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# Check if Node.js is installed
check_nodejs() {
    if command -v node > /dev/null 2>&1; then
        NODE_VERSION=$(node --version)
        print_success "Node.js found: $NODE_VERSION"
        return 0
    else
        print_error "Node.js is not installed!"
        print_info "Please install Node.js from https://nodejs.org/"
        return 1
    fi
}

# Check if npm dependencies are installed
check_dependencies() {
    if [ -f "package.json" ] && [ -d "node_modules" ]; then
        print_success "Dependencies appear to be installed"
        return 0
    else
        print_warning "Dependencies may not be installed"
        print_step "Installing dependencies..."
        npm install
        return $?
    fi
}

# Check environment variables
check_environment() {
    print_step "Checking environment configuration..."
    
    if [ ! -f ".env" ]; then
        print_warning ".env file not found, it should have been created already"
        return 1
    fi
    
    # Check for required variables
    local all_good=true
    
    if grep -q "ODDS_API_KEY=YOUR_ODDS_API_KEY_HERE" .env; then
        print_warning "Please add your real ODDS API key to the .env file"
        print_info "Get your API key from: https://the-odds-api.com/"
        all_good=false
    else
        print_success "ODDS API key appears to be configured"
    fi
    
    if grep -q "VITE_SUPABASE_URL" .env; then
        print_success "Supabase URL configured"
    else
        print_warning "Supabase URL not found in .env"
        all_good=false
    fi
    
    if grep -q "VITE_SUPABASE_ANON_KEY" .env; then
        print_success "Supabase key configured"
    else
        print_warning "Supabase key not found in .env"
        all_good=false
    fi
    
    if [ "$all_good" = true ]; then
        return 0
    else
        return 1
    fi
}

# Start the server in background
start_server() {
    print_step "Starting the API server..."
    
    # Kill any existing server on port 3001
    if lsof -ti:3001 > /dev/null 2>&1; then
        print_warning "Port 3001 is in use, attempting to free it..."
        kill -9 $(lsof -ti:3001) 2>/dev/null || true
        sleep 2
    fi
    
    # Start server in background
    nohup npm run server > server.log 2>&1 &
    SERVER_PID=$!
    echo $SERVER_PID > server_pid.txt
    
    # Wait for server to start
    print_step "Waiting for server to start..."
    local attempts=0
    local max_attempts=30
    
    while [ $attempts -lt $max_attempts ]; do
        if curl -s http://localhost:3001/health > /dev/null 2>&1; then
            print_success "Server started successfully (PID: $SERVER_PID)"
            return 0
        fi
        
        sleep 1
        attempts=$((attempts + 1))
        echo -n "."
    done
    
    echo ""
    print_error "Server failed to start within 30 seconds"
    return 1
}

# Run comprehensive tests
run_tests() {
    print_step "Running comprehensive system tests..."
    
    if node test-complete-system.js; then
        print_success "All tests passed!"
        return 0
    else
        print_error "Some tests failed"
        return 1
    fi
}

# Start frontend in background
start_frontend() {
    print_step "Starting the frontend development server..."
    
    # Kill any existing process on port 5173
    if lsof -ti:5173 > /dev/null 2>&1; then
        print_warning "Port 5173 is in use, attempting to free it..."
        kill -9 $(lsof -ti:5173) 2>/dev/null || true
        sleep 2
    fi
    
    # Start frontend in background
    nohup npm run dev > frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > frontend_pid.txt
    
    print_success "Frontend started (PID: $FRONTEND_PID)"
    print_info "Frontend will be available at: http://localhost:5173"
}

# Cleanup function
cleanup() {
    print_warning "Cleaning up..."
    
    if [ -f "server_pid.txt" ]; then
        SERVER_PID=$(cat server_pid.txt)
        if kill -0 $SERVER_PID 2>/dev/null; then
            kill $SERVER_PID
            print_info "Server stopped"
        fi
        rm -f server_pid.txt
    fi
    
    if [ -f "frontend_pid.txt" ]; then
        FRONTEND_PID=$(cat frontend_pid.txt)
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            kill $FRONTEND_PID
            print_info "Frontend stopped"
        fi
        rm -f frontend_pid.txt
    fi
}

# Trap to cleanup on exit
trap cleanup EXIT

# Main execution
main() {
    print_header "SPORTS ARBITRAGE SYSTEM STARTUP"
    
    # Check prerequisites
    print_header "CHECKING PREREQUISITES"
    check_nodejs || exit 1
    check_dependencies || exit 1
    check_environment || print_warning "Environment issues detected - proceeding anyway"
    
    # Start services
    print_header "STARTING SERVICES"
    start_server || exit 1
    
    # Wait a moment for server to fully initialize
    sleep 3
    
    # Run tests
    print_header "RUNNING SYSTEM TESTS"
    if run_tests; then
        print_success "System tests completed successfully!"
    else
        print_warning "Some tests failed, but continuing..."
    fi
    
    # Start frontend
    print_header "STARTING FRONTEND"
    start_frontend
    
    # Final instructions
    print_header "🎉 SYSTEM READY!"
    echo ""
    print_success "Sports Arbitrage System is now running!"
    echo ""
    echo -e "${CYAN}📊 API Server:${NC} http://localhost:3001"
    echo -e "${CYAN}🌐 Frontend:${NC} http://localhost:5173"
    echo -e "${CYAN}📋 Health Check:${NC} http://localhost:3001/health"
    echo ""
    print_info "Opening the application in your browser..."
    
    # Try to open browser (works on macOS, Linux with xdg-open, Windows with start)
    if command -v open > /dev/null 2>&1; then
        # macOS
        open http://localhost:5173
    elif command -v xdg-open > /dev/null 2>&1; then
        # Linux
        xdg-open http://localhost:5173
    elif command -v start > /dev/null 2>&1; then
        # Windows
        start http://localhost:5173
    else
        print_info "Please manually open: http://localhost:5173"
    fi
    
    echo ""
    print_header "📝 IMPORTANT NOTES"
    echo ""
    echo "1. 🔑 Add your real ODDS API key to .env file for live data"
    echo "2. 📊 The system will show sample data initially"
    echo "3. 🔄 Refresh the data using the refresh button in the app"
    echo "4. 🎯 Arbitrage opportunities will be calculated automatically"
    echo "5. 📱 The app works on mobile devices too!"
    echo ""
    print_header "🛑 TO STOP THE SYSTEM"
    echo ""
    echo "Press Ctrl+C to stop all services"
    echo "Or run: ./stop-arbitrage-system.sh"
    echo ""
    
    # Keep script running
    print_info "System is running... Press Ctrl+C to stop"
    
    # Wait for user interrupt
    while true; do
        sleep 10
        # Check if services are still running
        if [ -f "server_pid.txt" ]; then
            SERVER_PID=$(cat server_pid.txt)
            if ! kill -0 $SERVER_PID 2>/dev/null; then
                print_error "Server has stopped unexpectedly!"
                print_info "Check server.log for errors"
                break
            fi
        fi
        
        if [ -f "frontend_pid.txt" ]; then
            FRONTEND_PID=$(cat frontend_pid.txt)
            if ! kill -0 $FRONTEND_PID 2>/dev/null; then
                print_warning "Frontend has stopped"
                print_info "Check frontend.log for errors"
            fi
        fi
    done
}

# Script help
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Sports Arbitrage System Startup Script"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --help, -h    Show this help message"
    echo "  --test-only   Run tests only, don't start services"
    echo ""
    echo "This script will:"
    echo "1. Check prerequisites (Node.js, dependencies)"
    echo "2. Verify environment configuration"
    echo "3. Start the API server"
    echo "4. Run comprehensive system tests"
    echo "5. Start the frontend development server"
    echo "6. Open the application in your browser"
    echo ""
    exit 0
fi

# Test only mode
if [ "$1" = "--test-only" ]; then
    print_header "RUNNING TESTS ONLY"
    check_nodejs || exit 1
    check_dependencies || exit 1
    
    # Start server briefly for tests
    start_server || exit 1
    sleep 3
    run_tests
    TEST_RESULT=$?
    
    # Stop server
    if [ -f "server_pid.txt" ]; then
        SERVER_PID=$(cat server_pid.txt)
        kill $SERVER_PID 2>/dev/null || true
        rm -f server_pid.txt
    fi
    
    exit $TEST_RESULT
fi

# Run main function
main 