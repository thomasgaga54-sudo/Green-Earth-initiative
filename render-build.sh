#!/usr/bin/env bash
set -e

echo "Installing frontend dependencies..."
npm install --prefix backend/frontend

echo "Building frontend..."
npm run build --prefix backend/frontend

echo "Frontend build completed successfully."

# Seed is optional - don't fail build if DB is unavailable
echo "Seeding database (admin + tasks)..."
node backend/src/seed.js || echo "Seed skipped (DB may not be available at build time)"

echo "Build complete."
