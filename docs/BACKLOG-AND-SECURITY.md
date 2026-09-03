# Бэклог: уязвимости, доработки и статус

**Обновлено:** 3 сентября 2026  
**Прод:** [https://tsehh.ru/](https://tsehh.ru/) · VPS `warehouse-ru-vps` (`77.91.95.232`) · ветка деплоя **`staging`** · стабильная копия — **`main`**

Сводный документ по материалам:
- `docs/SECURITY-AUDIT-15.06.26.md`
- `docs/ACCESS_CONTROL_AUDIT.md`
- `docs/INTEGRATION_CHECKLIST.md`
- `docs/terms-reference.md`
- `docs/user-manual-final.md`
- `README.md`

Старые аудиты **не удалять** — они исторические. Этот файл — актуальный чеклист «что уже сделано / что осталось».

---

## Краткий итог

| Категория | Статус |
|-----------|--------|
| Деплой на новый RU VPS, SSL, домен `tsehh.ru` | ✅ Сделано |
| Восстановление БД и MinIO из бэкапа | ✅ Сделано |
| Закрытие публичного API товаров и экспорта | ✅ Сделано |
| Фильтрация полей товара по ролям в API | ✅ Сделано |
| Пароль seed → `SEED_ADMIN_PASSWORD` | ✅ Сделано |
| MinIO порты 9000/9001 с интернета | ✅ Закрыто (UFW + `DOCKER-USER`) |
| Firewall UFW на VPS | ✅ Настроен (см. ниже) |
| Публичные справочники API | ✅ Закрыто (JWT обязателен) |
| Публичная регистрация `POST /auth/register` | ✅ Закрыта (флаг, по умолчанию выкл.) |
| История git (certs, backup.sql, .env) | ✅ Очищена (`git filter-repo`) |
| Rate limit на login | ❌ Не сделано |
| `disabled` в JwtStrategy | ✅ Сделано (вместе с cookie-auth) |
| Автомиграции в `deploy.sh` | ❌ Не сделано |
| Регулярные бэкапы на VPS (cron) | ✅ Каждый день 03:15 MSK, хранение 7 дней |
| Git pull с VPS по SSH (без пароля) | ✅ Deploy/account key + `git@github.com:...` |
| SSL auto-renew (certbot) | ✅ Воскресенье 04:20 MSK → `renew-ssl-vps.sh` |

---

## ✅ Уже исправлено (после аудита июня 2026)

| # | Пункт | Комментарий |
|---|--------|-------------|
| 1 | Публичный `GET /products`, `/products/:id` | JWT обязателен |
| 2 | Публичный `GET /products/export` | Только `MANAGER` / `ADMIN`; фронт через axios + токен |
| 3 | Пароль superadmin в `seed.ts` | Вынесен в `SEED_ADMIN_PASSWORD` |
| 4 | `backup*.sql` в `.gitignore` | Добавлено; дамп перенесён в `docs/` и убран из корня |
| 5 | Домен prod | `nginx.conf`, CORS из `FRONTEND_URL`, документация → `tsehh.ru` |
| 6 | Поля товара для SELLER/GUEST в API | `purchasePrice`, `committee`, `transactionType` (+ id) не отдаются |
| 7 | `thunder-client-collection.json` | Удалён из репозитория |
| 8 | MinIO 9000/9001 с интернета | UFW + цепочка `DOCKER-USER` (iptables); сервис `docker-user-iptables.service` |
| 9 | Firewall на VPS | UFW: открыты 22, 80, 443, 8080, 8443; MinIO закрыт снаружи |
| 10 | VPN-панель | http://77.91.95.232:8080/ — порт **8080** открыт в UFW постоянно |
| 11 | Xray VLESS Reality | Порт **8443** открыт в UFW |
| 12 | Статус `disabled` в JWT после выдачи | В `JwtStrategy.validate()` — как `blocked`; cookie/access тоже |

### Firewall на VPS (актуальная схема)

| Порт | Сервис | С интернета |
|------|--------|-------------|
| 22 | SSH | ✅ открыт |
| 80 | HTTP (редирект / ACME) | ✅ открыт |
| 443 | Сайт [tsehh.ru](https://tsehh.ru/) | ✅ открыт |
| 8080 | VPN admin panel (`/opt/vpn-admin`) | ✅ открыт |
| 8443 | Xray VLESS Reality | ✅ открыт |
| 9000 | MinIO API | ❌ закрыт (timeout снаружи) |
| 9001 | MinIO Console | ❌ закрыт (timeout снаружи) |

**Как закрыли MinIO:** порты в `docker-compose.prod.yml` **не трогали** (контейнеры не пересобирали). Docker обходит UFW, поэтому добавлены правила `DROP` в `DOCKER-USER` + systemd-сервис для восстановления после перезагрузки.

**Доступ к MinIO Console при необходимости:**
```bash
ssh -L 9001:127.0.0.1:9001 warehouse-ru-vps
# браузер: http://localhost:9001
```

**Проверка снаружи:**
- ✅ https://tsehh.ru/api/health → 200
- ❌ http://77.91.95.232:9000/ → timeout
- ✅ http://77.91.95.232:8080/ → 302 (панель VPN)
- ✅ порт 8443 открыт (nc / VPN-клиент)

### ⚠️ Сделано в коде — проверка на живом проде (03.09.2026)

| Пункт | Как проверить | Статус |
|--------|----------------|--------|
| Товары без токена → 401 | `curl …/api/products` | ✅ 401 |
| Экспорт без токена → 401 | `…/api/products/export?format=csv` | ⚠️ перепроверить вручную |
| Seller не видит закупку в JSON | DevTools → `/api/products` без `purchasePrice` | ⚠️ вручную под seller |
| Пароли админов не из seed | Один пользователь на проде | ⚠️ по желанию |
| Новый `JWT_SECRET` после переезда | Ротация опциональна | ⚠️ по желанию |
| Регистрация закрыта | `POST /api/auth/register` с валидным телом → **403**; пустое `{}` может дать **400** (валидация раньше флага) | ✅ закрыта |
| Справочники без токена → 401 | `curl …/api/categories` | ✅ 401 |

### ~~⚠️ История git~~ ✅ Сделано (02.09.2026)

Чувствительные файлы удалены из всей истории (`git filter-repo` + force-push на GitHub): `certs/*.pem`, `ssl/*`, `backup_no_bom.sql`, `backup_test111.sql`, `.env`, `frontend/.env`, `thunder-client-collection.json`, пароль из старого `seed.ts`.

Локальный mirror-бэкап до очистки: `warehouse-mirror-backup-20260902-011455` (рядом с репо на Mac).

*Опционально:* если repo когда-то был доступен извне — всё равно ротировать `JWT_SECRET`, пароли БД/MinIO/admin на проде.

---

## 🔴 Безопасность — сделать в первую очередь

### ~~1. MinIO доступен с интернета (порты 9000 / 9001)~~ ✅ Сделано (02.09.2026)

Закрыто на VPS `warehouse-ru-vps`: UFW + `iptables DOCKER-USER`. Сайт и фото через nginx `/minio/` работают.

*Опционально позже:* убрать `ports:` у MinIO в `docker-compose.prod.yml` (дублирующая защита, не обязательно при рабочем firewall).

---

### 2. Фото товаров без авторизации (`/minio/...`)

**Источник:** `SECURITY-AUDIT` (проверено на старом проде — HTTP 200 без auth)  
**Риск:** любой с URL может скачать фото; перебор имён файлов.

**Варианты (на выбор):**
- Проксировать `/minio/` только для авторизованных (сложнее в nginx).
- Presigned URL только через backend (рекомендация из `SECURITY.md`).
- Ограничить хотя бы непредсказуемыми именами файлов + не светить список бакета.

**Файлы:** `nginx.conf`, `backend/src/minio/`, `backend/src/media/`

---

### ~~3. Открытая регистрация `POST /auth/register`~~ ✅ Сделано (02.09.2026)

Временно закрыта флагами (по умолчанию выкл., код не удалён):
- бэк: `ENABLE_PUBLIC_REGISTRATION=true` → снова открыть `POST /auth/register`
- фронт: `VITE_ENABLE_PUBLIC_REGISTRATION=true` → снова показать `/register`

Без флагов: API отвечает **403**, `/register` редиректит на логин, ссылка «Зарегистрироваться» скрыта.

**Файлы:** `backend/src/auth/auth.controller.ts`, `frontend/src/router/index.ts`, `frontend/src/views/LoginView.vue`

---

### 4. Нет отдельного rate limit на `/auth/login`

**Источник:** `SECURITY-AUDIT`  
**Риск:** ~300 запросов / 15 мин с одного IP (общий лимит) — много для перебора пароля.

**Что сделать:** отдельный `rateLimit` на `POST /auth/login` — 5–10 попыток / минуту.

**Файлы:** `backend/src/main.ts` или `auth.controller.ts`

---

### ~~5. Статус `disabled` не проверяется в JWT после выдачи токена~~ ✅ Сделано (cookie-auth)

В `JwtStrategy.validate()` проверяются и `blocked`, и `disabled`. Access cookie (~15m) + revoke sessions закрывают старый сценарий «ходит до 31 дня».

---

### 6. Секреты после переезда со старого VPS

**Статус:** низкий приоритет — на проде один пользователь (вы).

- [x] `FRONTEND_URL=https://tsehh.ru`, `MINIO_PUBLIC_URL=https://tsehh.ru/minio` в `prod.env`
- [ ] По желанию: сменить `JWT_SECRET` и пароль admin, если старый VPS был с открытыми портами

---

## 🟠 Безопасность — средний приоритет

| # | Проблема | Где | Рекомендация |
|---|----------|-----|--------------|
| ~~7~~ | ~~JWT в `localStorage`~~ | ✅ httpOnly cookies, access 15m + refresh 7d | `authStore` больше не хранит JWT |
| ~~8~~ | ~~Публичные справочники API~~ | ✅ Снят `@Public()` с GET | JWT обязателен, как у товаров |
| 9 | Слабая политика паролей (мин. 6) | `backend/src/auth/dto/*.ts`, `errorHandler.ts` | Минимум 12 символов, сложность |
| 10 | CORS без `Origin` | `backend/src/main.ts` | В prod можно не разрешать запросы без Origin |
| 11 | Лимит тела 50 MB | `main.ts`, `nginx.conf` | Для фото достаточно 5–10 MB в Multer |
| ~~12~~ | ~~`JWT_EXPIRATION` vs `JWT_EXPIRES_IN`~~ | ✅ `JWT_ACCESS_EXPIRATION` + `JWT_REFRESH_EXPIRATION` | `.env.example`, `auth.module.ts` |
| ~~13~~ | ~~Долгий JWT (31d в примерах)~~ | ✅ access 15m, refresh 7d | cookies, не 31d |

---

## 🛡️ Права доступа (из ACCESS_CONTROL_AUDIT)

Документ `ACCESS_CONTROL_AUDIT.md` синхронизирован с кодом (02.09.2026). Актуально:

### Backend — что ещё открыто без логина

| Модуль | GET без JWT |
|--------|-------------|
| Categories | ❌ закрыто |
| Warehouses | ❌ закрыто |
| Committees (список) | ❌ закрыто |
| Transaction types | ❌ закрыто |
| Health, корень API | ✅ публично (нормально) |
| Products | ❌ закрыто |
| Sales, Returns, Users, Audit | ❌ закрыто |

### Frontend vs API — расхождения

| Место | UI | API |
|-------|-----|-----|
| Товары: закупка, комитет, тип транзакции | Скрыто у seller/guest | ✅ Скрыто у seller/guest |
| Справочники | Нужен логин для страниц | ✅ GET справочников только с JWT |
| Audit log в роутере | Только `ADMIN` в `router` | `ADMIN` + `MANAGER` на API |

**Доработка:** выровнять audit-log (роут vs API).

### Роли — напоминание

| Роль | Товары | Продажи | Возвраты | Отчёты | Пользователи |
|------|--------|---------|----------|--------|--------------|
| GUEST | просмотр (урезанный) | — | — | — | — |
| SELLER | + продажа | ✅ | список/создание | — | — |
| MANAGER | полный JSON, CRUD | ✅ | ✅ | ✅ | — |
| ADMIN | + удаление | ✅ | ✅ | ✅ | ✅ |

Подробнее: `docs/user-manual-final.md`, корневой `README.md`.

---

## ⚙️ Эксплуатация prod (после деплоя)

| # | Задача | Статус | Действие |
|---|--------|--------|----------|
| 1 | SSL Let's Encrypt | ✅ | Auto-renew: cron вс 04:20 → `renew-ssl-vps.sh`; лог `backups-new/ssl-renew.log` |
| 2 | Firewall UFW | ✅ | 22, 80, 443, 8080, 8443 открыты; 9000/9001 закрыты |
| 3 | Бэкапы по расписанию | ✅ | Cron 03:15 MSK → `backup-all-vps.sh`; retention 7 дней; лог `backups-new/backup.log`; копия на Mac: `pull-backups-from-vps.sh`. Ручной прогон 02.09 OK; первый ночной — проверить утром |
| 4 | `deploy.sh` без миграций | ❌ | Добавить `prisma migrate deploy` после `up --build` |
| 5 | Синхронизация `main` | ⚠️ | `main` отстаёт от `staging`/`dev` — merge после релиза |
| 6 | GitHub Actions secrets | ⚠️ | `VPS_HOST`, `VPS_PATH` — новый RU VPS |
| 7 | `scripts-new/vps.minio.env` на Mac | ⚠️ | Endpoint `https://tsehh.ru` (не старый домен) |
| 8 | Git на VPS → GitHub по SSH | ✅ | Ключ `~/.ssh/warehouse-ru-vps-github`, remote `git@github.com:dMI-pro/warehouse.git` |
| 9 | Не запускать на проде | — | `reset-vps.sh`, `make seed` с тестовым паролем |

---

## 📋 Функциональные доработки (из terms-reference и README)

Не уязвимости — план развития. Приоритет на ваше усмотрение.

| # | Фича | Источник |
|---|------|----------|
| 1 | Swagger / OpenAPI | `terms-reference.md`, README |
| 2 | Импорт CSV/XLSX (товары, операции) | README |
| 3 | Расширенные отчёты, сохранённые фильтры | README |
| 4 | Тонкие права (не только роли) | README, terms-reference |
| 5 | i18n / локализация | README |
| 6 | Метрики, централизованные логи | README, terms-reference |
| 7 | Массовые операции в каталоге | README |
| 8 | Кэш справочников (сервер + клиент) | README |
| 9 | CI: lint, types, tests (не только deploy) | README |
| 10 | Аудит входов/выходов (расширить) | terms-reference |

### Устаревшие места в user-manual

~~В `docs/user-manual-final.md` написано, что UI продаж и возвратов «в разработке».~~ Обновлено 02.09.2026: продажи и возвраты оформляются из раздела «Товары».

---

## 🧪 Тестирование (из TESTING.md)

Сейчас в CI тесты **не** гоняются. Рекомендуемый минимум перед крупными релизами:

```bash
# Backend
cd backend && npm run test

# Frontend
cd frontend && npm run test:unit
```

Полный список сценариев: `docs/TESTING.md`.

**Имеет смысл добавить тесты на:**
- доступ к `/products` без токена → 401;
- `sanitizeProductForRole` для seller/guest;
- экспорт только manager/admin.

---

## ✅ Чеклист быстрой проверки prod (5 минут)

```text
[x] https://tsehh.ru/ открывается, SSL валидный
[ ] Логин admin / manager / seller
[x] Фото товаров грузятся (через /minio/ на сайте)
[x] curl без токена: /api/products → 401
[x] curl без токена: /api/categories → 401
[ ] Seller: в JSON нет purchasePrice
[x] Порты 9000/9001 снаружи закрыты (timeout)
[x] VPN-панель http://77.91.95.232:8080/ доступна
[x] Xray порт 8443 открыт
[x] Бэкап есть (ручной 02.09); проверить лог после первого 03:15
[x] Git fetch с VPS по SSH без пароля
[x] certbot renew настроен (cron вс 04:20); dry-run при установке
```

---

## 📁 Устаревшие документы (не править смысл, только знать)

| Файл | Замечание |
|------|-----------|
| `SECURITY-AUDIT-15.06.26.md` | Домен `smagrarom.ru`, часть пунктов уже исправлена |
| `ACCESS_CONTROL_AUDIT.md` | Актуализирован 02.09.2026; при изменениях прав — обновлять вместе с этим файлом |
| `INTEGRATION_CHECKLIST.md` | Всё отмечено [x] — справочный архив интеграции |

**Актуальный чеклист — этот файл:** `docs/BACKLOG-AND-SECURITY.md`

---

## Рекомендуемый порядок работ (когда будет время)

1. ~~**MinIO ports + firewall**~~ ✅ сделано на VPS
2. ~~**`disabled` в JWT**~~ ✅ + **rate limit login** (1–2 ч)
3. ~~**Закрыть register**~~ ✅ флаг `ENABLE_PUBLIC_REGISTRATION` (по умолчанию выкл.)
4. **`deploy.sh` + migrate deploy** (15 мин)
5. ~~**Бэкапы по cron** на VPS~~ ✅ + периодический `pull-backups-from-vps.sh` на Mac
6. ~~**certbot renew**~~ ✅ cron вс 04:20 → `renew-ssl-vps.sh`
7. ~~Публичные справочники API~~ ✅
8. `/minio/` только через auth или presigned URL (фото без логина)
9. Остальное из таблицы «средний приоритет» и бэклог фич

---

*При следующих изменениях безопасности обновляйте статусы в этом файле.*
