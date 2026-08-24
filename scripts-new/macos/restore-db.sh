#!/bin/bash
# Восстановление PostgreSQL (local или VPS — по контейнеру antiquar-db)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=_common.sh
source "$SCRIPT_DIR/_common.sh"

PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
ENV_FILE="$(resolve_env_file "$PROJECT_ROOT")" || { echo "Error: .env / prod.env not found"; exit 1; }
BACKUP_DIR="$PROJECT_ROOT/backups-new/database"
PRESELECTED="${1:-}"

load_db_creds "$ENV_FILE"
require_container "$DB_CONTAINER"

echo "=========================================="
echo "     Warehouse Database Restore"
echo "=========================================="
echo "Container: $DB_CONTAINER"
echo "Database:  $DB_NAME (user: $DB_USER)"
echo ""

if [ ! -d "$BACKUP_DIR" ]; then
    echo "Backup directory not found: $BACKUP_DIR"
    exit 1
fi

if [ -n "$PRESELECTED" ]; then
    BACKUP_FILE="$PRESELECTED"
else
    echo "Available backups:"
    ls -1 "$BACKUP_DIR"/*.sql 2>/dev/null | xargs -n 1 basename || true
    echo ""
    read -r -p "Enter the filename to restore: " BACKUP_FILE
fi

if [ -z "$BACKUP_FILE" ]; then
    echo "No filename provided."
    exit 1
fi

# Allow absolute path or basename
if [ -f "$BACKUP_FILE" ]; then
    BACKUP_PATH="$BACKUP_FILE"
elif [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE"
else
    echo "File not found: $BACKUP_FILE"
    exit 1
fi

echo ""
echo "WARNING: This will OVERWRITE database '$DB_NAME'."
echo "Selected: $BACKUP_PATH"
if [ -z "${RESTORE_YES:-}" ]; then
    read -r -p "Are you sure? (y/n): " CONFIRM
    [[ "$CONFIRM" == "y" ]] || { echo "Cancelled."; exit 0; }
fi

echo "Restoring..."
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" \
    -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO \"$DB_USER\"; GRANT ALL ON SCHEMA public TO public;"

docker cp "$BACKUP_PATH" "$DB_CONTAINER:/tmp/restore.sql"
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -f /tmp/restore.sql
docker exec "$DB_CONTAINER" rm -f /tmp/restore.sql

echo ""
echo "Restore completed."
echo "If images are missing — restore MinIO from the SAME backup session."
