#!/bin/bash
# Бэкап PostgreSQL на VPS

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=_common.sh
source "$SCRIPT_DIR/_common.sh"

PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
ENV_FILE="$(resolve_env_file "$PROJECT_ROOT")" || { echo "Error: .env / prod.env not found"; exit 1; }
BACKUP_DIR="$PROJECT_ROOT/backups-new/database"

cd "$PROJECT_ROOT"
load_db_creds "$ENV_FILE"
require_container "$DB_CONTAINER"

mkdir -p "$BACKUP_DIR"
DATE_TIME=$(date +"%Y-%m-%d_%H-%M-%S")
FILENAME="$BACKUP_DIR/backup_${DB_NAME}_${DATE_TIME}.sql"
TMPDUMP="/tmp/backup_${DB_NAME}_${DATE_TIME}.sql"

echo "Backup: $DB_NAME from $DB_CONTAINER (VPS)"
docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" \
    --no-owner --no-acl -f "$TMPDUMP"
docker cp "$DB_CONTAINER:$TMPDUMP" "$FILENAME"
docker exec "$DB_CONTAINER" rm -f "$TMPDUMP"
echo "OK: $FILENAME"
