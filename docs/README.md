# Документация (`docs/`)

Оглавление папки. Корень репозитория: [`README.md`](../README.md) (запуск, Docker), [`DEPLOYMENT.md`](../DEPLOYMENT.md) (прод).

**Прод:** [https://tsehh.ru/](https://tsehh.ru/) · деплой из ветки `staging`.

---

## Рабочие чеклисты (править)

| Файл | Что внутри |
|------|------------|
| [`backlog.md`](./backlog.md) | Фичи и баги сайта: сделать / проверить / сделано. **Сюда — новые задачи по фронту.** |
| [`security.md`](./security.md) | Безопасность: что закрыто и что ещё осталось. |

---

## Для людей

| Файл | Что внутри |
|------|------------|
| [`user-manual-final.md`](./user-manual-final.md) | Руководство пользователя: роли, экраны, как работать. |
| [`terms-reference.md`](./terms-reference.md) | ТЗ: архитектура, модули, ориентиры (часть устарела — актуальное в backlog/security). |

---

## История и справочники (не чеклист)

Не дублировать туда текущие задачи. При смене прав можно обновить audit.

| Файл | Что внутри |
|------|------------|
| [`ACCESS_CONTROL_AUDIT.md`](./ACCESS_CONTROL_AUDIT.md) | Таблица API и ролей (синхронизировать с кодом). |
| [`SECURITY-AUDIT-15.06.26.md`](./SECURITY-AUDIT-15.06.26.md) | Аудит июня 2026 (старый домен). Многие пункты уже закрыты — статус в `security.md`. |
| [`INTEGRATION_CHECKLIST.md`](./INTEGRATION_CHECKLIST.md) | Архив: CORS, toast, сжатие фото — всё уже сделано. |
| [`TESTING.md`](./TESTING.md) | Как гонять тесты backend/frontend. |

---

## Куда писать новое

- Баг или фича UI → **`backlog.md`**
- Уязвимость / hardening → **`security.md`**
- Как пользоваться системой → **`user-manual-final.md`**
- Новый эндпоинт и роли → **`ACCESS_CONTROL_AUDIT.md`**
