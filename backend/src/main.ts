import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Включение валидации для всех входящих запросов
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Включение CORS для фронтенда и API клиентов
  app.enableCors({
    origin: process.env.NODE_ENV === 'production'
      ? process.env.FRONTEND_URL || 'http://localhost:5173'
      : true, // В разработке разрешаем все источники (для Thunder Client и других инструментов)
    credentials: true,
  });

  // Bind explicitly to 0.0.0.0 so the app is reachable from Docker
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
