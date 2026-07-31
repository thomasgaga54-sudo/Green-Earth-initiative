#!/usr/bin/env bash
set -e

echo "Installing frontend dependencies..."
npm install --prefix backend/frontend

echo "Building frontend..."
npm run build --prefix backend/frontend

echo "Seeding database (admin + tasks)..."
node backend/src/seed.js

echo "Build and seed completed successfully."
