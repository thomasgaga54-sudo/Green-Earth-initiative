#!/usr/bin/env bash
set -e

echo "Installing frontend dependencies..."
npm install --prefix backend/frontend

echo "Building frontend..."
npm run build --prefix backend/frontend

echo "Build complete. dist contents:"
ls backend/frontend/dist
