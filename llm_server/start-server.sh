#!/bin/bash
#
# LLM Server Startup Script
# Starts the FastAPI server with uvicorn in development mode
#

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Script directory (llm_server/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Project root (parent of llm_server/)
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Work in llm_server for venv/env setup
cd "$SCRIPT_DIR"

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}   LLM Server Startup${NC}"
echo -e "${BLUE}================================${NC}"
echo

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Virtual environment not found. Creating...${NC}"
    python3 -m venv venv
    echo -e "${GREEN}✓ Virtual environment created${NC}"
    echo
fi

# Activate virtual environment
echo -e "${BLUE}Activating virtual environment...${NC}"
source venv/bin/activate

# Check if requirements are installed
if ! python -c "import fastapi" 2>/dev/null; then
    echo -e "${YELLOW}Dependencies not installed. Installing...${NC}"
    pip install -q -r requirements.txt
    echo -e "${GREEN}✓ Dependencies installed${NC}"
    echo
fi

# Load environment variables if .env exists
if [ -f ".env" ]; then
    echo -e "${BLUE}Loading environment from .env${NC}"
    # Use set -a to auto-export, properly handle comments and inline comments
    set -a
    source <(cat .env | sed 's/#.*//' | grep -v '^[[:space:]]*$' | sed 's/^[[:space:]]*//')
    set +a
fi

# Set defaults if not configured
export LLM_HOST=${LLM_HOST:-127.0.0.1}
export LLM_PORT=${LLM_PORT:-42002}
export LLM_LOG_LEVEL=${LLM_LOG_LEVEL:-info}

echo
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Starting server...${NC}"
echo -e "${GREEN}================================${NC}"
echo -e "  URL:       ${BLUE}http://${LLM_HOST}:${LLM_PORT}${NC}"
echo -e "  Health:    ${BLUE}http://${LLM_HOST}:${LLM_PORT}/health${NC}"
echo -e "  Log Level: ${BLUE}${LLM_LOG_LEVEL}${NC}"
echo -e "  Hot Reload: ${GREEN}ENABLED${NC}"
echo -e "${GREEN}================================${NC}"
echo
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
echo

# Change to project root to run uvicorn (so llm_server module is importable)
cd "$PROJECT_ROOT"

# Start uvicorn with hot reload
uvicorn llm_server.server:app \
  --host "${LLM_HOST}" \
  --port "${LLM_PORT}" \
  --log-level "${LLM_LOG_LEVEL}" \
  --reload \
  --reload-dir llm_server \
  --timeout-keep-alive 65
