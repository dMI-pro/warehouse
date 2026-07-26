#!/bin/bash
# Восстановление PostgreSQL на VPS (обёртка над restore-db.sh)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$SCRIPT_DIR/restore-db.sh" "$@"
