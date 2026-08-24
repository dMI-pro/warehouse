#!/bin/bash
# Восстановление MinIO из папки backups-new/minio/minio-backup-*
# Работает и локально, и на VPS (volumes-from antiquar-minio).
# .minio.sys из бэкапа НЕ копируется.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=_common.sh
source "$SCRIPT_DIR/_common.sh"

PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
ENV_FILE="$(resolve_env_file "$PROJECT_ROOT")" || { echo "Error: .env / prod.env not found"; exit 1; }
BACKUP_DIR="$PROJECT_ROOT/backups-new/minio"
COMPOSE_FILE="$(compose_file_for_mode "$PROJECT_ROOT")"
PRESELECTED="${1:-}"

cd "$PROJECT_ROOT"
load_minio_creds "$ENV_FILE"

echo "=========================================="
echo "     Warehouse MinIO Restore"
echo "=========================================="
echo "Container:    $MINIO_CONTAINER"
echo "MINIO_BUCKET: $MINIO_BUCKET"
echo "Compose:      $COMPOSE_FILE"
echo ""

if [ ! -d "$BACKUP_DIR" ]; then
    echo "Backup directory not found: $BACKUP_DIR"
    exit 1
fi

if [ -n "$PRESELECTED" ]; then
    BACKUP_NAME="$PRESELECTED"
else
    echo "Available backups:"
    find "$BACKUP_DIR" -maxdepth 1 -mindepth 1 -type d -name 'minio-backup-*' | sort -r | while read -r folder; do
        basename "$folder"
    done
    echo ""
    read -r -p "Enter backup folder name: " BACKUP_NAME
fi

if [ -z "$BACKUP_NAME" ]; then
    echo "No folder name provided."
    exit 1
fi

if [ -d "$BACKUP_NAME" ]; then
    BACKUP_PATH="$BACKUP_NAME"
elif [ -d "$BACKUP_DIR/$BACKUP_NAME" ]; then
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
else
    echo "Folder not found: $BACKUP_NAME"
    exit 1
fi

SOURCE_BUCKET=""
for item in "$BACKUP_PATH"/*; do
    [ -d "$item" ] || continue
    name=$(basename "$item")
    [[ "$name" == .* ]] && continue
    if [ "$name" = "$MINIO_BUCKET" ] || [ -z "$SOURCE_BUCKET" ]; then
        SOURCE_BUCKET="$name"
    fi
done

if [ -z "$SOURCE_BUCKET" ] || [ ! -d "$BACKUP_PATH/$SOURCE_BUCKET" ]; then
    echo "Error: no bucket folder in backup (expected $MINIO_BUCKET/)"
    exit 1
fi

echo "Backup preview:"
docker run --rm -v "$BACKUP_PATH:/backup:ro" alpine sh -c '
  for dir in /backup/*/; do
    [ -d "$dir" ] || continue
    name=$(basename "$dir")
    case "$name" in .minio.sys|.*) continue ;; esac
    count=$(find "$dir" -type f 2>/dev/null | wc -l | tr -d " ")
    echo "  bucket \"$name\": $count files"
  done
'

TARGET_BUCKET="$MINIO_BUCKET"
RENAME=0
if [ "$SOURCE_BUCKET" != "$MINIO_BUCKET" ]; then
    echo "WARNING: backup bucket '$SOURCE_BUCKET' != MINIO_BUCKET='$MINIO_BUCKET'"
    if [ -z "${RESTORE_YES:-}" ]; then
        read -r -p "Rename to $MINIO_BUCKET after copy? (y/n): " RENAME_ANSWER
        [[ "$RENAME_ANSWER" == "y" ]] && RENAME=1
    else
        RENAME=1
    fi
fi

echo ""
echo "WARNING: Overwrites MinIO data for bucket '$TARGET_BUCKET'."
if [ -z "${RESTORE_YES:-}" ]; then
    read -r -p "Continue? (y/n): " CONFIRM
    [[ "$CONFIRM" == "y" ]] || { echo "Cancelled."; exit 0; }
fi

echo "[1/5] Stopping MinIO..."
if [ -f "$COMPOSE_FILE" ]; then
    docker compose -f "$COMPOSE_FILE" stop minio 2>/dev/null \
        || docker stop "$MINIO_CONTAINER"
else
    docker stop "$MINIO_CONTAINER"
fi

echo "[2/5] Clearing bucket data..."
# Контейнер остановлен — volumes-from всё ещё видит mounts
docker run --rm --volumes-from "$MINIO_CONTAINER" alpine sh -c "
  set -e
  rm -rf /data/$SOURCE_BUCKET /data/$MINIO_BUCKET
"

echo "[3/5] Copying bucket (skip .minio.sys)..."
docker run --rm --volumes-from "$MINIO_CONTAINER" \
    -v "$BACKUP_PATH:/backup:ro" \
    alpine sh -c "
      set -e
      cp -a /backup/$SOURCE_BUCKET /data/$SOURCE_BUCKET
      chown -R 1000:1000 /data/$SOURCE_BUCKET || true
    "

if [ "$RENAME" -eq 1 ]; then
    docker run --rm --volumes-from "$MINIO_CONTAINER" alpine sh -c "
      set -e
      mv /data/$SOURCE_BUCKET /data/$MINIO_BUCKET
      chown -R 1000:1000 /data/$MINIO_BUCKET || true
    "
fi

echo "[4/5] Starting MinIO..."
if [ -f "$COMPOSE_FILE" ]; then
    docker compose -f "$COMPOSE_FILE" up -d minio 2>/dev/null \
        || docker start "$MINIO_CONTAINER"
else
    docker start "$MINIO_CONTAINER"
fi

echo "Waiting for MinIO..."
for _ in $(seq 1 30); do
    if docker exec "$MINIO_CONTAINER" mc --help >/dev/null 2>&1 \
        || docker exec "$MINIO_CONTAINER" ls /data >/dev/null 2>&1; then
        sleep 2
        break
    fi
    sleep 1
done
sleep 3

echo "[5/5] Bucket policy (public download)..."
# mc может отсутствовать в образе minio — используем временный mc-клиент
# minio/mc image ENTRYPOINT is already `mc` — override to run a shell script
docker run --rm --network "container:$MINIO_CONTAINER" --entrypoint=/bin/sh minio/mc \
    -c "
      mc alias set local http://127.0.0.1:9000 '$MINIO_ACCESS_KEY' '$MINIO_SECRET_KEY' &&
      mc mb local/$MINIO_BUCKET --ignore-existing &&
      mc anonymous set download local/$MINIO_BUCKET
    " || echo "WARNING: could not set anonymous policy (check credentials)"

FILE_COUNT=$(docker run --rm --volumes-from "$MINIO_CONTAINER":ro alpine \
    sh -c "find /data/$TARGET_BUCKET -type f 2>/dev/null | wc -l" | tr -d ' ')

echo ""
echo "Restore completed. Files on disk: $FILE_COUNT"
echo "If products have no images in UI — restore matching .sql via restore-db.sh"
