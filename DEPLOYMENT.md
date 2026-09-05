# Руководство по развертыванию

## Production развертывание

### Требования

- Node.js 20.19.0+ или 22.12.0+
- PostgreSQL 15+
- Nginx или другой веб-сервер (для фронтенда)

### Backend развертывание

1. **Подготовка окружения:**
   ```bash
   cd backend
   npm ci --production
   ```

2. **Настройка переменных окружения:**
   Создайте `.env` файл:
   ```env
   DATABASE_URL=postgresql://user:password@host:5432/warehouse_db
   JWT_SECRET=your-very-secure-secret-key-minimum-32-characters-long
   JWT_ACCESS_EXPIRATION=15m
   JWT_REFRESH_EXPIRATION=7d
   COOKIE_SECURE=true
   COOKIE_SAME_SITE=lax
   COOKIE_ACCESS_PATH=/api
   COOKIE_REFRESH_PATH=/api/auth
   PORT=3000
   NODE_ENV=production
   FRONTEND_URL=https://tsehh.ru
   MINIO_PUBLIC_URL=https://tsehh.ru/minio
   ```

3. **Сборка проекта:**
   ```bash
   npm run build
   ```

4. **Применение миграций:**
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

5. **Запуск с PM2 (рекомендуется):**
   ```bash
   npm install -g pm2
   pm2 start dist/main.js --name warehouse-backend
   pm2 save
   pm2 startup
   ```

### Frontend развертывание

1. **Сборка проекта:**
   ```bash
   cd frontend
   npm ci
   npm run build
   ```

2. **Настройка Nginx:**
   Создайте конфигурацию `/etc/nginx/sites-available/warehouse`:
   ```nginx
   server {
       listen 80;
       server_name tsehh.ru www.tsehh.ru;

       root /path/to/warehouse/frontend/dist;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       location /api {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. **Активация конфигурации:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/warehouse /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

### Docker Production развертывание

1. **Создайте production docker-compose:**
   ```yaml
   version: '3.8'
   services:
     postgres:
       image: postgres:15-alpine
       environment:
         POSTGRES_USER: ${DB_USER}
         POSTGRES_PASSWORD: ${DB_PASSWORD}
         POSTGRES_DB: ${DB_NAME}
       volumes:
         - postgres_data:/var/lib/postgresql/data
       restart: unless-stopped

     backend:
       build:
         context: ./backend
         dockerfile: Dockerfile
       environment:
         NODE_ENV: production
         DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
         JWT_SECRET: ${JWT_SECRET}
         FRONTEND_URL: ${FRONTEND_URL}
       depends_on:
         - postgres
       restart: unless-stopped

     frontend:
       build:
         context: ./frontend
         dockerfile: Dockerfile
       environment:
         VITE_API_URL: ${API_URL}
       restart: unless-stopped
   ```

2. **Запуск:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

## Мониторинг и логи

### Healthcheck backend (Docker)

В `docker-compose.prod.yml` backend healthcheck ходит на `http://127.0.0.1:3000/health` (не `localhost`): в Alpine `localhost` часто резолвится в IPv6 `::1`, а Nest слушает IPv4. Публичная проверка: `https://tsehh.ru/api/health`.

### PM2 мониторинг

```bash
pm2 status
pm2 logs warehouse-backend
pm2 monit
```

### Docker логи

В `docker-compose.prod.yml` у всех сервисов (`postgres`, `backend`, `minio`, `proxy`) драйвер `json-file` с ротацией: `max-size: 10m`, `max-file: 5` (до ~50 MB логов на контейнер). Volumes PostgreSQL/MinIO этим не затрагиваются. Чтобы применить новые лимиты на уже запущенном стеке, пересоздайте контейнеры без `--build` (данные в `./postgres_data` и `./minio_data` сохраняются):

```bash
docker compose -f docker-compose.prod.yml up -d --force-recreate
```

Просмотр логов:

```bash
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f proxy
```

## Резервное копирование

### База данных

```bash
# Создание бэкапа
docker exec antiquar-db pg_dump -U user database_name > backup_$(date +%Y%m%d).sql

# Восстановление
docker exec -i antiquar-db psql -U user database_name < backup_20240101.sql
```

## Безопасность

1. Используйте HTTPS (Let's Encrypt)
2. Настройте firewall
3. Регулярно обновляйте зависимости
4. Используйте сильные пароли для БД
5. Ограничьте доступ к административным панелям

## CI/CD для VPS (ветка staging)

Ниже схема для автоматического деплоя при каждом `push` в `staging`:

1. GitHub Actions запускается на событие `push` в `staging`.
2. Workflow подключается по SSH на VPS.
3. На VPS выполняется `./deploy.sh staging`.
4. Скрипт обновляет код и пересобирает контейнеры.

### Что уже добавлено в репозиторий

- Workflow: `.github/workflows/deploy-staging.yml`
- Скрипт деплоя: `deploy.sh` (обновлен под CI/CD)

### Подготовка VPS (один раз)

1. Убедитесь, что проект уже клонирован на VPS и используется правильный путь (например, `/var/www/warehouse`).
2. Убедитесь, что в папке проекта есть ваши серверные файлы:
   - `prod.env` с `FRONTEND_URL=https://tsehh.ru` и `MINIO_PUBLIC_URL=https://tsehh.ru/minio`
   - `certs/` (SSL для `tsehh.ru` / `www.tsehh.ru`: `./setup-ssl.sh tsehh.ru you@email.com`)
3. DNS A-записи `tsehh.ru` и `www.tsehh.ru` должны указывать на IP VPS.
4. Пользователь деплоя должен уметь запускать Docker Compose (обычно группа `docker`):
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```

### Подготовка SSH-ключа для GitHub Actions (один раз)

1. Сгенерируйте отдельную пару ключей для деплоя:
   ```bash
   ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy
   ```
2. Добавьте публичный ключ на VPS в `~/.ssh/authorized_keys` пользователя деплоя.
3. Приватный ключ (`~/.ssh/github_actions_deploy`) добавьте в GitHub Secrets.

### Секреты в GitHub

В репозитории откройте `Settings -> Secrets and variables -> Actions` и создайте:

- `VPS_HOST` — IP/домен VPS
- `VPS_USER` — пользователь SSH на VPS
- `VPS_SSH_KEY` — приватный ключ (многострочный, целиком)
- `VPS_PORT` — SSH-порт (опционально, по умолчанию `22`)
- `VPS_PATH` — абсолютный путь к проекту на VPS (например, `/opt/warehouse`)

### Как это использовать

1. Пушите изменения в ветку `staging`.
2. Откройте вкладку `Actions` в GitHub и проверьте workflow `Deploy Staging`.
3. Если workflow зеленый, деплой завершен.

Также доступен ручной запуск через `workflow_dispatch` в Actions (кнопка `Run workflow`).

### Что делает `deploy.sh`

Скрипт выполняет:

1. `git fetch origin staging`
2. `git checkout staging`
3. `git pull --ff-only origin staging`
4. `docker compose -f docker-compose.prod.yml up -d --build`
5. `docker image prune -f`
