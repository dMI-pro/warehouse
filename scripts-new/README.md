# Warehouse (antiquar) — скрипты `scripts-new/`

Бэкапы PostgreSQL + MinIO, перенос local ↔ VPS, импорт prod на Mac.

## Автобэкапы на VPS (cron)

Каждую ночь в **03:15** (Europe/Moscow на VPS):

```bash
./scripts-new/macos/backup-all-vps.sh
```

Делает:
1. `backup-db-vps.sh` → `backups-new/database/backup_*.sql`
2. `backup-minio-vps.sh` → `backups-new/minio/minio-backup-*`
3. Удаляет бэкапы старше **7 дней** (`BACKUP_RETENTION_DAYS`)
4. Пишет лог в `backups-new/backup.log`

Cron (уже настроен на сервере):

```cron
15 3 * * * cd /var/www/warehouse && /bin/bash ./scripts-new/macos/backup-all-vps.sh
```

Проверка:

```bash
ssh warehouse-ru-vps
tail -50 /var/www/warehouse/backups-new/backup.log
ls -lah /var/www/warehouse/backups-new/database/ | tail
ls -lah /var/www/warehouse/backups-new/minio/ | tail
crontab -l | grep backup-all
```

Ручной прогон: `cd /var/www/warehouse && ./scripts-new/macos/backup-all-vps.sh`

### Копия на Mac (раз в 1–2 недели)

Скачать уже готовые файлы с VPS (без нового дампа на сервере):

```bash
./scripts-new/macos/pull-backups-from-vps.sh           # все
./scripts-new/macos/pull-backups-from-vps.sh --latest  # только самые свежие
```

SSH-алиас по умолчанию: `warehouse-ru-vps` (`WAREHOUSE_SSH_HOST`).

Свежий стрим дампа «прямо сейчас» без записи на диск VPS — по-прежнему:

```bash
./scripts-new/macos/pull-prod-to-local.sh
```

---

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
| `backup-db-vps.sh` / `backup-minio-vps.sh` | VPS (по отдельности) |
| `backup-all-vps.sh` | VPS (cron: DB + MinIO + ротация 7 дней) |
| `restore-db.sh` / `restore-minio.sh` | local и VPS |
| `pull-prod-to-local.sh` | local (SSH → live dump с VPS) |
| `pull-backups-from-vps.sh` | local (rsync готовых `backups-new/` с VPS) |
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

На сервере:

```bash
cd /var/www/warehouse
./scripts-new/macos/backup-all-vps.sh   # или manager.sh → 3
```

Файлы: `/var/www/warehouse/backups-new/` (+ `backup.log`). Ночной cron уже вызывает этот скрипт.
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
