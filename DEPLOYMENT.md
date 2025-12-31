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
   JWT_EXPIRES_IN=1h
   PORT=3000
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend-domain.com
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
       server_name your-domain.com;

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

### PM2 мониторинг

```bash
pm2 status
pm2 logs warehouse-backend
pm2 monit
```

### Docker логи

```bash
docker-compose logs -f backend
docker-compose logs -f frontend
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

