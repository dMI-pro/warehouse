# Frontend (Vue 3 + Vite + PrimeVue)

Frontend часть системы управления складом. Используются Vue 3 (Composition API), PrimeVue для UI-компонентов, Pinia для состояния, Vue Router для маршрутизации, ECharts для графиков.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd) 
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

## Environment
Create `.env`:
```
VITE_API_URL=http://localhost:3000
```

## Pages
- Главная: виджеты статистики, динамика продаж, последние продажи/возвраты/поступления/действия.
- Товары: список, фильтры, диалоги добавления/редактирования, загрузка изображений и их порядок.
- Настройки: вкладки категорий, складов, комитетов, типов транзакций, статусов пользователей, дополнительные поля, шаблоны, системные настройки.
- Комитеты: детальная страница со статистикой.
- Отчеты: агрегированные отчеты, графики.
- Журнал действий: аудит операций, фильтры и просмотр подробностей.
- Пользователи: управление учетными записями и ролями (ADMIN).

## Roles

| Роль | Доступ |
|------|--------|
| **GUEST** | Только просмотр товаров (без цены закупки, коммитета, типа транзакции в UI и в API). |
| **SELLER** | Просмотр товаров как гость + оформление продаж (и возвратов через API/кнопки по правам). |
| **MANAGER** | Управление товарами и справочниками, отчёты, медиа, экспорт; видит `purchasePrice` и служебные поля. |
| **ADMIN** | Всё как менеджер + пользователи, журнал действий, удаление товаров. |

Страницы с `requiredRoles` в роутере: dashboard (не guest), reports/settings/media (manager+), users/audit-log/committees detail (admin).

См. подробности в корневом [README](../README.md).
