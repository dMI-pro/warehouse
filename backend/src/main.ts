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

  const isProd = process.env.NODE_ENV === 'production';

  // Login: count failed attempts only (401/400), so a successful login does not burn quota.
  // 10 tries / 10 min — enough for typos, tight enough against password spraying.
  const loginLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: isProd ? 10 : 50,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      const retryAfter = Number(res.getHeader('Retry-After'));
      const waitMin = Number.isFinite(retryAfter) && retryAfter > 0
        ? Math.max(1, Math.ceil(retryAfter / 60))
        : 10;
      res.status(429).json({
        statusCode: 429,
        message: `Слишком много неудачных попыток входа. Подождите ${waitMin} мин. и попробуйте снова.`,
      });
    },
  });
  app.use('/auth/login', loginLimiter);

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProd ? 300 : 1000,
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

  // CORS: в production — из FRONTEND_URL (+ www и http/https), в dev — localhost
  const buildOriginsFromFrontendUrl = (url: string): string[] => {
    const trimmed = url.trim().replace(/\/$/, '');
    const origins = new Set<string>([trimmed]);
    try {
      const parsed = new URL(trimmed);
      const host = parsed.hostname;
      const altHost = host.startsWith('www.') ? host.slice(4) : `www.${host}`;
      for (const scheme of ['https', 'http'] as const) {
        origins.add(`${scheme}://${host}`);
        origins.add(`${scheme}://${altHost}`);
      }
    } catch {
      // ignore invalid FRONTEND_URL
    }
    return [...origins];
  };

  const frontendUrl = process.env.FRONTEND_URL?.trim();
  const allowedOrigins =
    process.env.NODE_ENV === 'production'
      ? frontendUrl
        ? buildOriginsFromFrontendUrl(frontendUrl)
        : ['http://localhost:5173']
      : [
          ...(frontendUrl ? buildOriginsFromFrontendUrl(frontendUrl) : []),
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
