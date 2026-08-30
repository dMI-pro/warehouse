#!/bin/bash
# Общие хелперы для Warehouse (antiquar)

# shellcheck disable=SC2034
DB_CONTAINER="${DB_CONTAINER:-antiquar-db}"
MINIO_CONTAINER="${MINIO_CONTAINER:-antiquar-minio}"
BACKEND_CONTAINER="${BACKEND_CONTAINER:-antiquar-backend}"
PROXY_CONTAINER="${PROXY_CONTAINER:-antiquar-proxy}"
DEFAULT_BUCKET="${DEFAULT_BUCKET:-antiquar-products}"

scripts_project_root() {
    local script_dir
    script_dir="$(cd "$(dirname "${BASH_SOURCE[1]}")" && pwd)"
    dirname "$(dirname "$script_dir")"
}

read_env() {
    local file="$1" key="$2" raw
    [ -f "$file" ] || return 0
    raw=$(grep -E "^${key}=" "$file" | head -1 | cut -d'=' -f2- \
        | sed 's/[[:space:]]*#.*//' | tr -d '\r' | tr -d '"' | tr -d "'" \
        | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    printf '%s' "$raw"
}

resolve_env_file() {
    local root="$1"
    if is_vps && [ -f "$root/prod.env" ]; then
        echo "$root/prod.env"
    elif [ -f "$root/.env" ]; then
        echo "$root/.env"
    elif [ -f "$root/prod.env" ]; then
        echo "$root/prod.env"
    else
        return 1
    fi
}

is_vps() {
    # VPS: есть proxy или prod.env + контейнер БД
    if docker ps --format '{{.Names}}' 2>/dev/null | grep -qx "$PROXY_CONTAINER"; then
        return 0
    fi
    if [ -f "$(pwd)/prod.env" ] && docker ps --format '{{.Names}}' 2>/dev/null | grep -qx "$DB_CONTAINER"; then
        local fe
        fe=$(read_env "$(pwd)/prod.env" FRONTEND_URL)
        case "$fe" in
            https://*|http://*tsehh*) return 0 ;;
        esac
    fi
    return 1
}

require_container() {
    local name="$1"
    if ! docker ps --format '{{.Names}}' | grep -qx "$name"; then
        echo "Error: container '$name' is not running"
        exit 1
    fi
}

load_db_creds() {
    local env_file="$1"
    DB_USER=$(read_env "$env_file" DB_USER)
    DB_NAME=$(read_env "$env_file" DB_NAME)
    [ -n "$DB_USER" ] && [ -n "$DB_NAME" ] || {
        echo "Error: DB_USER / DB_NAME missing in $env_file"
        exit 1
    }
}

load_minio_creds() {
    local env_file="$1"
    MINIO_ACCESS_KEY=$(read_env "$env_file" MINIO_ACCESS_KEY)
    MINIO_SECRET_KEY=$(read_env "$env_file" MINIO_SECRET_KEY)
    MINIO_BUCKET=$(read_env "$env_file" MINIO_BUCKET)
    [ -z "$MINIO_BUCKET" ] && MINIO_BUCKET="$DEFAULT_BUCKET"
    [ -n "$MINIO_ACCESS_KEY" ] && [ -n "$MINIO_SECRET_KEY" ] || {
        echo "Error: MINIO_ACCESS_KEY / MINIO_SECRET_KEY missing in $env_file"
        exit 1
    }
}

compose_file_for_mode() {
    local root="$1"
    if is_vps; then
        if [ -f "$root/docker-compose.prod.yml" ]; then
            echo "$root/docker-compose.prod.yml"
            return
        fi
    fi
    echo "$root/docker-compose.yml"
}

# Копирует бакеты из /data контейнера MinIO в целевую папку (без .minio.sys)
backup_minio_buckets_to() {
    local target="$1"
    mkdir -p "$target"
    docker run --rm --volumes-from "$MINIO_CONTAINER" \
        -v "$target:/backup" \
        alpine sh -c '
          for item in /data/*; do
            [ -d "$item" ] || continue
            name=$(basename "$item")
            case "$name" in .minio.sys|.*) continue ;; esac
            cp -a "$item" /backup/
          done
        '
}
