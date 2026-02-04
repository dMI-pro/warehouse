#!/bin/bash
set -e

# Проверка, что мы в корне проекта
if [ ! -f "docker-compose.prod.yml" ]; then
    echo "❌ Ошибка: Запустите скрипт из корня проекта (там где docker-compose.prod.yml)"
    exit 1
fi

echo "🛑 Останавливаем контейнеры..."
docker compose -f docker-compose.prod.yml down

echo "🧹 Удаляем данные базы данных и MinIO (полный сброс)..."
# Используем sudo, так как файлы могут принадлежать root (из контейнера)
sudo rm -rf postgres_data minio_data

echo "🚀 Запускаем контейнеры..."
docker compose -f docker-compose.prod.yml up -d

echo "⏳ Ждем инициализации базы данных (10 сек)..."
sleep 10

echo "🔄 Применяем миграции..."
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

echo "🌱 Заполняем базу тестовыми данными (Seed)..."
# Используем npx с ts-node.
# --transpile-only: игнорируем ошибки типов (нет @types/bcryptjs в проде).
# --compiler-options: принудительно ставим module=commonjs, чтобы избежать конфликтов с настройками tsconfig (NodeNext).
docker compose -f docker-compose.prod.yml exec backend npx --yes -p ts-node -p typescript ts-node --transpile-only --compiler-options '{"module":"commonjs"}' prisma/seed.ts

echo "✅ Сброс выполнен успешно!"
echo "⚠️  Внимание: Изображения товаров из сида (например, dell-xps.jpg) будут недоступны (404), пока вы не загрузите реальные файлы в MinIO."
