#!/bin/bash
# Нормализация путей картинок в products.images:
# убирает абсолютные URL / префикс /minio/antiquar-products/ → оставляем keys (products/...)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=_common.sh
source "$SCRIPT_DIR/_common.sh"

PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
ENV_FILE="$(resolve_env_file "$PROJECT_ROOT")" || { echo "Error: .env / prod.env not found"; exit 1; }
SQL_FILE="$SCRIPT_DIR/fix-file-urls.sql"

load_db_creds "$ENV_FILE"
require_container "$DB_CONTAINER"

docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" < "$SQL_FILE"
echo "Done. Restart backend if needed: docker restart $BACKEND_CONTAINER"
