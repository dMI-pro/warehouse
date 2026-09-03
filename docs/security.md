# Безопасность

**Обновлено:** 4 сентября 2026  
**Прод:** [https://tsehh.ru/](https://tsehh.ru/) · VPS `warehouse-ru-vps` · деплой из **`staging`**

Актуальный чеклист. Исторические аудиты **не править**: `SECURITY-AUDIT-15.06.26.md`, `ACCESS_CONTROL_AUDIT.md`.

Доработки сайта (не безопасность) — в [`backlog.md`](./backlog.md).

---

## Сводка

| | Статус |
|--|--------|
| Cookie-auth (httpOnly, access 15m + refresh 7d) | ✅ |
| `disabled` / `blocked` в JwtStrategy | ✅ |
| Регистрация закрыта | ✅ |
| Rate limit login | ✅ 10 неудачных / 10 мин с IP |
| Публичный API товаров и справочников | ✅ JWT обязателен |
| Поля закупки/комитета скрыты у seller/guest | ✅ |
| MinIO порты 9000/9001 с интернета | ✅ UFW + `DOCKER-USER` |
| Бэкапы / SSL renew / git history | ✅ |
| **Фото `/minio/` без логина** | ❌ осталось |
| **`deploy.sh` + `prisma migrate deploy`** | ❌ осталось |
| Пароли мин. 12 символов | ❌ среднее |
| CORS без Origin в prod | ❌ среднее |
| Лимит тела 50 MB | ❌ среднее |

---

## Осталось

### Высокий приоритет

1. **Фото без авторизации** — `https://tsehh.ru/minio/...` отдаётся nginx без логина.  
   Варианты: presigned URL через backend, или `/minio/` только для авторизованных.  
   Файлы: `nginx.conf`, `backend/src/minio/`, `backend/src/media/`.

2. **`deploy.sh`** — после `up --build` добавить `prisma migrate deploy` (fail-fast, ждать healthy postgres).

### Средний приоритет

| # | Что | Где |
|---|-----|-----|
| 3 | Мин. длина пароля 12 + сложность | `backend/src/auth/dto/*.ts`, `users/dto` |
| 4 | В prod не разрешать CORS без `Origin` | `backend/src/main.ts` |
| 5 | Лимит тела / Multer 5–10 MB вместо 50 MB | `main.ts`, `nginx.conf` |
| 6 | Проверка загрузок на бэке: расширение + размер (не только фронт) | products/media upload |
| 7 | Audit-log: UI только ADMIN, API ещё MANAGER — выровнять | router vs `audit-logs` |
| 8 | Опционально: убрать `ports:` у MinIO в `docker-compose.prod.yml` | дубль к firewall |

### По желанию

- Ротация `JWT_SECRET` и пароля admin после переезда со старого VPS.
- CI: тесты на 401 без cookie, `sanitizeProductForRole`, экспорт только manager/admin.
- Super admin нельзя block/delete/revoke через API — ок; не давать в UI кнопку «Заблокировать» на самого себя.

---

## Сделано

| Что | Когда / как |
|-----|-------------|
| Публичный GET товаров / export | JWT + роли |
| Seed-пароль не в коде | `SEED_ADMIN_PASSWORD` |
| Скрытие `purchasePrice` / committee / transactionType | `sanitizeProductForRole` |
| Регистрация | флаг `ENABLE_PUBLIC_REGISTRATION` (по умолчанию выкл.) |
| `disabled` после выдачи токена | `JwtStrategy.validate()` |
| JWT не в localStorage | httpOnly cookies, refresh в БД (хеш) |
| Block / revoke sessions | сразу 401; refresh revoke; super admin нельзя |
| Rate limit login | 10 fail / 10 мин; успешный вход не считается |
| Имена JWT env | `JWT_ACCESS_EXPIRATION` / `JWT_REFRESH_EXPIRATION` |
| Справочники без JWT | `@Public()` снят |
| MinIO 9000/9001 снаружи | timeout |
| Firewall | 22, 80, 443, 8080, 8443 открыты |
| Git history (certs, .env, backup.sql) | `git filter-repo` 02.09.2026 |
| Пароль в audit-log | маскируется (`****`) |
| Cookie на проде | path `/api` и `/api/auth`, `Secure` |

### Infra (не уязвимости кода, но «безопасность прода»)

| # | Задача | Статус |
|---|--------|--------|
| SSL Let's Encrypt | ✅ cron вс 04:20 `renew-ssl-vps.sh` |
| Бэкапы | ✅ cron 03:15 `backup-all-vps.sh`, 7 дней |
| Git VPS → GitHub SSH | ✅ |
| Не запускать на проде | `reset-vps.sh`, `make seed` |

### Firewall

| Порт | Сервис | С интернета |
|------|--------|-------------|
| 22 | SSH | открыт |
| 80 / 443 | сайт | открыт |
| 8080 | VPN-панель | открыт |
| 8443 | Xray | открыт |
| 9000 / 9001 | MinIO | **закрыт** |

MinIO Console с Mac: `ssh -L 9001:127.0.0.1:9001 warehouse-ru-vps` → `http://localhost:9001`.

---

## Проверка прода (5 мин)

```text
[x] https://tsehh.ru/ SSL
[ ] Логин admin / manager / seller
[x] /api/products без cookie → 401
[x] /api/categories без cookie → 401
[ ] Seller: в JSON нет purchasePrice
[x] 9000/9001 снаружи timeout
[ ] После login: cookies HttpOnly на tsehh.ru, в localStorage нет access_token
```

---

## Связанные файлы

| Файл | Роль |
|------|------|
| `SECURITY-AUDIT-15.06.26.md` | Снимок июня 2026, домен `smagrarom.ru` |
| `ACCESS_CONTROL_AUDIT.md` | Таблица ролей и эндпоинтов |
| `backlog.md` | Фичи и баги UI |
| [`README.md`](./README.md) | Оглавление `docs/` |

*После правок по безопасности обновляйте этот файл, не старые аудиты.*
