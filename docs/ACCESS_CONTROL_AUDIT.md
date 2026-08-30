# Аудит прав доступа (Access Control Audit)

Этот документ содержит обзор прав доступа для различных частей приложения (бэкенд и фронтенд), основанный на анализе кода.

## 🛡️ Backend (API Endpoints)

Права доступа определяются декораторами `@Roles` и `@Public` в контроллерах NestJS.

### 👥 Users (Пользователи)
| Метод | Путь | Роли | Примечание |
|---|---|---|---|
| POST | `/users` | `ADMIN` | Создание пользователя |
| GET | `/users` | `ADMIN`, `MANAGER` | Список пользователей |
| GET | `/users/:id` | `ADMIN` | Просмотр пользователя |
| PATCH | `/users/:id` | `ADMIN` | Обновление пользователя |
| DELETE | `/users/:id` | `ADMIN` | Удаление пользователя |
| POST | `/users/:id/sessions/revoke` | `ADMIN` | Сброс сессий |

### 📦 Products (Товары)
| Метод | Путь | Роли | Примечание |
|---|---|---|---|
| GET | `/products` | **Public** | Доступно всем (даже без авторизации) |
| GET | `/products/:id` | **Public** | Просмотр товара |
| POST | `/products` | `MANAGER`, `ADMIN` | Создание товара |
| PATCH | `/products/:id` | `MANAGER`, `ADMIN` | Обновление товара |
| DELETE | `/products/:id` | `ADMIN` | Удаление товара |
| GET | `/products/last-sku` | `MANAGER`, `ADMIN` | Получение последнего SKU |
| GET | `/products/:id/history` | `MANAGER`, `ADMIN` | История изменений товара |
| GET | `/products/in-stock` | **Все авторизованные** | Только для авторизованных |

### 🏷️ Categories (Категории)
| Метод | Путь | Роли | Примечание |
|---|---|---|---|
| GET | `/categories` | **Public** | Список категорий |
| GET | `/categories/:id` | **Public** | Просмотр категории |
| POST | `/categories` | `MANAGER`, `ADMIN` | Создание категории |
| PATCH | `/categories/:id` | `MANAGER`, `ADMIN` | Обновление категории |
| DELETE | `/categories/:id` | `ADMIN` | Удаление категории |

### 🏢 Warehouses (Склады)
| Метод | Путь | Роли | Примечание |
|---|---|---|---|
| GET | `/warehouses` | **Public** | Список складов |
| GET | `/warehouses/:id` | **Public** | Просмотр склада |
| POST | `/warehouses` | `MANAGER`, `ADMIN` | Создание склада |
| PATCH | `/warehouses/:id` | `MANAGER`, `ADMIN` | Обновление склада |
| DELETE | `/warehouses/:id` | `ADMIN` | Удаление склада |

### 💰 Sales (Продажи)
| Метод | Путь | Роли | Примечание |
|---|---|---|---|
| GET | `/sales` | `SELLER`, `MANAGER`, `ADMIN` | Список продаж |
| POST | `/sales` | `SELLER`, `MANAGER`, `ADMIN` | Создание продажи |
| GET | `/sales/:id` | `MANAGER`, `ADMIN` | Просмотр деталей продажи |
| PATCH | `/sales/:id` | `MANAGER`, `ADMIN` | Обновление продажи |
| DELETE | `/sales/:id` | `MANAGER`, `ADMIN` | Удаление продажи |
| GET | `/sales/statistics` | `MANAGER`, `ADMIN` | Статистика продаж |

### ↩️ Returns (Возвраты)
| Метод | Путь | Роли | Примечание |
|---|---|---|---|
| GET | `/returns` | `SELLER`, `MANAGER`, `ADMIN` | Список возвратов |
| POST | `/returns` | `SELLER`, `MANAGER`, `ADMIN` | Создание возврата |
| GET | `/returns/:id` | `MANAGER`, `ADMIN` | Просмотр возврата |
| PATCH | `/returns/:id` | `MANAGER`, `ADMIN` | Обновление возврата |
| DELETE | `/returns/:id` | `MANAGER`, `ADMIN` | Удаление возврата |

### 👥 Committees (Комитеты)
| Метод | Путь | Роли | Примечание |
|---|---|---|---|
| GET | `/committees` | **Public** | Список комитетов |
| POST | `/committees` | `MANAGER`, `ADMIN` | Создание комитета |
| GET | `/committees/:id` | `ADMIN` | Просмотр комитета |
| PATCH | `/committees/:id` | `MANAGER`, `ADMIN` | Обновление комитета |
| DELETE | `/committees/:id` | `ADMIN` | Удаление комитета |
| GET | `/committees/:id/stats` | `ADMIN` | Статистика комитета |

### 📜 Audit Log (Аудит)
| Метод | Путь | Роли | Примечание |
|---|---|---|---|
| GET | `/audit-logs` | `ADMIN`, `MANAGER` | Просмотр логов (весь контроллер ограничен) |

### 🔄 Transaction Types (Типы транзакций)
| Метод | Путь | Роли | Примечание |
|---|---|---|---|
| GET | `/transaction-types` | **Public** | Список типов |
| GET | `/transaction-types/:id` | **Public** | Просмотр типа |
| POST | `/transaction-types` | `MANAGER`, `ADMIN` | Создание типа |
| PATCH | `/transaction-types/:id` | `MANAGER`, `ADMIN` | Обновление типа |
| DELETE | `/transaction-types/:id` | `ADMIN` | Удаление типа |

### 🚦 User Statuses (Статусы пользователей)
| Метод | Путь | Роли | Примечание |
|---|---|---|---|
| GET | `/user-statuses` | **Все авторизованные** | Список статусов |
| POST | `/user-statuses` | `ADMIN` | Создание статуса |
| PATCH | `/user-statuses/:id` | `ADMIN` | Обновление статуса |
| DELETE | `/user-statuses/:id` | `ADMIN` | Удаление статуса |

---

## 💻 Frontend (UI & Routes)

Права доступа на клиенте проверяются в `router/index.ts` (защита страниц) и внутри компонентов (скрытие кнопок).

### 🛣️ Маршруты (Pages)

| Страница | Путь | Требуемые роли |
|---|---|---|
| **Dashboard** | `/dashboard` | `SELLER`, `MANAGER`, `ADMIN` |
| **Products** | `/products` | **Все авторизованные** |
| **Product Details** | `/products/:id` | **Все авторизованные** |
| **Users** | `/users` | `ADMIN` |
| **Settings** | `/settings` | `MANAGER`, `ADMIN` |
| **Reports** | `/reports` | `MANAGER`, `ADMIN` |
| **Audit Log** | `/audit-log` | `ADMIN` |
| **Committee Details** | `/committees/:id` | `ADMIN` |

### 🔘 Элементы интерфейса (Buttons & Features)

**Товары (Products View):**
*   **Кнопка "Добавить товар"**: `MANAGER`, `ADMIN`
*   **Фильтр по комитетам**: `MANAGER`, `ADMIN`

**Настройки (Settings View):**
*   **Кнопка "Добавить категорию"**: `MANAGER`, `ADMIN`
*   **Кнопка "Редактировать категорию"**: `MANAGER`, `ADMIN`
*   **Кнопка "Удалить категорию"**: `ADMIN`
*   **Кнопка "Добавить статус"**: `ADMIN`

**Пользователи (Users View):**
*   **Кнопка "Добавить пользователя"**: `ADMIN`
*   **Кнопка "Заблокировать"**: Проверяется функцией `canBlockUser` (обычно ADMIN)
*   **Кнопка "Редактировать"**: Проверяется функцией `canEditUser`
