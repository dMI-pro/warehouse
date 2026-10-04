#!/bin/bash
# Скачать prod бэкап с VPS на Mac БЕЗ записи файлов в проект на сервере.
# DB и MinIO стримятся по SSH во временные локальные файлы, затем опциональный restore.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=_common.sh
source "$SCRIPT_DIR/_common.sh"

PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
SSH_HOST="${WAREHOUSE_SSH_HOST:-warehouse-vps}"
REMOTE_DB_CONTAINER="${REMOTE_DB_CONTAINER:-antiquar-db}"
REMOTE_MINIO_CONTAINER="${REMOTE_MINIO_CONTAINER:-antiquar-minio}"
REMOTE_ENV="${REMOTE_ENV_FILE:-/var/www/warehouse/prod.env}"
BACKUP_ROOT="$PROJECT_ROOT/backups-new"
DATE_TIME=$(date +"%Y-%m-%d_%H-%M-%S")
STAMP=$(date +"%Y%m%d-%H%M%S")

DO_RESTORE=0
SKIP_MINIO=0
SKIP_DB=0

usage() {
    cat <<EOF
Usage: $(basename "$0") [options]

  --restore     После скачивания восстановить локально (DB + MinIO)
  --db-only     Только база
  --minio-only  Только MinIO
  --ssh HOST    SSH host (default: warehouse-vps)
  -h            Help

Env:
  WAREHOUSE_SSH_HOST, REMOTE_DB_CONTAINER, REMOTE_MINIO_CONTAINER, REMOTE_ENV_FILE
EOF
}

while [ $# -gt 0 ]; do
    case "$1" in
        --restore) DO_RESTORE=1 ;;
        --db-only) SKIP_MINIO=1 ;;
        --minio-only) SKIP_DB=1 ;;
        --ssh) SSH_HOST="$2"; shift ;;
        -h|--help) usage; exit 0 ;;
        *) echo "Unknown option: $1"; usage; exit 1 ;;
    esac
    shift
done

mkdir -p "$BACKUP_ROOT/database" "$BACKUP_ROOT/minio"

echo "=========================================="
echo "  Pull prod from VPS → local"
echo "=========================================="
echo "SSH: $SSH_HOST"
echo "Out: $BACKUP_ROOT"
echo ""

# Read remote DB/MinIO creds (values stay on this machine after fetch)
REMOTE_DB_USER=$(ssh "$SSH_HOST" "grep -E '^DB_USER=' '$REMOTE_ENV' | head -1 | cut -d= -f2- | tr -d '\"' | tr -d \"'\"" )
REMOTE_DB_NAME=$(ssh "$SSH_HOST" "grep -E '^DB_NAME=' '$REMOTE_ENV' | head -1 | cut -d= -f2- | tr -d '\"' | tr -d \"'\"" )
REMOTE_BUCKET=$(ssh "$SSH_HOST" "grep -E '^MINIO_BUCKET=' '$REMOTE_ENV' | head -1 | cut -d= -f2- | tr -d '\"' | tr -d \"'\"" )
[ -z "$REMOTE_BUCKET" ] && REMOTE_BUCKET="$DEFAULT_BUCKET"

[ -n "$REMOTE_DB_USER" ] && [ -n "$REMOTE_DB_NAME" ] || {
    echo "Error: could not read DB_USER/DB_NAME from $REMOTE_ENV on VPS"
    exit 1
}

SQL_FILE=""
MINIO_FOLDER=""

if [ "$SKIP_DB" -eq 0 ]; then
    SQL_FILE="$BACKUP_ROOT/database/backup_${REMOTE_DB_NAME}_prod_${DATE_TIME}.sql"
    echo "[1/2] Streaming pg_dump ($REMOTE_DB_NAME) → $SQL_FILE"
    ssh "$SSH_HOST" "docker exec $REMOTE_DB_CONTAINER pg_dump -U $REMOTE_DB_USER -d $REMOTE_DB_NAME --no-owner --no-acl" \
        > "$SQL_FILE"
    echo "  OK ($(wc -c < "$SQL_FILE" | tr -d ' ') bytes)"
fi

if [ "$SKIP_MINIO" -eq 0 ]; then
    MINIO_FOLDER="$BACKUP_ROOT/minio/minio-backup-prod-${STAMP}"
    mkdir -p "$MINIO_FOLDER"
    echo "[2/2] Streaming MinIO bucket $REMOTE_BUCKET → $MINIO_FOLDER"
    # tar stream bucket only (no .minio.sys) — nothing written under /var/www/warehouse
    ssh "$SSH_HOST" "docker run --rm --volumes-from $REMOTE_MINIO_CONTAINER alpine \
        sh -c 'cd /data && tar cf - \"$REMOTE_BUCKET\"'" \
        | tar xf - -C "$MINIO_FOLDER"
    echo "  OK:"
    find "$MINIO_FOLDER" -maxdepth 1 -type d ! -path "$MINIO_FOLDER" -exec basename {} \;
    FILE_COUNT=$(find "$MINIO_FOLDER" -type f | wc -l | tr -d ' ')
    echo "  files: $FILE_COUNT"
fi

echo ""
echo "Download complete."

if [ "$DO_RESTORE" -eq 1 ]; then
    echo ""
    echo "Restoring locally..."
    export RESTORE_YES=y

    # Останавливаем backend, чтобы DROP SCHEMA / restore не ловили активные коннекты
    BACKEND_WAS_UP=0
    if docker ps --format '{{.Names}}' | grep -qx "$BACKEND_CONTAINER"; then
        BACKEND_WAS_UP=1
        echo "Stopping $BACKEND_CONTAINER for safe restore..."
        docker stop "$BACKEND_CONTAINER" >/dev/null
    fi

    if [ "$SKIP_DB" -eq 0 ] && [ -n "$SQL_FILE" ]; then
        "$SCRIPT_DIR/restore-db.sh" "$(basename "$SQL_FILE")"
    fi
    if [ "$SKIP_MINIO" -eq 0 ] && [ -n "$MINIO_FOLDER" ]; then
        "$SCRIPT_DIR/restore-minio.sh" "$(basename "$MINIO_FOLDER")"
    fi
    if [ "$SKIP_DB" -eq 0 ]; then
        "$SCRIPT_DIR/fix-file-urls-vps.sh" || true
    fi

    if [ "$BACKEND_WAS_UP" -eq 1 ]; then
        echo "Starting $BACKEND_CONTAINER..."
        docker start "$BACKEND_CONTAINER" >/dev/null
    fi

    echo ""
    echo "Local restore finished. Check: http://localhost:5173 and MinIO :9000"
else
    echo ""
    echo "Next (manual restore):"
    [ -n "$SQL_FILE" ] && echo "  ./scripts-new/macos/restore-db.sh $(basename "$SQL_FILE")"
    [ -n "$MINIO_FOLDER" ] && echo "  ./scripts-new/macos/restore-minio.sh $(basename "$MINIO_FOLDER")"
    echo "  ./scripts-new/macos/fix-file-urls-vps.sh"
    echo ""
    echo "Or re-run with --restore"
fi
