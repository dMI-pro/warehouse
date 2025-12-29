<template>
  <div class="register-container">
    <Card class="register-card">
      <template #title>Регистрация</template>
      <template #content>
        <form @submit.prevent="handleRegister" class="register-form">
          <div class="field">
            <label for="email" class="label">Email</label>
            <InputText
              id="email"
              v-model="form.email"
              type="email"
              placeholder="Введите email"
              :class="{ 'p-invalid': errors.email }"
              class="w-full"
            />
            <small v-if="errors.email" class="p-error">{{ errors.email }}</small>
          </div>

          <div class="field">
            <label for="username" class="label">Имя пользователя</label>
            <InputText
              id="username"
              v-model="form.username"
              placeholder="Введите имя пользователя"
              :class="{ 'p-invalid': errors.username }"
              class="w-full"
            />
            <small v-if="errors.username" class="p-error">{{ errors.username }}</small>
          </div>

          <div class="field">
            <label for="fullName" class="label">Полное имя</label>
            <InputText
              id="fullName"
              v-model="form.fullName"
              placeholder="Введите полное имя"
              :class="{ 'p-invalid': errors.fullName }"
              class="w-full"
            />
            <small v-if="errors.fullName" class="p-error">{{ errors.fullName }}</small>
          </div>

          <div class="field">
            <label for="password" class="label">Пароль</label>
            <Password
              id="password"
              v-model="form.password"
              placeholder="Введите пароль"
              :feedback="true"
              toggleMask
              :class="{ 'p-invalid': errors.password }"
              class="w-full"
            />
            <small v-if="errors.password" class="p-error">{{ errors.password }}</small>
          </div>

          <Message v-if="authStore.error" severity="error" :closable="false" class="mb-3">
            {{ authStore.error }}
          </Message>

          <Button
            type="submit"
            label="Зарегистрироваться"
            icon="pi pi-user-plus"
            :loading="authStore.loading"
            class="w-full"
          />

          <div class="mt-3 text-center">
            <span>Уже есть аккаунт? </span>
            <router-link to="/login" class="link">Войти</router-link>
          </div>
        </form>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import Message from 'primevue/message';
import { useAuthStore } from '@/stores/authStore';

const router = useRouter();
const authStore = useAuthStore();

const form = reactive({
  email: '',
  username: '',
  fullName: '',
  password: '',
});

const errors = reactive({
  email: '',
  username: '',
  fullName: '',
  password: '',
});

const validate = () => {
  errors.email = '';
  errors.username = '';
  errors.fullName = '';
  errors.password = '';

  if (!form.email.trim()) {
    errors.email = 'Email обязателен';
    return false;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Некорректный email';
    return false;
  }

  if (!form.username.trim()) {
    errors.username = 'Имя пользователя обязательно';
    return false;
  }

  if (form.username.length < 3) {
    errors.username = 'Имя пользователя должно быть не менее 3 символов';
    return false;
  }

  if (!form.fullName.trim()) {
    errors.fullName = 'Полное имя обязательно';
    return false;
  }

  if (!form.password) {
    errors.password = 'Пароль обязателен';
    return false;
  }

  if (form.password.length < 6) {
    errors.password = 'Пароль должен быть не менее 6 символов';
    return false;
  }

  return true;
};

const handleRegister = async () => {
  if (!validate()) return;

  try {
    await authStore.register(form);
    router.push({ name: 'dashboard' });
  } catch (error) {
    // Ошибка уже обработана в store
  }
};
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  /* background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); */
  padding: 2rem;
}

.register-card {
  width: 100%;
  max-width: 450px;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.label {
  font-weight: 500;
}

.link {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
}

.link:hover {
  text-decoration: underline;
}
</style>


