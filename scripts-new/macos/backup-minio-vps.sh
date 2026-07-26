#!/bin/bash
# Бэкап MinIO на VPS (только бакеты; работает с bind-mount и volume)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=_common.sh
source "$SCRIPT_DIR/_common.sh"

PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
BACKUP_DIR="$PROJECT_ROOT/backups-new/minio"
DATE_TIME=$(date +"%Y%m%d-%H%M%S")
BACKUP_FOLDER="minio-backup-${DATE_TIME}"
TARGET="$BACKUP_DIR/$BACKUP_FOLDER"

cd "$PROJECT_ROOT"
require_container "$MINIO_CONTAINER"
mkdir -p "$BACKUP_DIR"

echo "Backup MinIO ($MINIO_CONTAINER) -> $TARGET"
backup_minio_buckets_to "$TARGET"
echo "OK: $TARGET"
ls -la "$TARGET"
