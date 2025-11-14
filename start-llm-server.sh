#!/bin/bash
#
# LLM Server Launcher (from project root)
# Convenience wrapper that navigates to llm_server/ and starts the server
#

# Get project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Navigate to llm_server and execute startup script
cd "$PROJECT_ROOT/llm_server"
exec ./start-server.sh
