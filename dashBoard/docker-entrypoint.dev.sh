#!/bin/sh
set -e

# If node_modules or vite binary is missing, install dependencies
if [ ! -d "/app/node_modules" ] || [ ! -f "/app/node_modules/.bin/vite" ]; then
  echo "Installing frontend dependencies..."
  npm ci
fi

echo "Starting frontend development server with hot reload..."
exec npm run dev
