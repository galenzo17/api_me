#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎬 VHS Recording Setup for Concurrency Demo${NC}"
echo -e "${BLUE}===========================================${NC}"
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${CYAN}🔍 Checking prerequisites...${NC}"

if ! command_exists vhs; then
    echo -e "${RED}❌ VHS is not installed or not in PATH${NC}"
    echo -e "${YELLOW}💡 Install with: go install github.com/charmbracelet/vhs@latest${NC}"
    echo -e "${YELLOW}💡 Add to PATH: export PATH=\$PATH:\$(go env GOPATH)/bin${NC}"
    exit 1
fi

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

if ! command_exists jq; then
    echo -e "${YELLOW}⚠️  jq not found, installing...${NC}"
    sudo apt-get update && sudo apt-get install -y jq || brew install jq
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"
echo ""

# VHS version info
VHS_VERSION=$(vhs --version)
echo -e "${CYAN}📹 VHS Version: ${VHS_VERSION}${NC}"
echo ""

# Stop any running processes
echo -e "${YELLOW}🧹 Cleaning up any existing processes...${NC}"
pkill -f "npm run start:dev" 2>/dev/null || true
pkill -f "node scripts" 2>/dev/null || true
sleep 2

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
fi

# Ensure database migrations are ready
echo -e "${YELLOW}🗄️  Preparing database...${NC}"
npm run db:generate >/dev/null 2>&1 || true
npm run db:migrate >/dev/null 2>&1 || true

echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""

# Recording options
echo -e "${BLUE}🎯 RECORDING OPTIONS${NC}"
echo -e "${BLUE}===================${NC}"
echo ""
echo -e "${CYAN}1.${NC} Quick Demo (30s) - For README"
echo -e "${CYAN}2.${NC} Full Concurrency Demo (60s) - Detailed simulation"
echo -e "${CYAN}3.${NC} Monitor Dashboard Demo (45s) - Real-time monitoring"
echo -e "${CYAN}4.${NC} Record All Demos"
echo ""

read -p "Choose recording option (1-4): " choice

record_demo() {
    local tape_file=$1
    local demo_name=$2
    
    echo -e "${PURPLE}🎬 Recording: ${demo_name}${NC}"
    echo -e "${YELLOW}   Tape file: ${tape_file}${NC}"
    
    if [ ! -f "$tape_file" ]; then
        echo -e "${RED}❌ Tape file not found: ${tape_file}${NC}"
        return 1
    fi
    
    # Add Go bin to PATH for this session
    export PATH=$PATH:$(go env GOPATH)/bin
    
    # Record with VHS
    vhs "$tape_file"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Recording completed: ${demo_name}${NC}"
        
        # Show file info
        output_file=$(grep "^Output" "$tape_file" | cut -d' ' -f2)
        if [ -f "$output_file" ]; then
            file_size=$(du -h "$output_file" | cut -f1)
            echo -e "${CYAN}📁 Generated: ${output_file} (${file_size})${NC}"
        fi
    else
        echo -e "${RED}❌ Recording failed: ${demo_name}${NC}"
        return 1
    fi
}

case $choice in
    1)
        echo -e "${GREEN}🎬 Recording Quick Demo...${NC}"
        record_demo "vhs-recordings/quick-demo.tape" "Quick Demo"
        ;;
    2)
        echo -e "${GREEN}🎬 Recording Full Concurrency Demo...${NC}"
        record_demo "vhs-recordings/concurrency-demo.tape" "Full Concurrency Demo"
        ;;
    3)
        echo -e "${GREEN}🎬 Recording Monitor Dashboard Demo...${NC}"
        record_demo "vhs-recordings/monitor-demo.tape" "Monitor Dashboard Demo"
        ;;
    4)
        echo -e "${GREEN}🎬 Recording All Demos...${NC}"
        echo ""
        
        record_demo "vhs-recordings/quick-demo.tape" "Quick Demo"
        sleep 2
        
        record_demo "vhs-recordings/concurrency-demo.tape" "Full Concurrency Demo"
        sleep 2
        
        record_demo "vhs-recordings/monitor-demo.tape" "Monitor Dashboard Demo"
        ;;
    *)
        echo -e "${RED}❌ Invalid option${NC}"
        exit 1
        ;;
esac

# Final cleanup
echo ""
echo -e "${YELLOW}🧹 Final cleanup...${NC}"
pkill -f "npm run start:dev" 2>/dev/null || true
pkill -f "node scripts" 2>/dev/null || true

echo ""
echo -e "${BLUE}📁 GENERATED FILES${NC}"
echo -e "${BLUE}=================${NC}"
ls -la vhs-recordings/*.gif 2>/dev/null | while read line; do
    echo -e "${CYAN}${line}${NC}"
done

echo ""
echo -e "${GREEN}✨ All recordings completed!${NC}"
echo ""
echo -e "${CYAN}🔗 Usage:${NC}"
echo -e "${YELLOW}   Add to README.md:${NC}"
echo -e "${YELLOW}   ![Demo](vhs-recordings/quick-demo.gif)${NC}"
echo ""
echo -e "${CYAN}🎯 Optimization tips:${NC}"
echo -e "${YELLOW}   - Use online GIF optimizers for smaller file sizes${NC}"
echo -e "${YELLOW}   - Consider converting to WebM for better compression${NC}"