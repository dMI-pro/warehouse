#!/bin/bash
# Скачать уже сделанные бэкапы с VPS (backups-new/) на Mac.
# Не создаёт новый дамп на сервере — только копирует то, что накопил cron.
#
# Usage:
#   ./scripts-new/macos/pull-backups-from-vps.sh
#   ./scripts-new/macos/pull-backups-from-vps.sh --latest
#   WAREHOUSE_SSH_HOST=warehouse-ru-vps ./scripts-new/macos/pull-backups-from-vps.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=_common.sh
source "$SCRIPT_DIR/_common.sh"

PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
SSH_HOST="${WAREHOUSE_SSH_HOST:-warehouse-ru-vps}"
REMOTE_ROOT="${REMOTE_WAREHOUSE_ROOT:-/var/www/warehouse}"
LOCAL_ROOT="$PROJECT_ROOT/backups-new"
LATEST_ONLY=0

usage() {
    cat <<EOF
Usage: $(basename "$0") [options]

  Copy VPS backups-new/ → local backups-new/ (rsync over SSH).
  Does NOT run backup on the server (use pull-prod-to-local.sh for a fresh stream).

  --latest      Only the newest DB .sql and newest minio-backup-* folder
  --ssh HOST    SSH host (default: warehouse-ru-vps)
  -h            Help

Env:
  WAREHOUSE_SSH_HOST, REMOTE_WAREHOUSE_ROOT
EOF
}

while [ $# -gt 0 ]; do
    case "$1" in
        --latest) LATEST_ONLY=1 ;;
        --ssh) SSH_HOST="$2"; shift ;;
        -h|--help) usage; exit 0 ;;
        *) echo "Unknown option: $1"; usage; exit 1 ;;
    esac
    shift
done

mkdir -p "$LOCAL_ROOT/database" "$LOCAL_ROOT/minio"

echo "=========================================="
echo "  Pull backups from VPS → Mac"
echo "=========================================="
echo "SSH:    $SSH_HOST"
echo "Remote: $REMOTE_ROOT/backups-new/"
echo "Local:  $LOCAL_ROOT/"
echo ""

if ! ssh -o BatchMode=yes -o ConnectTimeout=10 "$SSH_HOST" "test -d '$REMOTE_ROOT/backups-new'"; then
    echo "Error: cannot reach $SSH_HOST or missing $REMOTE_ROOT/backups-new"
    exit 1
fi

if [ "$LATEST_ONLY" -eq 1 ]; then
    echo "[latest] Resolving newest DB + MinIO on VPS..."
    LATEST_SQL=$(ssh "$SSH_HOST" "ls -1t '$REMOTE_ROOT/backups-new/database'/backup_*.sql 2>/dev/null | head -1" || true)
    LATEST_MINIO=$(ssh "$SSH_HOST" "ls -1dt '$REMOTE_ROOT/backups-new/minio'/minio-backup-* 2>/dev/null | head -1" || true)

    if [ -z "$LATEST_SQL" ] && [ -z "$LATEST_MINIO" ]; then
        echo "No backups found on VPS."
        exit 1
    fi

    if [ -n "$LATEST_SQL" ]; then
        echo "  DB:   $LATEST_SQL"
        rsync -avz -e ssh "${SSH_HOST}:${LATEST_SQL}" "$LOCAL_ROOT/database/"
    fi
    if [ -n "$LATEST_MINIO" ]; then
        NAME=$(basename "$LATEST_MINIO")
        echo "  MinIO: $LATEST_MINIO"
        mkdir -p "$LOCAL_ROOT/minio/$NAME"
        rsync -avz -e ssh "${SSH_HOST}:${LATEST_MINIO}/" "$LOCAL_ROOT/minio/$NAME/"
    fi
else
    echo "[all] Syncing database/ ..."
    rsync -avz -e ssh \
        "${SSH_HOST}:${REMOTE_ROOT}/backups-new/database/" \
        "$LOCAL_ROOT/database/"

    echo "[all] Syncing minio/ ..."
    rsync -avz -e ssh \
        --exclude='.*' \
        "${SSH_HOST}:${REMOTE_ROOT}/backups-new/minio/" \
        "$LOCAL_ROOT/minio/"

    if ssh "$SSH_HOST" "test -f '$REMOTE_ROOT/backups-new/backup.log'"; then
        rsync -avz -e ssh \
            "${SSH_HOST}:${REMOTE_ROOT}/backups-new/backup.log" \
            "$LOCAL_ROOT/backup-vps.log"
        echo "Log → $LOCAL_ROOT/backup-vps.log"
    fi
fi

echo ""
echo "Done. Local:"
ls -lah "$LOCAL_ROOT/database" 2>/dev/null | tail -n +1 | tail -8 || true
echo "..."
ls -lah "$LOCAL_ROOT/minio" 2>/dev/null | tail -n +1 | tail -8 || true
echo ""
echo "Restore (optional):"
echo "  ./scripts-new/macos/restore-db.sh <file.sql>"
echo "  ./scripts-new/macos/restore-minio.sh <minio-backup-...>"
