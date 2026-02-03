#!/usr/bin/env bash
# deploy.sh
set -euo pipefail

echo "Pulling latest changes..."
git pull --rebase

echo "Building production images..."
docker compose -f docker-compose.prod.yml build

echo "Starting services..."
docker compose -f docker-compose.prod.yml up -d

echo "Pruning unused images..."
docker image prune -f

echo "Deployment complete."
