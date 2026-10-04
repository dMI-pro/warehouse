#!/bin/bash
# Warehouse — меню скриптов (local или VPS)

set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAC="$DIR/macos"

chmod +x "$MAC"/*.sh 2>/dev/null || true

# shellcheck source=macos/_common.sh
source "$MAC/_common.sh"

check_minio_local() {
    echo "=== MinIO check (local) ==="
    docker ps --format 'table {{.Names}}\t{{.Status}}' | grep -i minio || true
    docker run --rm --volumes-from "$MINIO_CONTAINER":ro alpine sh -c '
      echo "=== /data ==="
      ls -la /data/
      for d in /data/*/; do
        [ -d "$d" ] || continue
        name=$(basename "$d")
        case "$name" in .minio.sys|.*) continue ;; esac
        echo "files in $name: $(find "$d" -type f 2>/dev/null | wc -l | tr -d " ")"
      done
    '
}

fix_minio_public_local() {
    local env_file
    env_file="$(resolve_env_file "$(dirname "$DIR")")" || { echo "No .env"; return 1; }
    load_minio_creds "$env_file"
    docker run --rm --network "container:$MINIO_CONTAINER" --entrypoint=/bin/sh minio/mc -c "
      mc alias set local http://127.0.0.1:9000 '$MINIO_ACCESS_KEY' '$MINIO_SECRET_KEY' &&
      mc mb local/$MINIO_BUCKET --ignore-existing &&
      mc anonymous set download local/$MINIO_BUCKET
    "
    echo "OK: $MINIO_BUCKET — public download"
}

cd "$(dirname "$DIR")"

if is_vps; then
    MODE="VPS"
else
    MODE="local"
fi

echo "=========================================="
echo "       Warehouse Scripts ($MODE)"
echo "=========================================="
echo ""

while true; do
    if [ "$MODE" = "VPS" ]; then
        echo " 1) Backup Database"
        echo " 2) Backup MinIO"
        echo " 3) Backup ALL (DB + MinIO + rotation)  ← cron uses this"
        echo " 4) Restore Database"
        echo " 5) Restore MinIO (full replace)"
        echo " 6) Fix image paths in DB"
        echo " 7) Renew SSL (Let's Encrypt)"
        echo " 0) Exit"
        echo ""
        read -r -p "Select: " choice
        case "$choice" in
            1) "$MAC/backup-db-vps.sh" ;;
            2) "$MAC/backup-minio-vps.sh" ;;
            3) "$MAC/backup-all-vps.sh" ;;
            4) "$MAC/restore-db-vps.sh" ;;
            5) "$MAC/restore-minio-vps.sh" ;;
            6) "$MAC/fix-file-urls-vps.sh" ;;
            7) "$MAC/renew-ssl-vps.sh" ;;
            0) break ;;
            *) echo "Invalid option" ;;
        esac
    else
        echo " 1) Backup Database (local)"
        echo " 2) Backup MinIO (local)"
        echo " 3) Sync MinIO → VPS (new images)"
        echo " 4) Check MinIO"
        echo " 5) Fix MinIO public policy"
        echo " 6) Pull prod from VPS (live stream dump)"
        echo " 7) Pull prod from VPS + restore local"
        echo " 8) Pull cron backups from VPS (rsync backups-new/)"
        echo " 9) Restore Database (local)"
        echo "10) Restore MinIO (local)"
        echo "11) Fix image paths in DB"
        echo ""
        echo "  VPS: ssh warehouse-ru-vps  →  cd /var/www/warehouse && ./scripts-new/manager.sh"
        echo "  0) Exit"
        echo ""
        read -r -p "Select: " choice
        case "$choice" in
            1) "$MAC/backup-db.sh" ;;
            2) "$MAC/backup-minio.sh" ;;
            3) "$MAC/sync-minio-to-vps.sh" ;;
            4) check_minio_local ;;
            5) fix_minio_public_local ;;
            6) "$MAC/pull-prod-to-local.sh" ;;
            7) "$MAC/pull-prod-to-local.sh" --restore ;;
            8) "$MAC/pull-backups-from-vps.sh" ;;
            9) "$MAC/restore-db.sh" ;;
            10) "$MAC/restore-minio.sh" ;;
            11) "$MAC/fix-file-urls-vps.sh" ;;
            0) break ;;
            *) echo "Invalid option" ;;
        esac
    fi
    echo ""
done
