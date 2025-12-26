import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';

// Проверка JWT_SECRET в production
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is required in production');
}
if (jwtSecret && jwtSecret.length < 32) {
  console.warn('WARNING: JWT_SECRET should be at least 32 characters long for security');
}

const jwtExpiresIn: string = process.env.JWT_EXPIRES_IN || '1h';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: jwtSecret || 'your-secret-key-change-in-production-dev-only',
      signOptions: { expiresIn: jwtExpiresIn as any },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}

