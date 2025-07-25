#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 CONCURRENCY SIMULATION SETUP${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -i :$1 >/dev/null 2>&1
}

# Function to wait for API to be ready
wait_for_api() {
    echo -e "${YELLOW}⏳ Waiting for API to be ready...${NC}"
    for i in {1..30}; do
        if curl -s http://localhost:3000/ >/dev/null 2>&1; then
            echo -e "${GREEN}✅ API is ready!${NC}"
            return 0
        fi
        echo -e "${YELLOW}   Attempt $i/30...${NC}"
        sleep 1
    done
    echo -e "${RED}❌ API failed to start after 30 seconds${NC}"
    return 1
}

# Check prerequisites
echo -e "${CYAN}🔍 Checking prerequisites...${NC}"

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json not found. Run this script from the project root.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"
echo ""

# Check if API is already running
if port_in_use 3000; then
    echo -e "${GREEN}✅ API is already running on port 3000${NC}"
    API_RUNNING=true
else
    echo -e "${YELLOW}⚠️  API is not running. Starting API...${NC}"
    
    # Start the API in the background
    npm run start:dev > api.log 2>&1 &
    API_PID=$!
    API_RUNNING=false
    
    # Wait for API to be ready
    if wait_for_api; then
        API_RUNNING=true
        echo -e "${GREEN}✅ API started successfully (PID: $API_PID)${NC}"
    else
        echo -e "${RED}❌ Failed to start API${NC}"
        kill $API_PID 2>/dev/null
        exit 1
    fi
fi

echo ""

# Setup database and seed data
echo -e "${PURPLE}🗄️  Setting up database and test data...${NC}"

# Run migrations if needed
if [ ! -f "database.db" ]; then
    echo -e "${YELLOW}   Running database migrations...${NC}"
    npm run db:migrate
fi

# Seed test data
echo -e "${YELLOW}   Seeding test data...${NC}"
node scripts/seed-data.js

echo -e "${GREEN}✅ Database setup complete${NC}"
echo ""

# Show simulation options
echo -e "${BLUE}🎯 SIMULATION OPTIONS${NC}"
echo -e "${BLUE}====================${NC}"
echo ""
echo -e "${CYAN}1.${NC} Run worker simulation only"
echo -e "${CYAN}2.${NC} Run monitor dashboard only"
echo -e "${CYAN}3.${NC} Run both simulation and monitor (recommended)"
echo -e "${CYAN}4.${NC} Custom simulation settings"
echo ""

read -p "Choose option (1-4): " choice

case $choice in
    1)
        echo -e "${GREEN}🏃 Starting worker simulation...${NC}"
        node scripts/simulate-workers.js
        ;;
    2)
        echo -e "${GREEN}📊 Starting monitor dashboard...${NC}"
        node scripts/monitor.js
        ;;
    3)
        echo -e "${GREEN}🚀 Starting both simulation and monitor...${NC}"
        echo -e "${YELLOW}   Opening monitor in new terminal window...${NC}"
        
        # Try to open monitor in a new terminal
        if command_exists gnome-terminal; then
            gnome-terminal -- bash -c "node scripts/monitor.js; read -p 'Press Enter to close...'"
        elif command_exists xterm; then
            xterm -e "node scripts/monitor.js; read -p 'Press Enter to close...'" &
        elif command_exists osascript; then
            # macOS
            osascript -e 'tell app "Terminal" to do script "cd '$(pwd)' && node scripts/monitor.js"'
        else
            echo -e "${YELLOW}   Could not open new terminal. Run 'node scripts/monitor.js' in another terminal${NC}"
        fi
        
        sleep 2
        echo -e "${GREEN}   Starting worker simulation...${NC}"
        node scripts/simulate-workers.js
        ;;
    4)
        echo -e "${CYAN}Custom simulation settings:${NC}"
        read -p "Number of workers (default 5): " workers
        read -p "Simulation duration in seconds (default 30): " duration
        
        workers=${workers:-5}
        duration=${duration:-30}
        
        echo -e "${GREEN}🏃 Starting custom simulation with $workers workers for ${duration}s...${NC}"
        
        # Modify the simulate-workers.js temporarily for custom settings
        sed -i.bak "s/const WORKER_COUNT = 5/const WORKER_COUNT = $workers/" scripts/simulate-workers.js
        sed -i.bak "s/const SIMULATION_DURATION = 30000/const SIMULATION_DURATION = $((duration * 1000))/" scripts/simulate-workers.js
        
        node scripts/simulate-workers.js
        
        # Restore original file
        mv scripts/simulate-workers.js.bak scripts/simulate-workers.js
        ;;
    *)
        echo -e "${RED}❌ Invalid option${NC}"
        exit 1
        ;;
esac

# Cleanup
cleanup() {
    echo ""
    echo -e "${YELLOW}🧹 Cleaning up...${NC}"
    
    if [ "$API_RUNNING" = false ] && [ ! -z "$API_PID" ]; then
        echo -e "${YELLOW}   Stopping API (PID: $API_PID)...${NC}"
        kill $API_PID 2>/dev/null
        wait $API_PID 2>/dev/null
        echo -e "${GREEN}✅ API stopped${NC}"
    fi
    
    echo -e "${GREEN}✨ Simulation complete!${NC}"
}

# Set up cleanup on script exit
trap cleanup EXIT

echo ""
echo -e "${BLUE}📊 SIMULATION RESULTS${NC}"
echo -e "${BLUE}===================${NC}"
echo ""
echo -e "${CYAN}Check the final database state:${NC}"
echo -e "${YELLOW}   Jobs:${NC} curl -s http://localhost:3000/jobs | jq"
echo -e "${YELLOW}   Transactions:${NC} curl -s http://localhost:3000/transactions | jq"
echo -e "${YELLOW}   Monitor:${NC} curl -s http://localhost:3000/monitor/status | jq"
echo ""
echo -e "${CYAN}Or run the monitor manually:${NC}"
echo -e "${YELLOW}   node scripts/monitor.js${NC}"