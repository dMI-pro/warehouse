# Аудит прав доступа (Access Control Audit)

**Обновлено:** 2 сентября 2026  
**Прод:** [https://tsehh.ru/](https://tsehh.ru/) · деплой из ветки `staging`

Актуальный чеклист безопасности — в `docs/security.md`. Фичи сайта — `docs/backlog.md`.  
Исторический снимок от июня 2026 — в `docs/SECURITY-AUDIT-15.06.26.md` (часть пунктов уже исправлена).

---

## Как устроена защита

- На API глобально включён `JwtAuthGuard`; исключения — только `@Public()`. Access JWT читается из httpOnly cookie `access_token` (fallback: `Authorization: Bearer`).
- Роли проверяются `RolesGuard` и декоратором `@Roles`.
- Для товаров дополнительно: `sanitizeProductForRole()` убирает из JSON у **SELLER** и **GUEST** поля `purchasePrice`, `committee` / `committeeId`, `transactionType` / `transactionTypeId` (см. `backend/src/common/utils/product-visibility.util.ts`).
- На фронте: `router/index.ts` (маршруты) + условия в компонентах (кнопки, колонки).

---

## 🌐 Публичные endpoint'ы (без JWT)

| Метод | Путь | Примечание |
|-------|------|------------|
| GET | `/` | Корневой ответ API |
| GET | `/health` | Health-check |
| POST | `/auth/login` | Вход, httpOnly cookies |
| POST | `/auth/refresh` | Ротация refresh cookie |
| POST | `/auth/logout` | Сброс cookies + revoke refresh |
| POST | `/auth/register` | **Закрыто по умолчанию** → 403, пока `ENABLE_PUBLIC_REGISTRATION !== 'true'` |

Всё остальное требует валидный JWT.

**Не закрыто (отдельная задача):** фото по URL `https://tsehh.ru/minio/...` — nginx отдаёт без авторизации. См. `docs/security.md`.

---

## 🛡️ Backend (API)

### 🔐 Auth

| Метод | Путь | Роли | Примечание |
|-------|------|------|------------|
| POST | `/auth/login` | Public | Логин, httpOnly cookies (`access_token` + `refresh_token`), тело `{ user }` |
| POST | `/auth/refresh` | Public | Ротация refresh, новые cookies |
| POST | `/auth/logout` | Public | Revoke refresh в БД + clear cookies |
| POST | `/auth/register` | Public* | *Фактически 403 без флага `ENABLE_PUBLIC_REGISTRATION=true` |
| GET | `/auth/me` | JWT/cookie | Текущий пользователь |

### 👥 Users

| Метод | Путь | Роли | Примечание |
|-------|------|------|------------|
| POST | `/users` | `ADMIN` | Создание пользователя |
| GET | `/users` | `ADMIN`, `MANAGER` | Список пользователей |
| GET | `/users/:id` | `ADMIN` | Просмотр пользователя |
| PATCH | `/users/:id` | `ADMIN` | Обновление |
| DELETE | `/users/:id` | `ADMIN` | Удаление |
| POST | `/users/:id/sessions/revoke` | `ADMIN` | Сброс сессий |
| POST | `/users/:id/block` | `ADMIN` | Блокировка |

### 📦 Products

| Метод | Путь | Роли | Примечание |
|-------|------|------|------------|
| GET | `/products` | JWT (все роли) | Для SELLER/GUEST — урезанный JSON |
| GET | `/products/:id` | JWT (все роли) | Для SELLER/GUEST — урезанный JSON |
| GET | `/products/in-stock` | JWT (все роли) | Товары в наличии |
| GET | `/products/export` | `MANAGER`, `ADMIN` | Экспорт CSV/XLSX |
| GET | `/products/last-sku` | `MANAGER`, `ADMIN` | Последний SKU |
| GET | `/products/:id/history` | `MANAGER`, `ADMIN` | История изменений |
| POST | `/products` | `MANAGER`, `ADMIN` | Создание |
| PATCH | `/products/:id` | `MANAGER`, `ADMIN` | Обновление |
| DELETE | `/products/:id` | `ADMIN` | Удаление |
| POST | `/products/:id/images` | `MANAGER`, `ADMIN` | Загрузка фото |
| DELETE | `/products/:id/images` | `MANAGER`, `ADMIN` | Удаление фото |
| PATCH | `/products/:id/images/reorder` | `MANAGER`, `ADMIN` | Порядок фото |

### 🏷️ Categories

| Метод | Путь | Роли | Примечание |
|-------|------|------|------------|
| GET | `/categories` | JWT (все роли) | Список |
| GET | `/categories/:id` | JWT (все роли) | Просмотр |
| POST | `/categories` | `MANAGER`, `ADMIN` | Создание |
| PATCH | `/categories/:id` | `MANAGER`, `ADMIN` | Обновление |
| DELETE | `/categories/:id` | `ADMIN` | Удаление |

### 🏢 Warehouses

| Метод | Путь | Роли | Примечание |
|-------|------|------|------------|
| GET | `/warehouses` | JWT (все роли) | Список |
| GET | `/warehouses/:id` | JWT (все роли) | Просмотр |
| POST | `/warehouses` | `MANAGER`, `ADMIN` | Создание |
| PATCH | `/warehouses/:id` | `MANAGER`, `ADMIN` | Обновление |
| DELETE | `/warehouses/:id` | `ADMIN` | Удаление |

### 💰 Sales

| Метод | Путь | Роли | Примечание |
|-------|------|------|------------|
| GET | `/sales` | `SELLER`, `MANAGER`, `ADMIN` | Список |
| POST | `/sales` | `SELLER`, `MANAGER`, `ADMIN` | Создание |
| GET | `/sales/:id` | `MANAGER`, `ADMIN` | Детали |
| PATCH | `/sales/:id` | `MANAGER`, `ADMIN` | Обновление |
| DELETE | `/sales/:id` | `MANAGER`, `ADMIN` | Удаление |
| GET | `/sales/statistics` | `MANAGER`, `ADMIN` | Статистика |

### ↩️ Returns

| Метод | Путь | Роли | Примечание |
|-------|------|------|------------|
| GET | `/returns` | `SELLER`, `MANAGER`, `ADMIN` | Список |
| POST | `/returns` | `SELLER`, `MANAGER`, `ADMIN` | Создание |
| GET | `/returns/:id` | `MANAGER`, `ADMIN` | Детали |
| PATCH | `/returns/:id` | `MANAGER`, `ADMIN` | Обновление |
| DELETE | `/returns/:id` | `MANAGER`, `ADMIN` | Удаление |

### 👥 Committees

| Метод | Путь | Роли | Примечание |
|-------|------|------|------------|
| GET | `/committees` | JWT (все роли) | Список (для фильтров/форм) |
| POST | `/committees` | `MANAGER`, `ADMIN` | Создание |
| GET | `/committees/:id` | `ADMIN` | Карточка комитета |
| GET | `/committees/:id/stats` | `ADMIN` | Статистика |
| PATCH | `/committees/:id` | `MANAGER`, `ADMIN` | Обновление |
| DELETE | `/committees/:id` | `ADMIN` | Удаление |

### 🔄 Transaction Types

| Метод | Путь | Роли | Примечание |
|-------|------|------|------------|
| GET | `/transaction-types` | JWT (все роли) | Список |
| GET | `/transaction-types/:id` | JWT (все роли) | Просмотр |
| POST | `/transaction-types` | `MANAGER`, `ADMIN` | Создание |
| PATCH | `/transaction-types/:id` | `MANAGER`, `ADMIN` | Обновление |
| DELETE | `/transaction-types/:id` | `ADMIN` | Удаление |

### 🚦 User Statuses

| Метод | Путь | Роли | Примечание |
|-------|------|------|------------|
| GET | `/user-statuses` | JWT (все роли) | Список статусов |
| GET | `/user-statuses/:id` | JWT (все роли) | Просмотр |
| POST | `/user-statuses` | `ADMIN` | Создание |
| PATCH | `/user-statuses/:id` | `ADMIN` | Обновление |
| DELETE | `/user-statuses/:id` | `ADMIN` | Удаление |

### 📜 Audit Log

| Метод | Путь | Роли | Примечание |
|-------|------|------|------------|
| GET | `/audit-logs` | `ADMIN`, `MANAGER` | Весь контроллер ограничен этими ролями |

### 📊 Dashboard

| Метод | Путь | Роли | Примечание |
|-------|------|------|------------|
| GET | `/dashboard/summary` | `SELLER`, `MANAGER`, `ADMIN` | Сводка для главной |

### 🖼️ Media

| Метод | Путь | Роли | Примечание |
|-------|------|------|------------|
| GET | `/media` | `MANAGER`, `ADMIN` | Список файлов в MinIO |
| DELETE | `/media` | `MANAGER`, `ADMIN` | Удаление неиспользуемых файлов |

---

## 💻 Frontend (UI и маршруты)

### Маршруты

| Страница | Путь | Требуемые роли | Примечание |
|----------|------|----------------|------------|
| **Login** | `/login` | — | Публичная |
| **Register** | `/register` | — | Редирект на логин, если `VITE_ENABLE_PUBLIC_REGISTRATION !== 'true'` |
| **Dashboard** | `/dashboard` | `SELLER`, `MANAGER`, `ADMIN` | GUEST перенаправляется на `/products` |
| **Products** | `/products` | JWT (все роли) | Стартовая страница для GUEST |
| **Product Details** | `/products/:id` | JWT (все роли) | |
| **Reports** | `/reports` | `MANAGER`, `ADMIN` | |
| **Media** | `/media` | `MANAGER`, `ADMIN` | |
| **Settings** | `/settings` | `MANAGER`, `ADMIN` | Справочники, шаблоны экспорта |
| **Audit Log** | `/audit-log` | `ADMIN` | |
| **Users** | `/users` | `ADMIN` | |
| **Committee Details** | `/committees/:id` | `ADMIN` | |

### Элементы интерфейса

**Товары (`ProductsView`):**
- **Добавить / экспорт / редактировать / удалить** — `MANAGER`, `ADMIN`
- **Продать** — все, кроме `GUEST` (`SELLER`, `MANAGER`, `ADMIN`)
- **Возврат** — только `MANAGER`, `ADMIN` (в UI; в API создание возврата разрешено и `SELLER`)
- Колонки **Комитет**, **Тип транзакции** — скрыты у `SELLER` и `GUEST`
- Колонка **Цена закупки** — не показывается ни одной роли в таблице; в формах — только `MANAGER`, `ADMIN`
- Фильтр по комитетам — `MANAGER`, `ADMIN`

**Карточка товара (`ProductDetailsView`):**
- Редактирование, история, загрузка фото — `MANAGER`, `ADMIN`
- Служебные поля (закупка, комитет, тип транзакции) в форме — `MANAGER`, `ADMIN`

**Настройки (`SettingsView`):**
- Категории, склады, комитеты, типы транзакций — CRUD по ролям как в API
- Статусы пользователей — только `ADMIN`

**Пользователи (`UsersView`):**
- Все действия — `ADMIN` (`canEditUser`, `canBlockUser`)

**Меню (`MainLayout`):**
- GUEST: только «Товары»
- SELLER+: «Главная», «Товары»
- MANAGER+: «Отчёты», «Медиа», «Настройки»
- ADMIN: «Журнал действий», «Пользователи»

---

## ⚠️ Известные расхождения UI ↔ API

| Место | UI | API | Статус |
|-------|-----|-----|--------|
| Возврат товара | Кнопка только у `MANAGER` / `ADMIN` | `POST /returns` доступен и `SELLER` | Открыто |
| Журнал аудита | Страница `/audit-log` только `ADMIN` | `GET /audit-logs` — `ADMIN` и `MANAGER` | Открыто |
| Фото товаров | Просмотр в UI после логина | URL `/minio/...` без JWT снаружи | См. бэклог |

---

## ✅ Недавние изменения (по коммитам)

| Дата / коммит | Изменение |
|---------------|-----------|
| `cb01266` | Справочники: снят `@Public()` с GET — JWT обязателен |
| `9553f5a` | Регистрация закрыта флагами `ENABLE_PUBLIC_REGISTRATION` / `VITE_ENABLE_PUBLIC_REGISTRATION` |
| `23c7727` | Экспорт товаров и закрытие публичного `GET /products` |
| `33e6d62` | Фильтрация полей товара по ролям в API |
| `3d988cd` | Прод: домен `tsehh.ru`, env и документация |

---

## Быстрая проверка снаружи

```bash
# Должно быть 401 без токена:
curl -s -o /dev/null -w "%{http_code}" https://tsehh.ru/api/products
curl -s -o /dev/null -w "%{http_code}" https://tsehh.ru/api/categories

# Должно быть 403 (регистрация выключена):
curl -s -o /dev/null -w "%{http_code}" -X POST https://tsehh.ru/api/auth/register \
  -H 'Content-Type: application/json' -d '{}'

# Должно быть 200:
curl -s -o /dev/null -w "%{http_code}" https://tsehh.ru/api/health
```
