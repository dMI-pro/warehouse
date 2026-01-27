import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    PassportModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET');
        const expiresIn = config.get<string>('JWT_EXPIRATION', '1h') as any;
        if (!secret && config.get<string>('NODE_ENV') === 'production') {
          throw new Error(
            'JWT_SECRET environment variable is required in production',
          );
        }
        return {
          secret: secret || 'dev-only-secret-change-it',
          signOptions: { expiresIn },
        };
      },
    }),
    forwardRef(() => AuditLogModule),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
