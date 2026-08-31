# Руководство по тестированию

## Запуск тестов

### Backend тесты

```bash
cd backend

# Запуск всех тестов
npm run test

# Запуск тестов в watch режиме
npm run test:watch

# Запуск тестов с покрытием кода
npm run test:cov

# Запуск конкретного теста
npm run test -- auth.service.spec.ts

# E2E тесты
npm run test:e2e
```

### Frontend тесты

```bash
cd frontend

# Запуск всех unit тестов
npm run test:unit

# Запуск тестов в watch режиме
npm run test:unit -- --watch

# Запуск тестов с покрытием
npm run test:unit -- --coverage

# Запуск конкретного теста
npm run test:unit -- LoginView.spec.ts
```

## Структура тестов

### Backend

Тесты находятся в папках рядом с исходным кодом:
- `*.spec.ts` - unit тесты
- `test/` - E2E тесты

Пример структуры:
```
backend/
├── src/
│   ├── auth/
│   │   ├── auth.service.ts
│   │   └── auth.service.spec.ts
│   └── products/
│       ├── products.service.ts
│       └── products.service.spec.ts
└── test/
    └── e2e/
        └── app.e2e-spec.ts
```

### Frontend

Тесты находятся в `__tests__/`:
```
frontend/
├── src/
│   ├── views/
│   │   └── LoginView.vue
│   └── stores/
│       └── authStore.ts
└── __tests__/
    ├── LoginView.spec.ts
    └── authStore.spec.ts
```

## Написание тестов

### Backend Unit тест

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should login user', async () => {
    const result = await service.login({
      username: 'test',
      password: 'password',
    });
    expect(result).toHaveProperty('access_token');
  });
});
```

### Frontend Unit тест

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import LoginView from '@/views/LoginView.vue';

describe('LoginView', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders login form', () => {
    const wrapper = mount(LoginView);
    expect(wrapper.find('input[id="username"]').exists()).toBe(true);
  });
});
```

## Покрытие кода

### Backend

```bash
npm run test:cov
```

Отчет будет в `coverage/` папке.

### Frontend

```bash
npm run test:unit -- --coverage
```

## E2E тестирование

E2E тесты используют реальную базу данных. Убедитесь, что:

1. База данных настроена для тестов
2. Тестовые данные изолированы
3. После тестов данные очищаются

```typescript
describe('Products (e2e)', () => {
  it('/products (GET)', () => {
    return request(app.getHttpServer())
      .get('/products')
      .expect(200);
  });
});
```

## Моки и стабы

### Мокирование API запросов

```typescript
import { vi } from 'vitest';

vi.mock('@/services/api', () => ({
  apiService: {
    login: vi.fn().mockResolvedValue({
      access_token: 'token',
      user: { id: 1, username: 'test' },
    }),
  },
}));
```

## Best Practices

1. **Изолируйте тесты** - каждый тест должен быть независимым
2. **Используйте describe и it** - структурируйте тесты логически
3. **Пишите понятные имена** - `it('should login user with valid credentials')`
4. **Тестируйте граничные случаи** - пустые значения, null, undefined
5. **Используйте моки** - не делайте реальные HTTP запросы в unit тестах
6. **Поддерживайте покрытие > 80%** - но качество важнее количества

## Отладка тестов

### Backend

```bash
# Запуск с отладчиком
npm run test:debug
```

### Frontend

```bash
# Запуск с подробным выводом
npm run test:unit -- --reporter=verbose
```

## CI/CD интеграция

Тесты автоматически запускаются при:
- Push в main ветку
- Pull Request
- По расписанию (nightly builds)

Пример GitHub Actions:
```yaml
- name: Run tests
  run: |
    cd backend && npm run test:cov
    cd ../frontend && npm run test:unit
```

