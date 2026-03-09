#!/bin/sh
set -e

echo "Running database migrations..."
node --import tsx src/lib/db/migrate.ts || echo "Migration skipped (tsx not available in production)"

echo "Starting application..."
exec node server.js
