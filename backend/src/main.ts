import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import rateLimit from 'express-rate-limit';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Increase body size limit
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // Trust proxy when behind reverse proxy (nginx) for correct rate limit IP
  app.set('trust proxy', 1);

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 300 : 1000,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  // Security headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
    }),
  );

  // Настройка статической раздачи файлов для загрузки изображений
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
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
        ? [process.env.FRONTEND_URL.trim(), 'http://smagrarom.ru', 'https://smagrarom.ru']
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
        console.warn(`CORS blocked origin: ${origin}. Allowed: ${JSON.stringify(allowedOrigins)}`);
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
