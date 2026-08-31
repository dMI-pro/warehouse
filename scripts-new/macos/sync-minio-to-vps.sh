#!/bin/bash
# Синхронизация бакета MinIO local → VPS через mc mirror.
# Credentials VPS: scripts-new/vps.minio.env (локальный файл, не коммитить)
#   или переменные VPS_MINIO_ENDPOINT / VPS_MINIO_ACCESS_KEY / VPS_MINIO_SECRET_KEY

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=_common.sh
source "$SCRIPT_DIR/_common.sh"

PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
ENV_FILE="$(resolve_env_file "$PROJECT_ROOT")" || { echo "Error: .env not found"; exit 1; }
VPS_ENV="$PROJECT_ROOT/scripts-new/vps.minio.env"

require_container "$MINIO_CONTAINER"
load_minio_creds "$ENV_FILE"

LOCAL_KEY="$MINIO_ACCESS_KEY"
LOCAL_SECRET="$MINIO_SECRET_KEY"
LOCAL_BUCKET="$MINIO_BUCKET"

if [ -f "$VPS_ENV" ]; then
    VPS_HOST=$(read_env "$VPS_ENV" VPS_MINIO_ENDPOINT)
    VPS_KEY=$(read_env "$VPS_ENV" VPS_MINIO_ACCESS_KEY)
    VPS_SECRET=$(read_env "$VPS_ENV" VPS_MINIO_SECRET_KEY)
    VPS_BUCKET=$(read_env "$VPS_ENV" VPS_MINIO_BUCKET)
else
    VPS_HOST="${VPS_MINIO_ENDPOINT:-}"
    VPS_KEY="${VPS_MINIO_ACCESS_KEY:-}"
    VPS_SECRET="${VPS_MINIO_SECRET_KEY:-}"
    VPS_BUCKET="${VPS_MINIO_BUCKET:-}"
fi

[ -z "$VPS_BUCKET" ] && VPS_BUCKET="$LOCAL_BUCKET"
VPS_HOST="${VPS_HOST%/}"

if [ -z "$VPS_HOST" ] || [ -z "$VPS_KEY" ] || [ -z "$VPS_SECRET" ]; then
    echo "Error: VPS MinIO credentials missing."
    echo "Create $VPS_ENV with:"
    echo "  VPS_MINIO_ENDPOINT=https://tsehh.ru:9000"
    echo "  VPS_MINIO_ACCESS_KEY=..."
    echo "  VPS_MINIO_SECRET_KEY=..."
    echo "  VPS_MINIO_BUCKET=antiquar-products"
    exit 1
fi

echo "Sync: local/$LOCAL_BUCKET -> vps/$VPS_BUCKET"
echo "VPS:  $VPS_HOST"
echo ""
read -r -p "Continue? (y/n): " CONFIRM
[[ "$CONFIRM" == "y" ]] || exit 0

docker run --rm --network "container:$MINIO_CONTAINER" --entrypoint=/bin/sh minio/mc -c "
  mc alias set local http://127.0.0.1:9000 '$LOCAL_KEY' '$LOCAL_SECRET' &&
  mc alias set vps '$VPS_HOST' '$VPS_KEY' '$VPS_SECRET' &&
  mc mirror --overwrite local/$LOCAL_BUCKET vps/$VPS_BUCKET &&
  mc anonymous set download vps/$VPS_BUCKET
"

echo ""
echo "Done. Also backup DB and restore on VPS if you changed product records."
