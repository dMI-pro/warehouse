# Аудит безопасности проекта Warehouse

**Дата:** 15 июня 2026  
**Сайт:** [https://smagrarom.ru/dashboard](https://smagrarom.ru/dashboard)  
**Область проверки:** исходный код, конфигурация деплоя, живой продакшен

---

## Краткий вывод

**Взломать аккаунт сотрудника напрямую сейчас сложно** — пароли хешируются, JWT защищает большинство API, роли на критичных операциях есть. Но **весь складской каталог (включая закупочные цены) уже доступен без логина** любому, кто знает URL. Это главная угроза на проде.

---

## Сводная таблица рисков

| # | Проблема | Приоритет | Статус на проде |
|---|----------|-----------|-----------------|
| 1 | Экспорт товаров без авторизации | 🔴 Критично | Подтверждено (HTTP 200) |
| 2 | Список товаров с закупочными ценами — публичный API | 🔴 Критично | Подтверждено (HTTP 200) |
| 3 | Дамп БД с хешами паролей в git | 🔴 Критично | Файл в репозитории |
| 4 | Пароль superadmin в исходниках (seed.ts) | 🔴 Критично | В коде |
| 5 | Фото товаров доступны без авторизации | 🟠 Высокий | Подтверждено (HTTP 200) |
| 6 | MinIO порты 9000/9001 открыты на хосте | 🟠 Высокий | В docker-compose.prod.yml |
| 7 | JWT в localStorage | 🟠 Высокий | В коде |
| 8 | Открытая регистрация | 🟠 Высокий | Подтверждено |
| 9 | Нет отдельного rate limit на /auth/login | 🟠 Высокий | В коде |
| 10 | Статус disabled не проверяется в JWT | 🟠 Высокий | В коде |
| 11 | Слабая политика паролей (мин. 6 символов) | 🟡 Средний | В коде |
| 12 | Публичные справочники (комитеты, склады и др.) | 🟡 Средний | Подтверждено |
| 13 | CORS пропускает запросы без Origin | 🟡 Средний | В коде |
| 14 | Лимит тела запроса 50 MB | 🟡 Средний | В коде |
| 15 | Несогласованность env-переменных JWT | 🟡 Средний | В коде |
| 16 | Тестовые учётные данные в репозитории | 🟡 Средний | thunder-client-collection.json |

---

## 🔴 Критично — исправить немедленно

### 1. Полный экспорт товаров без авторизации

**Проверено на проде:** `GET https://smagrarom.ru/api/products/export?format=csv` → **HTTP 200**, отдаёт CSV с названиями, SKU, **ценами закупки и продажи**, остатками, складами, комитетами.

**Файл:** `backend/src/products/products.controller.ts`

```typescript
@Get('export')
@Public() // Allow public access or use @Roles if needed. The frontend opens this in a new tab.
async export(...)
```

**Риск:** конкурент или злоумышленник скачивает весь инвентарь и коммерческую информацию без пароля.

**Рекомендация:**
- Убрать `@Public()` с `GET /products/export`
- Требовать роли `MANAGER` / `ADMIN`
- Передавать токен при экспорте (не `window.open` без авторизации)
- Обновить `frontend/src/views/ProductsView.vue` — экспорт через axios с Bearer token

---

### 2. Список товаров с закупочными ценами — публичный API

**Проверено на проде:** `GET https://smagrarom.ru/api/products` → **HTTP 200**, в ответе `"purchasePrice":"4000"`, количество, склады, фото.

**Файл:** `backend/src/products/products.controller.ts`

```typescript
@Get()
@Public()
async findAll(...)

@Get(':id')
@Public()
async findOne(...)
```

**Риск:** утечка закупочных цен, остатков, структуры склада — без входа в систему.

**Рекомендация:**
- Убрать `@Public()` с `GET /products` и `GET /products/:id`
- Для неавторизованных запросов (если нужны) — отдельный DTO без `purchasePrice`
- Минимум: требовать JWT для всех product read endpoints

---

### 3. Дамп БД с хешами паролей в git

**Файл:** `backup_no_bom.sql` — **закоммичен в репозиторий** (коммит `c37f9d7`).

Содержит:
- bcrypt-хеши пользователей `admin`, `superadmin`
- хеши паролей в audit log (`oldValues`)

**Риск:** если репозиторий когда-либо был публичным или доступен третьим лицам — офлайн-подбор паролей к аккаунтам админов.

**Рекомендация:**
1. Удалить `backup_no_bom.sql` из git и истории (`git filter-repo` или BFG)
2. **Сменить пароли всех админов** на проде
3. Сгенерировать новый `JWT_SECRET` и перевыпустить сессии (`sessionsRevokeAt`)
4. Добавить `backup*.sql` в `.gitignore`

---

### 4. Пароль superadmin в исходниках

**Файл:** `backend/prisma/seed.ts`

```typescript
password: await bcrypt.hash('REDACTED_SEED_PASSWORD', 10),
```

**Риск:** если seed запускался на проде или пароль не меняли — известный пароль в коде.

**Рекомендация:**
- Сменить пароль superadmin на VPS
- Убрать реальный пароль из `seed.ts` (использовать env-переменную `SEED_ADMIN_PASSWORD`)
- Никогда не коммитить реальные пароли

---

## 🟠 Высокий приоритет

### 5. Фото товаров доступны без авторизации

**Проверено:** `https://smagrarom.ru/minio/antiquar-products/products/6349.webp` → **HTTP 200**

**Файл:** `nginx.conf`

```nginx
location ^~ /minio/ {
  proxy_pass http://minio:9000/;
}
```

В `SECURITY.md` написано, что в проде используются presigned URL — на практике объекты открыты через nginx.

**Риск:** фото товаров доступны всем; возможен перебор имён файлов.

**Рекомендация:**
- Убрать публичный proxy `/minio/` или ограничить доступ
- Отдавать изображения через backend с проверкой авторизации
- Использовать presigned URL с коротким TTL

---

### 6. MinIO порты 9000/9001 открыты на хосте

**Файл:** `docker-compose.prod.yml`

```yaml
ports:
  - "9000:9000"
  - "9001:9001"
```

**Риск:** обход nginx, прямой доступ к S3-хранилищу с VPS (если firewall не закрывает порты снаружи).

**Рекомендация:**
- Убрать `ports` у MinIO в prod compose
- Оставить MinIO только во внутренней сети Docker
- Закрыть 9000/9001 в firewall VPS

---

### 7. JWT в localStorage

**Файл:** `frontend/src/stores/authStore.ts`

```typescript
localStorage.setItem('access_token', response.access_token);
localStorage.setItem('user', JSON.stringify(response.user));
```

**Риск:** при XSS (если появится) токен можно украсть; срок жизни до **31 дня** (`.env.example`).

**Рекомендация:**
- Перейти на httpOnly Secure SameSite cookies
- Или короткий access token (1–8 ч) + refresh token
- Сократить `JWT_EXPIRATION` на проде

---

### 8. Открытая регистрация

**Проверено на проде:** `POST /api/auth/register` создаёт аккаунт (статус `disabled`, без токена).

**Файл:** `backend/src/auth/auth.controller.ts` — `@Public()` на register

**Риск:** спам-аккаунты, перебор занятых email/username, лишняя нагрузка на БД.

**Рекомендация:**
- Отключить регистрацию на проде (`REGISTRATION_ENABLED=false`)
- Или invite-only / CAPTCHA / rate limit на register

---

### 9. Нет отдельного rate limit на /auth/login

**Файл:** `backend/src/main.ts`

Общий лимит: **300 запросов / 15 мин** на весь API.

**Риск:** подбор пароля в рамках лимита (~300 попыток за 15 мин с одного IP).

**Рекомендация:**
- Отдельный limiter на `/auth/login`: 5–10 попыток / минуту на IP
- Опционально: блокировка после N неудач (audit log уже пишет `login_attempt`)

---

### 10. Статус disabled не проверяется в JWT

**Файл:** `backend/src/auth/strategies/jwt.strategy.ts`

При логине `disabled` блокируется (`auth.service.ts`), но в `JwtStrategy.validate()` проверяется только `blocked`:

```typescript
if (user.status?.code?.toLowerCase() === 'blocked') {
  throw new UnauthorizedException('User is blocked');
}
// disabled — не проверяется
```

**Риск:** если админ «отключил» пользователя, старый JWT может работать до истечения срока (до 31 дня).

**Рекомендация:**
- Добавить проверку `disabled` в `validate()`
- При отключении пользователя вызывать `revokeUserSessions(userId)`

---

## 🟡 Средний приоритет

### 11. Слабая политика паролей

**Файлы:** `backend/src/auth/dto/register.dto.ts`, `backend/src/users/dto/create-user.dto.ts`

Минимум **6 символов**, без проверки сложности.

**Рекомендация:** минимум 12 символов, проверка сложности (буквы + цифры).

---

### 12. Публичные справочники

Без авторизации доступны (`@Public()`):

| Endpoint | Файл |
|----------|------|
| `GET /categories`, `GET /categories/:id` | `categories.controller.ts` |
| `GET /warehouses`, `GET /warehouses/:id` | `warehouses.controller.ts` |
| `GET /committees` | `committees.controller.ts` |
| `GET /transaction-types`, `GET /transaction-types/:id` | `transaction-types.controller.ts` |

**Проверено:** `/api/committees` отдаёт имена агентов и описания.

**Риск:** утечка бизнес-структуры (не так критично, как цены, но лишнее).

---

### 13. CORS пропускает запросы без Origin

**Файл:** `backend/src/main.ts`

```typescript
if (!origin || allowedOrigins.includes(origin)) {
  callback(null, true);
}
```

**Риск:** для Bearer-token API это допустимо (curl, Postman), но расширяет поверхность для автоматизированного сбора данных.

---

### 14. Лимит тела запроса 50 MB

**Файлы:** `backend/src/main.ts`, `nginx.conf`

**Риск:** DoS по памяти при массовых загрузках.

**Рекомендация:** для фото — 5–10 MB на файл в Multer (`limits: { fileSize: ... }`).

---

### 15. Несогласованность env-переменных JWT

- Код читает: `JWT_EXPIRATION` (`auth.module.ts`)
- `backend/.env.example` содержит: `JWT_EXPIRES_IN`
- Корневой `.env.example` содержит: `JWT_EXPIRATION`

**Риск:** в prod может молча использоваться дефолт `1h` или неожиданное значение.

**Рекомендация:** унифицировать имя переменной во всех `.env.example` и документации.

---

### 16. Тестовые учётные данные в репозитории

**Файл:** `backend/thunder-client-collection.json`

Содержит пароли `admin123`, `password123` для dev-тестов.

**Рекомендация:** добавить в `.gitignore` или заменить на placeholder-значения.

---

## 🟢 Что сделано хорошо

| Область | Оценка | Детали |
|---------|--------|--------|
| **Пароли** | ✅ | bcrypt (cost 10), защита от timing attack при логине |
| **JWT** | ✅ | Обязательный `JWT_SECRET` в production, проверка `blocked`, отзыв сессий |
| **Авторизация** | ✅ | Глобальный `JwtAuthGuard`, `@Roles` на продажах, пользователях, аудите |
| **Валидация** | ✅ | Глобальный `ValidationPipe` (whitelist, forbidNonWhitelisted) |
| **SQL-инъекции** | ✅ | Prisma ORM + параметризованный `$queryRaw` |
| **XSS во фронте** | ✅ | Нет `v-html` / `innerHTML` / `dangerouslySetInnerHTML` |
| **HTTPS** | ✅ | TLS 1.2/1.3, HSTS, security headers в nginx |
| **Защищённые API** | ✅ | `/users`, `/sales`, `/audit-logs` → 401 без токена |
| **Регистрация** | ✅ | Не выдаёт токен, статус `disabled` |
| **Аудит** | ✅ | Логирование login/login_attempt с IP и User-Agent |
| **Деплой** | ✅ | Backend и Postgres не торчат наружу, только nginx 80/443 |
| **Секреты** | ✅ | `.env` / `prod.env` в `.gitignore` |
| **Helmet** | ✅ | CSP, security headers на backend |
| **Rate limiting** | ✅ | express-rate-limit (300 req/15 min в prod) |
| **Загрузка файлов** | ✅ | Расширения whitelist, Sharp re-encode, роли MANAGER/ADMIN |
| **Продажи/возвраты** | ✅ | Требуют SELLER/MANAGER/ADMIN |
| **Управление пользователями** | ✅ | Только ADMIN |

---

## Публичные API endpoints (@Public)

Глобальный `JwtAuthGuard` применяется везде, кроме помеченных `@Public()`:

| Метод | Path | Файл | Риск |
|-------|------|------|------|
| GET | `/` | `app.controller.ts` | Низкий |
| GET | `/health` | `app.controller.ts` | Низкий (норма) |
| POST | `/auth/register` | `auth.controller.ts` | Средний |
| POST | `/auth/login` | `auth.controller.ts` | Норма |
| GET | `/products/export` | `products.controller.ts` | **Критичный** |
| GET | `/products` | `products.controller.ts` | **Критичный** |
| GET | `/products/:id` | `products.controller.ts` | **Критичный** |
| GET | `/categories` | `categories.controller.ts` | Средний |
| GET | `/categories/:id` | `categories.controller.ts` | Средний |
| GET | `/warehouses` | `warehouses.controller.ts` | Средний |
| GET | `/warehouses/:id` | `warehouses.controller.ts` | Средний |
| GET | `/committees` | `committees.controller.ts` | Средний |
| GET | `/transaction-types` | `transaction-types.controller.ts` | Средний |
| GET | `/transaction-types/:id` | `transaction-types.controller.ts` | Средний |

---

## Можно ли «взломать пользователя»?

| Вектор атаки | Вероятность | Комментарий |
|--------------|-------------|-------------|
| Подбор пароля через API | Средняя | Нет жёсткого лимита на login; при слабом пароле — реально |
| Кража JWT через XSS | Низкая–средняя | XSS не найден, но токен в localStorage на 31 день |
| Утечка пароля из git | Высокая (если repo утёк) | `backup_no_bom.sql` + seed с паролем |
| Обход авторизации на API | **Уже работает** | Каталог и экспорт без логина |
| Прямой доступ к MinIO | Зависит от firewall | Порты 9000/9001 в compose |
| Эскалация GUEST → ADMIN | Низкая | Роли на backend для критичных операций есть |
| CSRF | Низкая | Bearer token, не cookies |

**Вывод:** аккаунт сотрудника с нормальным паролем напрямую взломать сложно, но **данные склада уже утекают** через публичные endpoints.

---

## Архитектура безопасности

```
Клиент (Vue 3)
    │
    │  Bearer JWT (localStorage)
    ▼
nginx (443, TLS, HSTS, CSP)
    │
    ├── /api/*  → NestJS backend (JwtAuthGuard глобально)
    │               ├── @Public() — bypass JWT
    │               ├── @Roles() — проверка роли
    │               └── ValidationPipe — валидация DTO
    │
    ├── /minio/* → MinIO (публичный proxy!) ⚠️
    │
    └── /*       → Vue SPA (route guards — только UI)
```

**Роли:** `GUEST`, `SELLER`, `MANAGER`, `ADMIN` + флаг `isSuperAdmin`

**Guards:**
- `JwtAuthGuard` — глобальный (`app.module.ts`)
- `RolesGuard` — per-controller, не глобальный
- Endpoints без `@Roles()` доступны любому авторизованному пользователю

---

## План действий

### Сегодня (критично)

- [ ] Убрать `@Public()` с `GET /products`, `GET /products/:id`, `GET /products/export`
- [ ] Сменить пароли всех админов на проде
- [ ] Проверить, что seed-пароль (`REDACTED_SEED_PASSWORD`) не используется на проде
- [ ] Удалить `backup_no_bom.sql` из git, добавить `backup*.sql` в `.gitignore`
- [ ] Сгенерировать новый `JWT_SECRET`, отозвать все сессии

### На этой неделе (высокий)

- [ ] Закрыть MinIO: убрать `ports` из prod compose, ограничить `/minio/` в nginx
- [ ] Добавить rate limit на `/auth/login` (5–10 попыток/мин)
- [ ] Добавить проверку `disabled` в `JwtStrategy.validate()`
- [ ] Отключить или ограничить `/auth/register` на проде
- [ ] Обновить экспорт на фронте — через axios с токеном

### Позже (средний)

- [ ] Перейти на httpOnly cookies или короткий JWT + refresh
- [ ] Усилить политику паролей (12+ символов)
- [ ] Унифицировать env-переменные JWT
- [ ] Добавить Multer file size limit (5–10 MB)
- [ ] Убрать реальные пароли из seed.ts и thunder-client
- [ ] Закрыть публичные справочники или ограничить данные

---

## Проверки на живом проде (15.06.2026)

| Запрос | Результат |
|--------|-----------|
| `GET /api/products/export?format=csv` | **200** — полный CSV с ценами |
| `GET /api/products?limit=1` | **200** — purchasePrice в ответе |
| `GET /api/users` | **401** — защищено ✅ |
| `GET /api/sales` | **401** — защищено ✅ |
| `GET /api/audit-logs` | **401** — защищено ✅ |
| `GET /api/health` | **200** — ok ✅ |
| `POST /api/auth/register` | **200** — создаёт disabled аккаунт |
| `GET /minio/antiquar-products/products/6349.webp` | **200** — фото без auth |
| `GET /minio/` | **403** — root закрыт |

---

## Связанные файлы

| Файл | Назначение |
|------|------------|
| `SECURITY.md` | Общие рекомендации по безопасности |
| `SECURITY-AUDIT.md` | Этот документ — полный аудит |
| `backend/src/main.ts` | Helmet, CORS, rate limit, ValidationPipe |
| `backend/src/app.module.ts` | Глобальный JwtAuthGuard |
| `backend/src/auth/` | Аутентификация |
| `backend/src/common/guards/roles.guard.ts` | Проверка ролей |
| `backend/src/common/decorators/public.decorator.ts` | Bypass JWT |
| `nginx.conf` | SSL, proxy, security headers |
| `docker-compose.prod.yml` | Prod deployment |
| `backup_no_bom.sql` | ⚠️ Дамп БД в git — удалить |
| `backend/prisma/seed.ts` | ⚠️ Пароль в коде — исправить |

---

*Документ создан автоматически по результатам аудита кодовой базы и живого продакшена.*
