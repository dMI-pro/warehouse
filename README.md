# Склад

Учёт товаров, продажи и возвраты, справочники, отчёты и журнал действий. Роли: гость, продавец, менеджер, администратор.

Стек: NestJS + Prisma + PostgreSQL, Vue 3 + Vite + PrimeVue, MinIO для изображений.

Подробности: [руководство пользователя](docs/user-manual-final.md), [деплой](DEPLOYMENT.md).

## Запуск через Docker

Нужны Docker, Docker Compose и Node.js 20.19+ или 22.12+.

```bash
git clone <repository-url>
cd warehouse
```

Скопируйте `.env` по образцу проекта и заполните `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET` и параметры MinIO.

```bash
make up
make migrate
make seed   # тестовые данные, по желанию
```

- Фронтенд: http://localhost:5173
- API: http://localhost:3000
- MinIO: http://localhost:9000

Без Makefile: `docker-compose up -d`, миграции — `docker exec antiquar-backend npx prisma migrate dev`.

## Запуск без Docker

PostgreSQL 15+ должен быть запущен отдельно.

**Backend**

```bash
cd backend
npm install
```

В `backend/.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/warehouse_db"
JWT_SECRET="не короче 32 символов"
JWT_EXPIRES_IN="1h"
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

```bash
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

**Frontend**

```bash
cd frontend
npm install
```

В `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000
```

```bash
npm run dev
```

## Команды

Docker (`Makefile`): `make up`, `make down`, `make logs`, `make restart`, `make clean`, `make migrate`, `make seed`, `make backup`, `make restore FILE=path.sql`.

Backend: `npm run start:dev`, `npm run build`, `npm run start:prod`, `npm run lint`, `npm run test`, `npm run test:e2e`.

Frontend: `npm run dev`, `npm run build`, `npm run preview`, `npm run test:unit`, `npm run type-check`.

## Что умеет система

- Товары: список, фильтры, CRUD, фото (сжатие в WebP, MinIO), остатки и цены.
- Продажи и возвраты с историей и влиянием на остатки.
- Справочники: категории, склады, комитеты, типы транзакций, статусы пользователей.
- Отчёты: графики, топ товаров, выручка, выгрузка.
- Пользователи и роли (админ), журнал действий.

Доступ по ролям задаётся и на API, и на маршрутах фронтенда.

### Роли

| Роль | Товары (UI + API) | Продажи | Возвраты | Отчёты / настройки | Пользователи / аудит |
|------|-------------------|---------|----------|--------------------|----------------------|
| **GUEST** | Просмотр списка и карточки без цены закупки, коммитета и типа транзакции | — | — | — | — |
| **SELLER** | Как гость + оформление продажи | Создание, список | Создание, список | — | — |
| **MANAGER** | Полные поля товара, CRUD (кроме удаления), экспорт | Полный доступ | Полный доступ | Да | — |
| **ADMIN** | Как менеджер + удаление товаров | Полный доступ | Полный доступ | Да | Да |

Для **SELLER** и **GUEST** API не отдаёт `purchasePrice`, `committee` / `committeeId`, `transactionType` / `transactionTypeId` в ответах товаров (и во вложенном `product` у продаж/возвратов). Колонка «Цена закупки» в таблице товаров не показывается ни одной роли — поле есть только в формах admin/manager.

## Структура

```
warehouse/
├── backend/          # NestJS, Prisma
├── frontend/         # Vue 3
├── docs/             # аудиты, ТЗ, руководства
├── docker-compose.yml
├── docker-compose.prod.yml
└── deploy.sh
```

## Продакшен

На VPS: Docker, `prod.env` (`./init-prod-env.sh`), затем:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Обновление: `./deploy.sh` или push в ветку `staging` (GitHub Actions, `.github/workflows/deploy-staging.yml`). Нужны секреты `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_PATH`.

Фронт: `https://tsehh.ru/`, проверка API: `https://tsehh.ru/api/health`. Полная инструкция — в `DEPLOYMENT.md`.

На VPS в `prod.env` обязательно: `FRONTEND_URL=https://tsehh.ru` и `MINIO_PUBLIC_URL=https://tsehh.ru/minio`. SSL: `./setup-ssl.sh tsehh.ru you@email.com` (или DNS-вариант `setup-ssl-dns.sh`), сертификаты в `certs/`.

## Если что-то не поднимается

- CORS: в `backend/src/main.ts` должен быть origin фронтенда (`http://localhost:5173` в разработке).
- БД: PostgreSQL запущен, `DATABASE_URL` верный, миграции применены (`make migrate`).
- Картинки: MinIO доступен, креды в `.env` совпадают с контейнером.

## Что ещё планируется

- Swagger по API, чтобы не собирать эндпоинты вручную.
- Импорт и экспорт товаров, операций и отчётов в CSV/XLSX.
- Более гибкие отчёты: свои метрики, сохранённые фильтры, регулярные выгрузки.
- Права не только по ролям, а точечно по операциям и полям.
- Перевод интерфейса и справочников.
- Health-check, метрики и нормальные логи на сервере.
- Массовые действия в каталоге и более удобная работа с длинными списками.
- Кэш справочников на сервере и меньше лишних запросов с клиента.
- Линт, типы и тесты в CI, не только деплой staging.
- Жёстче политика паролей и отдельный учёт входов и выходов.
