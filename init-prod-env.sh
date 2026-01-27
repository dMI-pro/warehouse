#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXAMPLE="${ROOT_DIR}/.env.example"
TARGET="${ROOT_DIR}/prod.env"

if [[ ! -f "${EXAMPLE}" ]]; then
  echo ".env.example not found in ${ROOT_DIR}"
  exit 1
fi

cp "${EXAMPLE}" "${TARGET}"
echo "Created prod.env from .env.example."
echo "Please edit prod.env and fill production values (DB credentials, JWT, MinIO, FRONTEND_URL, etc.)."
