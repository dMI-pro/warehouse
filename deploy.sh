#!/usr/bin/env bash
set -euo pipefail

BRANCH="${1:-staging}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "${SCRIPT_DIR}"

echo "Deploy branch: ${BRANCH}"
echo "Compose file: ${COMPOSE_FILE}"

echo "Fetching latest changes..."
git fetch origin "${BRANCH}"

echo "Switching to branch ${BRANCH}..."
git checkout "${BRANCH}"

echo "Pulling latest commit (fast-forward only)..."
git pull --ff-only origin "${BRANCH}"

echo "Rebuilding and starting services..."
docker compose -f "${COMPOSE_FILE}" up -d --build

echo "Pruning unused images..."
docker image prune -f >/dev/null

echo "Deployment complete."
