import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import rateLimit from 'express-rate-limit';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Increase body size limit
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // Trust proxy when behind reverse proxy (nginx) for correct rate limit IP
  app.set('trust proxy', 1);

  // Global Rate limiting
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 1000 : 2000, // Slightly higher for general use
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  });
  app.use(globalLimiter);

  // Stricter rate limiting for auth endpoints
  const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 15, // 15 attempts per hour
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many auth attempts, please try again after an hour',
    skip: (req) => !req.url.includes('/auth/login') && !req.url.includes('/auth/register'),
  });
  app.use(authLimiter);

  // Security headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:', 'http:'],
          connectSrc: ["'self'", 'https:', 'http:', 'ws:', 'wss:'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          objectSrc: ["'none'"],
          frameAncestors: ["'self'"],
        },
      },
    }),
  );

  // Global Interceptor to exclude sensitive fields
  app.useGlobalInterceptors(new TransformInterceptor());

  // Настройка статической раздачи файлов для загрузки изображений
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
    setHeaders: (res) => {
      res.set('X-Content-Type-Options', 'nosniff');
    },
  });

  // Включение валидации для всех входящих запросов
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Включение CORS для фронтенда и API клиентов
  const allowedOrigins =
    process.env.NODE_ENV === 'production'
      ? process.env.FRONTEND_URL
        ? [
            process.env.FRONTEND_URL.trim(),
            'http://smagrarom.ru',
            'https://smagrarom.ru',
          ]
        : ['http://localhost:5173']
      : [
          'http://smagrarom.ru',
          'https://smagrarom.ru',
          'http://localhost:5173',
          'http://localhost:3000',
          'http://localhost:3001',
          'http://127.0.0.1:5173',
          'http://127.0.0.1:3000',
        ];

  console.log('Allowed Origins:', allowedOrigins);

  app.enableCors({
    origin: (origin, callback) => {
      // Разрешаем запросы без origin (например, мобильные приложения, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(
          `CORS blocked origin: ${origin}. Allowed: ${JSON.stringify(allowedOrigins)}`,
        );
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400, // 24 часа
  });

  // Bind explicitly to 0.0.0.0 so the app is reachable from Docker
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
