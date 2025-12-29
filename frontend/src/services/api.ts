import axios, { type AxiosInstance, type AxiosError } from 'axios';
import type { LoginDto, RegisterDto, AuthResponse, User, ApiError } from '@/types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Добавляем токен к каждому запросу
    this.api.interceptors.request.use((config) => {
      const publicEndpoints = ['/auth/login', '/auth/register'];
      const isPublicEndpoint = publicEndpoints.some(endpoint => 
        config.url?.includes(endpoint)
      );

      if (!isPublicEndpoint) {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }

      return config;
    });

    // Обработка ошибок
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiError>) => {
        if (error.response?.status === 401) {
          // Токен истек или невалиден
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(loginDto: LoginDto): Promise<AuthResponse> {
    // debugger
    const response = await this.api.post<AuthResponse>('/auth/login', loginDto);
    console.log('response:', response);
    return response.data;
  }

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/register', registerDto);
    return response.data;
  }

  async getMe(): Promise<User> {
    debugger
    const response = await this.api.get<User>('/auth/me');
    return response.data;
  }

  // Users endpoints
async getUsers(): Promise<User[]> {
    const response = await this.api.get<User[]>('/users');
    return response.data;
  }

  // Products endpoints
  async getProducts(params?: { search?: string; category?: number; page?: number; limit?: number }) {
    const response = await this.api.get('/products', { params });
    return response.data;
  }
}

export const apiService = new ApiService();


