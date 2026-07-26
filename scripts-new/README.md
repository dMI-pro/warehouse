# Warehouse (antiquar) — скрипты `scripts-new/`

Бэкапы PostgreSQL + MinIO, перенос local ↔ VPS, импорт prod на Mac.

## Быстрый старт

| Платформа | Команда |
|-----------|---------|
| macOS / Linux | `./scripts-new/manager.sh` |
| Windows | `scripts-new\manager.bat` |

Меню на **VPS** включается автоматически (есть контейнер `antiquar-proxy`).

## Prod → локальный Mac (рекомендуется)

Стримит бэкап с VPS **без записи файлов в `/var/www/warehouse` на сервере**:

```bash
# Только скачать
./scripts-new/macos/pull-prod-to-local.sh

# Скачать и сразу восстановить локально
./scripts-new/macos/pull-prod-to-local.sh --restore
```

Нужны: SSH-алиас `warehouse-vps`, локально запущенный `docker compose up -d`.

Результат: `backups-new/database/*.sql` и `backups-new/minio/minio-backup-prod-*`.

## Структура

### macOS / Linux / VPS (`macos/`)

| Скрипт | Где |
|--------|-----|
| `backup-db.sh` / `backup-minio.sh` | local |
| `backup-db-vps.sh` / `backup-minio-vps.sh` | VPS |
| `restore-db.sh` / `restore-minio.sh` | local и VPS |
| `pull-prod-to-local.sh` | local (SSH → VPS) |
| `sync-minio-to-vps.sh` | local → VPS (новые картинки) |
| `fix-file-urls-vps.sh` | нормализация `products.images` |

### Windows (`windows/`)

Локальные backup / sync / check / public policy (как в CEH, но контейнеры `antiquar-*`).

## Контейнеры и пути

| | Local | VPS |
|--|-------|-----|
| Project | этот репозиторий | `/var/www/warehouse` |
| DB | `antiquar-db` | `antiquar-db` |
| MinIO | `antiquar-minio` | `antiquar-minio` |
| Env | `.env` | `prod.env` |
| Bucket | `antiquar-products` | `antiquar-products` |
| DB user | `antiquar` | `nachalnik_db` |

`pg_dump` всегда с `--no-owner --no-acl`, чтобы dump с VPS спокойно лился в локальную БД.

## Сценарии

### A. Страховочный бэкап на Mac

`manager.sh` → 1, 2 → файлы в `backups-new/`.

### B. Новые картинки local → VPS

1. Local: `backup-db.sh`
2. Local: `sync-minio-to-vps.sh` (нужен `scripts-new/vps.minio.env`)
3. `scp` `.sql` на VPS в `backups-new/database/`
4. VPS: restore DB

### C. Полный local → VPS

1. Local: backup DB + MinIO (одна сессия)
2. Залить на VPS
3. VPS: `restore-minio` → `restore-db` (пара из одной сессии)

### D. Полный VPS → local (prod-копия на Mac)

```bash
./scripts-new/macos/pull-prod-to-local.sh --restore
```

### E. Только бэкап на VPS

На сервере (после копирования `scripts-new` на VPS):

```bash
cd /var/www/warehouse
./scripts-new/manager.sh   # 1 DB, 2 MinIO
```

Файлы: `/var/www/warehouse/backups-new/`.

## Sync MinIO: credentials

Скопируйте пример и заполните prod-ключи:

```bash
cp scripts-new/vps.minio.env.example scripts-new/vps.minio.env
```

Файл в `.gitignore` — не коммитить.

## Важно

- Не восстанавливать MinIO от одного времени, а БД от другого — картинки «отвалятся».
- На VPS MinIO — **bind-mount** `./minio_data`; скрипты используют `--volumes-from`, это ок.
- Кодировка DB: только `pg_dump` внутри контейнера + `docker cp` / SSH stream (не PowerShell redirect).
- Образ `minio/mc` уже с ENTRYPOINT=`mc` — скрипты вызывают его через `--entrypoint=/bin/sh`.
- `pull-prod-to-local.sh` **не пишет** файлы на VPS (только SSH stream → `backups-new/` на Mac).
