#!/bin/bash

# Start the ReactFlow Template UI

echo "🚀 Starting ReactFlow Template UI..."
echo ""

cd ui

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
  echo ""
fi

echo "✨ Starting development server..."
echo "🌐 Opening http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev
