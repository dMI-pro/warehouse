import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Bind explicitly to 0.0.0.0 so the app is reachable from Docker
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
