#!/bin/bash
# Ежедневный бэкап на VPS: PostgreSQL + MinIO, ротация старше N дней, лог в backups-new/
# Для cron: 15 3 * * * cd /var/www/warehouse && ./scripts-new/macos/backup-all-vps.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=_common.sh
source "$SCRIPT_DIR/_common.sh"

PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
BACKUP_ROOT="$PROJECT_ROOT/backups-new"
LOG_FILE="${BACKUP_LOG_FILE:-$BACKUP_ROOT/backup.log}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

mkdir -p "$BACKUP_ROOT/database" "$BACKUP_ROOT/minio"
touch "$LOG_FILE"

log() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $*"
    echo "$msg" | tee -a "$LOG_FILE"
}

rotate_old() {
    local days="$1"
    log "Rotation: remove backups older than ${days} days"

    find "$BACKUP_ROOT/database" -type f -name 'backup_*.sql' -mtime +"$days" -print -delete 2>/dev/null \
        | while read -r f; do log "  deleted $f"; done || true

    # MinIO folders: minio-backup-YYYYMMDD-HHMMSS
    find "$BACKUP_ROOT/minio" -mindepth 1 -maxdepth 1 -type d -name 'minio-backup-*' -mtime +"$days" -print 2>/dev/null \
        | while read -r d; do
            log "  deleted $d"
            rm -rf "$d"
        done || true
}

cd "$PROJECT_ROOT"

log "========== backup-all-vps start (retention=${RETENTION_DAYS}d) =========="

if ! is_vps; then
    log "ERROR: not detected as VPS (no antiquar-proxy / prod.env). Abort."
    exit 1
fi

log "[1/2] Database backup..."
if bash "$SCRIPT_DIR/backup-db-vps.sh" >>"$LOG_FILE" 2>&1; then
    log "[1/2] Database OK"
else
    log "ERROR: database backup failed"
    exit 1
fi

log "[2/2] MinIO backup..."
if bash "$SCRIPT_DIR/backup-minio-vps.sh" >>"$LOG_FILE" 2>&1; then
    log "[2/2] MinIO OK"
else
    log "ERROR: MinIO backup failed"
    exit 1
fi

rotate_old "$RETENTION_DAYS"

DB_COUNT=$(find "$BACKUP_ROOT/database" -type f -name 'backup_*.sql' 2>/dev/null | wc -l | tr -d ' ')
MINIO_COUNT=$(find "$BACKUP_ROOT/minio" -mindepth 1 -maxdepth 1 -type d -name 'minio-backup-*' 2>/dev/null | wc -l | tr -d ' ')
DISK=$(df -h "$BACKUP_ROOT" | awk 'NR==2 {print $4 " free of " $2}')

log "Kept: ${DB_COUNT} DB dump(s), ${MINIO_COUNT} MinIO folder(s); disk: $DISK"
log "========== backup-all-vps done =========="
