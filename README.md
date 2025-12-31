# Warehouse Management System

Система управления складом с полным функционалом для управления товарами, продажами, пользователями и отчетностью.

## 🚀 Быстрый старт

### Предварительные требования

- Node.js 20.19.0+ или 22.12.0+
- Docker и Docker Compose (для запуска через Docker)
- PostgreSQL 15+ (если запускаете без Docker)

### Запуск через Docker (рекомендуется)

1. **Клонируйте репозиторий:**
   ```bash
   git clone <repository-url>
   cd warehouse
   ```

2. **Запустите все сервисы:**
   ```bash
   make up
   ```
   Или вручную:
   ```bash
   docker-compose up -d
   ```

3. **Примените миграции базы данных:**
   ```bash
   make migrate
   ```
   Или вручную:
   ```bash
   docker exec antiquar-backend npx prisma migrate dev
   ```

4. **Заполните базу данных тестовыми данными (опционально):**
   ```bash
   make seed
   ```

5. **Откройте приложение:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

### Запуск без Docker

#### Backend

1. **Перейдите в папку backend:**
   ```bash
   cd backend
   ```

2. **Установите зависимости:**
   ```bash
   npm install
   ```

3. **Настройте переменные окружения:**
   Создайте файл `.env` в папке `backend`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/warehouse_db"
   JWT_SECRET="your-secret-key-change-in-production-min-32-chars"
   JWT_EXPIRES_IN="1h"
   PORT=3000
   NODE_ENV=development
   ```

4. **Примените миграции:**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

5. **Запустите сервер:**
   ```bash
   npm run start:dev
   ```

#### Frontend

1. **Перейдите в папку frontend:**
   ```bash
   cd frontend
   ```

2. **Установите зависимости:**
   ```bash
   npm install
   ```

3. **Настройте переменные окружения:**
   Создайте файл `.env` в папке `frontend`:
   ```env
   VITE_API_URL=http://localhost:3000
   ```

4. **Запустите dev сервер:**
   ```bash
   npm run dev
   ```

## 📋 Доступные команды

### Docker команды (Makefile)

- `make up` - Запустить все сервисы
- `make down` - Остановить все сервисы
- `make logs` - Показать логи
- `make restart` - Перезапустить сервисы
- `make clean` - Остановить и удалить контейнеры и volumes
- `make migrate` - Применить миграции базы данных
- `make seed` - Заполнить базу тестовыми данными

### Backend команды

- `npm run start:dev` - Запустить в режиме разработки с hot-reload
- `npm run build` - Собрать для production
- `npm run start:prod` - Запустить production сборку
- `npm run lint` - Проверить код линтером
- `npm run test` - Запустить тесты
- `npm run test:e2e` - Запустить E2E тесты

### Frontend команды

- `npm run dev` - Запустить dev сервер
- `npm run build` - Собрать для production
- `npm run preview` - Предпросмотр production сборки
- `npm run test:unit` - Запустить unit тесты
- `npm run type-check` - Проверить типы TypeScript

## 🧪 Тестирование

### Backend тесты

```bash
cd backend
npm run test
npm run test:watch  # С watch режимом
npm run test:cov    # С покрытием кода
```

### Frontend тесты

```bash
cd frontend
npm run test:unit
```

### E2E тесты

```bash
cd backend
npm run test:e2e
```

## 🏗️ Структура проекта

```
warehouse/
├── backend/              # NestJS backend
│   ├── src/
│   │   ├── auth/        # Модуль аутентификации
│   │   ├── users/       # Модуль пользователей
│   │   ├── products/    # Модуль товаров
│   │   ├── categories/  # Модуль категорий
│   │   ├── sales/       # Модуль продаж
│   │   └── common/      # Общие утилиты и декораторы
│   ├── prisma/          # Prisma схема и миграции
│   └── test/            # Тесты
├── frontend/            # Vue 3 frontend
│   ├── src/
│   │   ├── views/       # Страницы приложения
│   │   ├── components/  # Компоненты
│   │   ├── stores/      # Pinia stores
│   │   ├── services/    # API сервисы
│   │   ├── utils/       # Утилиты
│   │   └── types/       # TypeScript типы
│   └── __tests__/       # Тесты
└── docker-compose.yml   # Docker конфигурация
```

## 🔐 Аутентификация и роли

Система поддерживает следующие роли:

- **GUEST** - Гость (базовый доступ)
- **SELLER** - Продавец (может продавать товары)
- **MANAGER** - Менеджер (может управлять товарами, категориями, видеть отчеты)
- **ADMIN** - Администратор (полный доступ, включая управление пользователями)

## 📦 Основной функционал

### Товары
- Просмотр списка товаров с фильтрацией и поиском
- Добавление и редактирование товаров
- Загрузка изображений с автоматическим сжатием
- Управление количеством и ценами
- Продажа товаров

### Категории
- Иерархическая структура категорий
- Создание, редактирование и удаление категорий

### Продажи
- Оформление продаж
- История продаж
- Статистика продаж

### Отчеты
- Графики продаж по датам
- Топ товаров
- Выручка и статистика
- Экспорт данных в CSV

### Пользователи
- Управление пользователями (только для админов)
- Назначение ролей

## 🛠️ Разработка

### Добавление нового модуля

1. Создайте модуль в `backend/src/`
2. Добавьте контроллер, сервис и DTO
3. Зарегистрируйте модуль в `app.module.ts`
4. Создайте миграцию Prisma при необходимости

### Добавление новой страницы

1. Создайте компонент в `frontend/src/views/`
2. Добавьте маршрут в `frontend/src/router/index.ts`
3. Добавьте пункт меню в `frontend/src/layouts/MainLayout.vue`

## 🐛 Решение проблем

### Проблемы с CORS

Убедитесь, что в `backend/src/main.ts` правильно настроены разрешенные origins. Для разработки добавьте `http://localhost:5173`.

### Проблемы с базой данных

1. Проверьте, что PostgreSQL запущен
2. Убедитесь, что `DATABASE_URL` правильный
3. Примените миграции: `make migrate`

### Проблемы с загрузкой изображений

1. Проверьте, что папка `backend/uploads/products` существует и доступна для записи
2. Убедитесь, что размер файла не превышает 5MB
3. Проверьте формат файла (поддерживаются: jpg, jpeg, png, gif, webp)

## 📝 Переменные окружения

### Backend (.env)

```env
DATABASE_URL=postgresql://user:password@localhost:5432/warehouse_db
JWT_SECRET=your-secret-key-min-32-characters
JWT_EXPIRES_IN=1h
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3000
```

## 🚀 Production деплой

### Backend

1. Соберите проект:
   ```bash
   cd backend
   npm run build
   ```

2. Запустите production сервер:
   ```bash
   npm run start:prod
   ```

### Frontend

1. Соберите проект:
   ```bash
   cd frontend
   npm run build
   ```

2. Файлы для деплоя будут в папке `dist/`

3. Настройте веб-сервер (nginx, Apache) для раздачи статических файлов

## 📄 Лицензия

MIT

## 👥 Авторы

Warehouse Management Team
