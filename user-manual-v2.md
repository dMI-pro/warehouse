# Руководство пользователя (v2)

Это подробное описание текущего функционала приложения «Склад» и ролевой модели доступа. Документ составлен по фактическому коду проекта.

## Обзор системы
- Веб‑приложение с фронтендом на Vue 3 + PrimeVue и бекендом на NestJS + Prisma.
- Аутентификация: JWT, поддержка множественных устройств, отзыв сессий по метке времени.
- Основные модули:
  - Пользователи, Роли, Статусы пользователей
  - Товары, Категории
  - Склады
  - Коммитеты
  - Типы транзакций
  - Продажи и Возвраты
  - Журнал действий (аудит)

## Роли и доступ
- Роли в системе:
  - SELLER (Продавец)
  - MANAGER (Менеджер)
  - ADMIN (Администратор)
  - Флаг isSuperAdmin (суперадминистратор) — расширяет доступ независимо от роли
  - На фронтенде также встречается GUEST (для регистрации новых пользователей)
- Проверка ролей на сервере:
  - Реализована через декоратор Roles и Guard [roles.guard.ts](file:///c:/Users/User/Desktop/Project/warehouse/backend/src/common/guards/roles.guard.ts#L15-L41)
  - Суперадмин (isSuperAdmin) проходит любую проверку Roles
- Проверка ролей на клиенте:
  - Через Pinia store: hasRole и isAdmin [authStore.ts](file:///c:/Users/User/Desktop/Project/warehouse/frontend/src/stores/authStore.ts)
  - Навигационное меню и кнопки действий учитывают роль

## Навигация и разделы
- Главное меню [MainLayout.vue](file:///c:/Users/User/Desktop/Project/warehouse/frontend/src/layouts/MainLayout.vue):
  - Главная (Dashboard) — для всех авторизованных
  - Товары (Products) — для всех авторизованных
  - Отчёты (Reports) — MANAGER, ADMIN
  - Настройки (Settings) — MANAGER, ADMIN
  - Журнал действий (Audit Log) — ADMIN
  - Пользователи (Users) — ADMIN
- Маршрутизация и защита маршрутов [router/index.ts](file:///c:/Users/User/Desktop/Project/warehouse/frontend/src/router/index.ts):
  - Поддержка массива requiredRoles; суперадмин проходит все проверки
  - Reports/Settings: requiredRoles [MANAGER, ADMIN]
  - AuditLog/Users: requiredRoles [ADMIN]

## Аутентификация и безопасность
- Регистрация и вход [auth.service.ts](file:///c:/Users/User/Desktop/Project/warehouse/backend/src/auth/auth.service.ts#L25-L71, file:///c:/Users/User/Desktop/Project/warehouse/backend/src/auth/auth.service.ts#L73-L140)
  - Регистрация присваивает роль GUEST
  - Вход создаёт запись аудит‑лога login_attempt и login, проверяет статус пользователя
- Блокировка пользователя:
  - Если статус пользователя = blocked, вход отклоняется
- Отзыв сессий (stateless):
  - Метка sessionsRevokeAt на пользователе
  - Валидация токена в [jwt.strategy.ts](file:///c:/Users/User/Desktop/Project/warehouse/backend/src/auth/strategies/jwt.strategy.ts#L37-L55) — токен с iat ≤ sessionsRevokeAt считается отозванным
  - Работает для множественных устройств
- Публичные/защищённые маршруты бекенда:
  - Определяются декоратором @Public и Guard [jwt-auth.guard.ts](file:///c:/Users/User/Desktop/Project/warehouse/backend/src/auth/guards/jwt-auth.guard.ts)

## Модуль «Пользователи»
- API контроллер [users.controller.ts](file:///c:/Users/User/Desktop/Project/warehouse/backend/src/users/users.controller.ts):
  - POST /users — ADMIN: создать пользователя
  - GET /users — ADMIN, MANAGER: список пользователей
  - GET /users/:id — ADMIN: пользователь по id
  - PATCH /users/:id — авторизованный (Guard), логика ограничений в сервисе
  - DELETE /users/:id — ADMIN: удалить пользователя
  - POST /users/:id/sessions/revoke — ADMIN: завершить все сессии
  - POST /users/:id/block — ADMIN: заблокировать пользователя (и завершить все сессии)
- Сервис [users.service.ts](file:///c:/Users/User/Desktop/Project/warehouse/backend/src/users/users.service.ts):
  - create — уникальность email/username, назначение статуса, аудит user.create
  - update — запрет админам редактировать других админов (кроме суперадмина), аудит user.update
  - remove — запрет удалить суперадмина и себя; аудит user.delete
  - revokeSessions — запрет для суперадмина; аудит user.sessions.revoke
  - blockUser — назначение статуса blocked, отзыв сессий; аудит user.block
- UI [UsersView.vue](file:///c:/Users/User/Desktop/Project/warehouse/frontend/src/views/UsersView.vue):
  - Ролевая логика для кнопок:
    - Админ не редактирует других админов (может себя)
    - Суперадмин — полный доступ ко всем
    - «Завершить все сессии», «Заблокировать пользователя», «Сбросить пароль» — показываются по описанной логике
  - Страница пользователей доступна только ADMIN (клиентский роутер)
  - Подсветка текущего пользователя в таблице
  - История действий со заменой имени на «Вы» для текущего пользователя

## Модуль «Журнал действий»
- API контроллер [audit-log.controller.ts](file:///c:/Users/User/Desktop/Project/warehouse/backend/src/audit-log/audit-log.controller.ts):
  - GET /audit-logs — ADMIN, с фильтрами по пользователю, типу, сущности и периоду
- UI [AuditLogView.vue](file:///c:/Users/User/Desktop/Project/warehouse/frontend/src/views/AuditLogView.vue):
  - Фильтры по пользователю/типу/датам, постраничность
  - В таблице метки «Вы» для текущего пользователя

## Модуль «Товары»
- API контроллер [products.controller.ts](file:///c:/Users/User/Desktop/Project/warehouse/backend/src/products/products.controller.ts):
  - POST /products — MANAGER, ADMIN: создать
  - GET /products — Public: список с фильтрами
  - GET /products/:id — Public: товар по id
  - PATCH /products/:id — MANAGER, ADMIN: обновить
  - PATCH /products/:id/images/reorder — MANAGER, ADMIN: изменить порядок изображений
  - DELETE /products/:id — ADMIN: удалить
  - GET /products/in-stock — защищённый (без @Public/@Roles; требуется авторизация)
- Сервис [products.service.ts](file:///c:/Users/User/Desktop/Project/warehouse/backend/src/products/products.service.ts):
  - Поиск и пагинация, включение связей, аудит изменений
- UI:
  - Список товаров [ProductsView.vue](file:///c:/Users/User/Desktop/Project/warehouse/frontend/src/views/ProductsView.vue) — доступ у всех авторизованных
  - Детали товара [ProductDetailsView.vue](file:///c:/Users/User/Desktop/Project/warehouse/frontend/src/views/ProductDetailsView.vue):
    - Просмотр характеристик, изображений, истории изменений
    - Редактирование только MANAGER/ADMIN
    - Управление изображениями, изменение порядка
    - История с заменой имени на «Вы»

## Модуль «Продажи»
- API контроллер [sales.controller.ts](file:///c:/Users/User/Desktop/Project/warehouse/backend/src/sales/sales.controller.ts):
  - POST /sales — SELLER, MANAGER, ADMIN: создать продажу
  - GET /sales — SELLER, MANAGER, ADMIN: список продаж (с фильтрами)
  - GET /sales/statistics — MANAGER, ADMIN: агрегированная статистика
  - GET /sales/:id — MANAGER, ADMIN: продажа по id
  - PATCH /sales/:id — MANAGER, ADMIN: обновить
  - DELETE /sales/:id — MANAGER, ADMIN: удалить
- UI [ReportsView.vue](file:///c:/Users/User/Desktop/Project/warehouse/frontend/src/views/ReportsView.vue):
  - Отчёты и визуализации по продажам/остаткам/возвратам
  - Экспорт данных

## Модуль «Возвраты»
- API контроллер [returns.controller.ts](file:///c:/Users/User/Desktop/Project/warehouse/backend/src/returns/returns.controller.ts):
  - POST /returns — SELLER, MANAGER, ADMIN: создать возврат
  - GET /returns — SELLER, MANAGER, ADMIN: список возвратов
  - GET /returns/:id — MANAGER, ADMIN: возврат по id
  - PATCH /returns/:id — MANAGER, ADMIN: обновить
  - DELETE /returns/:id — MANAGER, ADMIN: удалить

## Модуль «Категории»
- API контроллер [categories.controller.ts](file:///c:/Users/User/Desktop/Project/warehouse/backend/src/categories/categories.controller.ts):
  - Создание/обновление — обычно MANAGER/ADMIN, удаление — ADMIN (по аналогии с настройками)
- UI [SettingsView.vue → вкладка «Категории»](file:///c:/Users/User/Desktop/Project/warehouse/frontend/src/views/SettingsView.vue#L25-L79):
  - Создание/редактирование — MANAGER/ADMIN
  - Удаление — ADMIN
  - Древовидный просмотр, выбор родителя, форма создания/редактирования

## Модуль «Склады»
- API контроллер [warehouses.controller.ts](file:///c:/Users/User/Desktop/Project/warehouse/backend/src/warehouses/warehouses.controller.ts):
  - POST/PATCH — MANAGER, ADMIN
  - GET — Public: список
  - GET by id — Public: по id
  - DELETE — ADMIN
- UI [SettingsView.vue → вкладка «Склады»](file:///c:/Users/User/Desktop/Project/warehouse/frontend/src/views/SettingsView.vue#L169-L225):
  - Создание/редактирование — MANAGER/ADMIN
  - Удаление — ADMIN

## Модуль «Коммитеты»
- API контроллер [committees.controller.ts](file:///c:/Users/User/Desktop/Project/warehouse/backend/src/committees/committees.controller.ts) — аналогично складам/категориям (создание/редактирование для MANAGER/ADMIN, удаление для ADMIN)
- UI [SettingsView.vue → вкладка «Коммитеты»](file:///c:/Users/User/Desktop/Project/warehouse/frontend/src/views/SettingsView.vue#L226-L288):
  - Список, создание/редактирование — MANAGER/ADMIN
  - Удаление — ADMIN
  - Переход к деталям коммитета

## Модуль «Типы транзакций»
- API контроллер [transaction-types.controller.ts](file:///c:/Users/User/Desktop/Project/warehouse/backend/src/transaction-types/transaction-types.controller.ts):
  - Создание/редактирование — MANAGER/ADMIN
  - Удаление — ADMIN
- UI [SettingsView.vue → вкладка «Типы транзакций»](file:///c:/Users/User/Desktop/Project/warehouse/frontend/src/views/SettingsView.vue#L434-L487):
  - Список, добавление/редактирование — MANAGER/ADMIN
  - Удаление — ADMIN

## Модуль «Статусы пользователей»
- API контроллер [user-statuses.controller.ts](file:///c:/Users/User/Desktop/Project/warehouse/backend/src/user-statuses/user-statuses.controller.ts):
  - Создание/редактирование/удаление — ADMIN
  - GET список/по id — без ограничения ролей (вызов под защитой JWT+RolesGuard на уровне класса)
- UI [SettingsView.vue → вкладка «Статусы пользователей»](file:///c:/Users/User/Desktop/Project/warehouse/frontend/src/views/SettingsView.vue#L80-L167):
  - Полный CRUD — ADMIN

## Панель «Главная» (Dashboard)
- UI [DashboardView.vue](file:///c:/Users/User/Desktop/Project/warehouse/frontend/src/views/DashboardView.vue):
  - Отображение сводных блоков и графиков (доступ для всех авторизованных; наполнение зависит от ролей и доступных данных)

## Особенности и политика доступа
- Суперадмин (isSuperAdmin):
  - Имеет доступ ко всем действиям, даже если не совпадает формальная роль
- Админ (ADMIN):
  - Может выполнять административные действия
  - Не может редактировать других админов (может редактировать себя); суперадмин это ограничение не имеет
- Менеджер (MANAGER):
  - Имеет доступ к настройкам (категории, склады, коммитеты, типы транзакций), к отчётам
  - Может создавать/обновлять товары, управлять изображениями; удаление товаров — только ADMIN
- Продавец (SELLER):
  - Может создавать продажи и возвраты, просматривать списки продаж/возвратов
  - Нет доступа к административным страницам (настройки, пользователи, журнал)
- Гость (GUEST):
  - Используется при регистрации; после входа назначаются реальные права администрацией

## Управление сессиями и блокировкой
- Завершение всех сессий пользователя (ADMIN):
  - Сервер: POST /users/:id/sessions/revoke [users.controller.ts](file:///c:/Users/User/Desktop/Project/warehouse/backend/src/users/users.controller.ts#L96-L114)
  - Клиент: кнопка в списке пользователей и в деталях
- Блокировка пользователя (ADMIN):
  - Сервер: POST /users/:id/block [users.controller.ts](file:///c:/Users/User/Desktop/Project/warehouse/backend/src/users/users.controller.ts#L116-L129)
  - Меняет статус на blocked и завершает все сессии
- Ограничения:
  - Суперадмина нельзя блокировать, удалять, отзывать его сессии
  - Админ не может удалять себя

## Аудит действий
- Все ключевые операции логируются: вход/попытка входа, CRUD пользователей, изменения товаров и пр.
- Записи содержат: кто, когда, IP, user agent, сущность и изменения
- Просмотр доступен ADMIN в UI

## Замечания по соответствию UI/Backend
- Users (страница пользователей):
  - Backend позволяет GET /users для ADMIN и MANAGER
  - UI/Router допускает доступ только ADMIN
  - Итог: менеджер не попадёт на страницу пользователи через UI, но API допускает (можно обсудить желаемое поведение)
- products/in-stock:
  - Маршрут защищён (без @Public); требуется авторизация

## Итоги и вопросы для обсуждения с заказчиком
- Совпадает ли текущая матрица доступа с ожиданиями (особенно:
  - Доступ менеджера к «Пользователи»
  - Публичность списка товаров
  - Роли для отчётов/настроек
)
- Нужен ли полный функционал сброса пароля (сейчас в UI заглушка)?
- Требуется ли доступ продавцу к каким‑либо настройкам?
- Дополнительные отчёты, фильтры и экспортные форматы?
- Расширение аудита: новые типы действий/сущностей?

