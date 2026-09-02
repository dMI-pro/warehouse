#!/bin/bash
# Продление Let's Encrypt на VPS (standalone, как setup-ssl.sh).
# Кратко останавливает proxy (порт 80), затем копирует certs/ и поднимает proxy.
#
# Cron (пример): 20 4 * * 0  → каждое воскресенье 04:20 MSK
# Ручной тест:   ./scripts-new/macos/renew-ssl-vps.sh --dry-run

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=_common.sh
source "$SCRIPT_DIR/_common.sh"

PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.prod.yml"
LOG_FILE="${SSL_RENEW_LOG_FILE:-$PROJECT_ROOT/backups-new/ssl-renew.log}"
DRY_RUN=0

usage() {
    cat <<EOF
Usage: $(basename "$0") [--dry-run|--check-only]

  Renew TLS certs via Docker certbot/certbot (standalone).
  Copies live certs into ./certs/ for nginx, restarts proxy.

  --dry-run      Simulate renew (stops proxy briefly, no cert replace)
  --check-only   Only print/log expiry (no downtime, no renew)
EOF
}

CHECK_ONLY=0
while [ $# -gt 0 ]; do
    case "$1" in
        --dry-run) DRY_RUN=1 ;;
        --check-only) CHECK_ONLY=1 ;;
        -h|--help) usage; exit 0 ;;
        *) echo "Unknown option: $1"; usage; exit 1 ;;
    esac
    shift
done

mkdir -p "$(dirname "$LOG_FILE")" "$PROJECT_ROOT/certs" "$PROJECT_ROOT/letsencrypt" "$PROJECT_ROOT/letsencrypt-lib"
touch "$LOG_FILE"

log() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $*"
    echo "$msg" | tee -a "$LOG_FILE"
}

log_cert_expiry() {
    local pem="$PROJECT_ROOT/certs/fullchain.pem"
    if [ ! -f "$pem" ]; then
        log "Cert file missing: $pem"
        return 1
    fi
    local end_raw end_epoch now_epoch days_left
    end_raw=$(openssl x509 -in "$pem" -noout -enddate 2>/dev/null | cut -d= -f2)
    end_epoch=$(date -d "$end_raw" +%s 2>/dev/null || true)
    now_epoch=$(date +%s)
    if [ -n "$end_epoch" ]; then
        days_left=$(( (end_epoch - now_epoch) / 86400 ))
        log "Certificate expires: $end_raw ($days_left days left)"
        if [ "$days_left" -le 30 ]; then
            log "WARN: less than 30 days left — next successful renew should replace the cert"
        fi
    else
        log "Certificate enddate: $end_raw"
    fi
}

cd "$PROJECT_ROOT"

if [ ! -f "$COMPOSE_FILE" ]; then
    log "ERROR: $COMPOSE_FILE not found"
    exit 1
fi

# Domain from existing LE live dir, fallback FRONTEND_URL / tsehh.ru
DOMAIN=""
if [ -d "$PROJECT_ROOT/letsencrypt/live" ]; then
    DOMAIN=$(find "$PROJECT_ROOT/letsencrypt/live" -mindepth 1 -maxdepth 1 -type d ! -name 'README*' -printf '%f\n' 2>/dev/null | head -1 || true)
fi
if [ -z "$DOMAIN" ] && [ -f "$PROJECT_ROOT/prod.env" ]; then
    DOMAIN=$(read_env "$PROJECT_ROOT/prod.env" FRONTEND_URL | sed -E 's|^https?://||; s|/.*||')
fi
DOMAIN="${DOMAIN:-tsehh.ru}"

if [ "$CHECK_ONLY" -eq 1 ]; then
    log "========== ssl check-only (domain=$DOMAIN) =========="
    log_cert_expiry
    log "========== ssl check-only done =========="
    exit 0
fi

CERTBOT_ARGS=(renew --non-interactive --no-random-sleep-on-renew)
if [ "$DRY_RUN" -eq 1 ]; then
    CERTBOT_ARGS+=(--dry-run)
    log "========== ssl renew DRY-RUN (domain=$DOMAIN) =========="
else
    log "========== ssl renew start (domain=$DOMAIN) =========="
fi
log_cert_expiry

PROXY_WAS_UP=0
if docker ps --format '{{.Names}}' | grep -qx antiquar-proxy; then
    PROXY_WAS_UP=1
fi

restore_proxy() {
    if [ "$PROXY_WAS_UP" -eq 1 ] || [ "$DRY_RUN" -eq 0 ]; then
        log "Starting proxy..."
        docker compose -f "$COMPOSE_FILE" up -d proxy >>"$LOG_FILE" 2>&1 || true
    fi
}
trap restore_proxy EXIT

log "Stopping proxy to free port 80..."
docker compose -f "$COMPOSE_FILE" stop proxy >>"$LOG_FILE" 2>&1 || true

log "Running certbot ${CERTBOT_ARGS[*]}..."
if docker run --rm \
    -v "$PROJECT_ROOT/letsencrypt:/etc/letsencrypt" \
    -v "$PROJECT_ROOT/letsencrypt-lib:/var/lib/letsencrypt" \
    -p 80:80 \
    certbot/certbot "${CERTBOT_ARGS[@]}" >>"$LOG_FILE" 2>&1; then
    log "certbot OK"
else
    log "ERROR: certbot failed (see log above)"
    exit 1
fi

if [ "$DRY_RUN" -eq 0 ]; then
    LIVE_DIR="$PROJECT_ROOT/letsencrypt/live/$DOMAIN"
    if [ -f "$LIVE_DIR/fullchain.pem" ] && [ -f "$LIVE_DIR/privkey.pem" ]; then
        cp -L "$LIVE_DIR/fullchain.pem" "$PROJECT_ROOT/certs/fullchain.pem"
        cp -L "$LIVE_DIR/privkey.pem" "$PROJECT_ROOT/certs/privkey.pem"
        chmod 644 "$PROJECT_ROOT/certs/fullchain.pem"
        chmod 600 "$PROJECT_ROOT/certs/privkey.pem"
        log "Copied live certs → certs/ for nginx"
    else
        log "ERROR: missing $LIVE_DIR/*.pem"
        exit 1
    fi
else
    log "Dry-run: skip copy to certs/"
fi

log_cert_expiry

# trap starts proxy
log "========== ssl renew done =========="
