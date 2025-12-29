<template>
  <div class="login-container">
    <Card class="login-card">
      <template #title>Вход в систему</template>
      <template #content>
        <form @submit.prevent="handleLogin" class="login-form">
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
            <small v-if="errors.password" class="p-error">{{ errors.password }}</small>
          </div>

          <Message v-if="authStore.error" severity="error" :closable="false" class="mb-3">
            {{ authStore.error }}
          </Message>

          <Button
            type="submit"
            label="Войти"
            icon="pi pi-sign-in"
            :loading="authStore.loading"
            class="w-full"
          />

          <div class="mt-3 text-center">
            <span>Нет аккаунта? </span>
            <router-link to="/register" class="link">Зарегистрироваться</router-link>
          </div>
        </form>
        <div>
          <!-- <button @click="testLoginUser()">Testclick</button> -->
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import Message from 'primevue/message';
import { useAuthStore } from '@/stores/authStore';
import { apiService } from '@/services/api';

import axios from 'axios'

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const form = reactive({
  username: '',
  password: '',
});

const errors = reactive({
  username: '',
  password: '',
});

const validate = () => {
  errors.username = '';
  errors.password = '';

  if (!form.username.trim()) {
    errors.username = 'Имя пользователя обязательно';
    return false;
  }

  if (!form.password) {
    errors.password = 'Пароль обязателен';
    return false;
  }

  return true;
};

const handleLogin = async () => {
  if (!validate()) return;
// debugger
  try {
    await authStore.login({
      username: form.username,
      password: form.password,
    });

    const redirect = (route.query.redirect as string) || '/dashboard';
    router.push(redirect);
  } catch (error) {
    // Ошибка уже обработана в store
  }
};

const testLoginUser = async (username = 'Testuser', password = 'Testuser') => {
  try {
    const response = await axios.post('http://localhost:3000/auth/login', {
      username,
      password
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    })

    console.log('response:', response);
    
    // Сохраняем токен
    const token = response.data.access_token
    if (token) {
      localStorage.setItem('access_token', token)
      // axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }

    console.log('response:', response);
    
    // return response.data
  } catch (error) {
    console.error('Login error:', error)
    throw error
  }
}

const testclick = async () => {
  console.log('testclick');
  try {
    debugger
    const test = await apiService.getUsers()
    console.log('test', test);
  } catch (error) {
    // Ошибка уже обработана в store
  }

}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  /* background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); */
  padding: 2rem;
}

.login-card {
  width: 100%;
  max-width: 400px;
}

.login-form {
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


