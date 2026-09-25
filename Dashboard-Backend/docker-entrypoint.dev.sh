#!/bin/sh
set -e

# If node_modules or ts-node-dev binary is missing, install dependencies
if [ ! -d "/app/node_modules" ] || [ ! -f "/app/node_modules/.bin/ts-node-dev" ]; then
  echo "Installing backend dependencies..."
  npm ci
fi

echo "Generating Prisma client..."
npx prisma generate

echo "Running database migrations..."
npx prisma migrate deploy

echo "Starting backend development server with hot reload..."
exec npm run dev
