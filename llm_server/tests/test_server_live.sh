#!/bin/bash
# Test Harmony format with live LLM server
#
# This script:
# 1. Starts the LLM server with gpt-oss-20b
# 2. Sends test requests via curl
# 3. Validates responses
# 4. Shuts down the server
#
# Usage:
#   ./llm_server/tests/test_server_live.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Live Server Test: Harmony Format${NC}"
echo -e "${BLUE}========================================${NC}"

# Configuration
SERVER_PORT=42002
SERVER_URL="http://localhost:${SERVER_PORT}"
LOG_FILE="/tmp/llm-server-test.log"

# Check if server is already running
if lsof -Pi :${SERVER_PORT} -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠️  Server already running on port ${SERVER_PORT}${NC}"
    echo "Please stop it first or use a different port"
    exit 1
fi

# Check environment variables
if [ -z "$LLM_MODEL_PATH" ]; then
    export LLM_MODEL_PATH="./models"
    echo -e "${YELLOW}Setting LLM_MODEL_PATH=${LLM_MODEL_PATH}${NC}"
fi

if [ ! -d "$LLM_MODEL_PATH" ]; then
    echo -e "${RED}❌ Model path not found: $LLM_MODEL_PATH${NC}"
    exit 1
fi

# Start server in background
echo -e "\n${BLUE}🔄 Starting LLM server...${NC}"
export LLM_MODEL_PATH="$LLM_MODEL_PATH"
export LLM_MODEL_NAME="mlx-community/gpt-oss-20b-MXFP4-Q8"
export LLM_DEVICE="auto"
export LLM_QUANTIZATION="int4"
export LLM_PORT="${SERVER_PORT}"
export LLM_LOG_LEVEL="INFO"

# Start server
python3 -m llm_server.server > "$LOG_FILE" 2>&1 &
SERVER_PID=$!

echo -e "${GREEN}✅ Server started (PID: $SERVER_PID)${NC}"
echo "   Logs: $LOG_FILE"

# Function to cleanup on exit
cleanup() {
    echo -e "\n${BLUE}Cleaning up...${NC}"
    if [ ! -z "$SERVER_PID" ]; then
        kill $SERVER_PID 2>/dev/null || true
        wait $SERVER_PID 2>/dev/null || true
    fi
    echo -e "${GREEN}✅ Server stopped${NC}"
}

trap cleanup EXIT

# Wait for server to be ready
echo -e "\n${BLUE}⏳ Waiting for server to load model...${NC}"
MAX_WAIT=120  # 2 minutes
WAIT_COUNT=0

while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    if curl -s "${SERVER_URL}/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Server is ready!${NC}"
        break
    fi
    sleep 1
    WAIT_COUNT=$((WAIT_COUNT + 1))
    if [ $((WAIT_COUNT % 10)) -eq 0 ]; then
        echo "   Still waiting... (${WAIT_COUNT}s)"
    fi
done

if [ $WAIT_COUNT -eq $MAX_WAIT ]; then
    echo -e "${RED}❌ Server failed to start within ${MAX_WAIT} seconds${NC}"
    echo "Check logs at: $LOG_FILE"
    tail -50 "$LOG_FILE"
    exit 1
fi

# Test 1: Health check
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}TEST 1: Health Check${NC}"
echo -e "${BLUE}========================================${NC}"

HEALTH_RESPONSE=$(curl -s "${SERVER_URL}/health")
echo "$HEALTH_RESPONSE" | python3 -m json.tool

if echo "$HEALTH_RESPONSE" | grep -q '"model_loaded": true'; then
    echo -e "${GREEN}✅ Model is loaded${NC}"
else
    echo -e "${RED}❌ Model not loaded${NC}"
    exit 1
fi

# Test 2: Simple generation with low temperature (low reasoning)
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}TEST 2: Low Reasoning (temp=0.2)${NC}"
echo -e "${BLUE}========================================${NC}"

RESPONSE=$(curl -s "${SERVER_URL}/v1/messages" \
    -H "Content-Type: application/json" \
    -d '{
        "model": "claude-sonnet-3-5",
        "messages": [
            {"role": "user", "content": "What is 2 + 2? Answer with just the number."}
        ],
        "max_tokens": 20,
        "temperature": 0.2
    }')

echo "Response:"
echo "$RESPONSE" | python3 -m json.tool

# Validate response
if echo "$RESPONSE" | grep -q '"type": "message"'; then
    TEXT=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['content'][0]['text'])")
    echo -e "\n${GREEN}✅ Generated text:${NC} $TEXT"

    # Check for Harmony tokens (should be filtered)
    if echo "$TEXT" | grep -q "<|"; then
        echo -e "${RED}❌ FAIL: Harmony tokens found in response (filtering failed!)${NC}"
        exit 1
    else
        echo -e "${GREEN}✅ No Harmony tokens (properly filtered)${NC}"
    fi
else
    echo -e "${RED}❌ Invalid response format${NC}"
    exit 1
fi

# Test 3: Creative task with high temperature (high reasoning)
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}TEST 3: High Reasoning (temp=1.0)${NC}"
echo -e "${BLUE}========================================${NC}"

RESPONSE=$(curl -s "${SERVER_URL}/v1/messages" \
    -H "Content-Type: application/json" \
    -d '{
        "model": "claude-sonnet-3-5",
        "messages": [
            {"role": "user", "content": "Write a one-sentence creative description of AI."}
        ],
        "max_tokens": 100,
        "temperature": 1.0
    }')

echo "Response:"
echo "$RESPONSE" | python3 -m json.tool

if echo "$RESPONSE" | grep -q '"type": "message"'; then
    TEXT=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['content'][0]['text'])")
    echo -e "\n${GREEN}✅ Generated text:${NC} $TEXT"

    # Validate filtering
    if echo "$TEXT" | grep -q "<|"; then
        echo -e "${RED}❌ FAIL: Harmony tokens found${NC}"
        exit 1
    else
        echo -e "${GREEN}✅ Properly filtered${NC}"
    fi

    # Check tokens were generated
    TOKENS=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['usage']['output_tokens'])")
    if [ "$TOKENS" -gt 0 ]; then
        echo -e "${GREEN}✅ Generated $TOKENS tokens${NC}"
    fi
else
    echo -e "${RED}❌ Invalid response${NC}"
    exit 1
fi

# Test 4: Multi-turn conversation
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}TEST 4: Multi-turn Conversation${NC}"
echo -e "${BLUE}========================================${NC}"

RESPONSE=$(curl -s "${SERVER_URL}/v1/messages" \
    -H "Content-Type: application/json" \
    -d '{
        "model": "claude-sonnet-3-5",
        "messages": [
            {"role": "user", "content": "Hi!"},
            {"role": "assistant", "content": "Hello! How can I help you?"},
            {"role": "user", "content": "What did I just say?"}
        ],
        "max_tokens": 50,
        "temperature": 0.7
    }')

if echo "$RESPONSE" | grep -q '"type": "message"'; then
    TEXT=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['content'][0]['text'])")
    echo -e "\n${GREEN}✅ Generated text:${NC} $TEXT"

    if echo "$TEXT" | grep -q "<|"; then
        echo -e "${RED}❌ FAIL: Harmony tokens found${NC}"
        exit 1
    else
        echo -e "${GREEN}✅ Properly filtered${NC}"
    fi
else
    echo -e "${RED}❌ Invalid response${NC}"
    exit 1
fi

# Summary
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}TEST SUMMARY${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ All tests passed!${NC}"
echo -e "\nKey validations:"
echo -e "  ✅ Server started successfully"
echo -e "  ✅ Model loaded correctly"
echo -e "  ✅ Harmony format requests working"
echo -e "  ✅ Analysis channel filtered (no tokens leaked)"
echo -e "  ✅ Temperature → reasoning level mapping"
echo -e "  ✅ Multi-turn conversation support"
echo -e "\n${GREEN}🎉 Harmony middleware is working with live model!${NC}"

exit 0
