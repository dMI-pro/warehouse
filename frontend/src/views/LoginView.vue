<template>
  <div class="login-container">
    <Card class="login-card">
      <template #content>
        <div class="login-header">
          <div class="logo">Складской Учет</div>
        </div>
        <form @submit.prevent="handleLogin" class="login-form">
          <div class="field">
            <label for="login" class="label">Имя пользователя</label>
            <InputText
              id="login"
              v-model="form.login"
              type="login"
              placeholder="Введите имя пользователя"
              :class="{ 'p-invalid': errors.login }"
              class="w-full"
            />
            <small v-if="errors.login" class="p-error">{{ errors.login }}</small>
          </div>

          <div class="field">
            <label for="password" class="label">Пароль</label>
            <Password
              id="password"
              v-model="form.password"
              placeholder="Введите пароль"
              :feedback="false"
              toggleMask
              :class="{ 'p-invalid': errors.password }"
              class="w-full"
            />
            <!-- <InputText
              id="password"
              v-model="form.password"
              type="password"
              placeholder="Введите пароль"
              :class="{ 'p-invalid': errors.password }"
              class="w-full"
            /> -->
            <small v-if="errors.password" class="p-error">{{ errors.password }}</small>
          </div>

          <Message v-if="authStore.error" severity="error" :closable="false" class="mb-3">
            {{ authStore.error }}
          </Message>

          <Button
            type="submit"
            label="Войти"
            :loading="authStore.loading"
            class="w-full login-button"
          />

          <Divider />

          <div class="login-links">
            <router-link to="/register" class="link">Зарегистрироваться</router-link>
            <a href="#" class="link" @click.prevent="handleForgotPassword">Забыли пароль?</a>
          </div>
        </form>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import Message from 'primevue/message';
import Divider from 'primevue/divider';
import { useAuthStore } from '@/stores/authStore';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const toast = useToast();

const form = reactive({
  login: '',
  password: '',
});

const errors = reactive({
  login: '',
  password: '',
});

const validate = () => {
  errors.login = '';
  errors.password = '';

  if (!form.login.trim()) {
    errors.login = 'Имя пользователя обязателен';
    return false;
  }

  // Проверка на корректность Email
  // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // if (!emailRegex.test(form.login)) {
  //   errors.login = 'Введите корректный email';
  //   return false;
  // }

  if (!form.password) {
    errors.password = 'Пароль обязателен';
    return false;
  }

  return true;
};

const handleLogin = async () => {
  if (!validate()) return;

  try {
    await authStore.login({
      username: form.login,
      password: form.password,
    });

    const redirect = (route.query.redirect as string) || '/dashboard';
    router.push(redirect);
  } catch (error) {
    // Ошибка уже обработана в store
  }
};

const handleForgotPassword = () => {
  toast.add({
    severity: 'info',
    summary: 'Восстановление пароля',
    detail: 'Функция восстановления пароля будет доступна в ближайшее время',
    life: 3000,
  });
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f5f5 0%, #e6f7ff 100%);
  padding: 2rem;
  animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: var(--surface-card);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
  padding-top: 1rem;
}

.logo {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--primary-color);
  letter-spacing: -0.5px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 0 1rem 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.label {
  font-weight: 500;
  color: var(--text-color);
  font-size: 0.9rem;
}

.login-button {
  margin-top: 0.5rem;
  height: 44px;
  font-weight: 600;
}

.login-links {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
}

.link {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s ease;
}

.link:hover {
  text-decoration: underline;
  opacity: 0.8;
}

:deep(.p-card-body) {
  padding: 2rem 1.5rem;
}

:deep(.p-card-content) {
  padding: 0;
}

:deep(.p-divider) {
  margin: 1rem 0;
}
</style>



