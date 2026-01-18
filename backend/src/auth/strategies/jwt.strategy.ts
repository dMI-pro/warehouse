import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import type { User } from '@prisma/client';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret && process.env.NODE_ENV === 'production') {
      throw new Error(
        'JWT_SECRET environment variable is required in production',
      );
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret || 'your-secret-key-change-in-production-dev-only',
    });
  }

  async validate(payload: any) {
    const user = (await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { status: true },
    })) as (User & { status: { code: string } | null }) | null;

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.status?.code?.toLowerCase() === 'blocked') {
      throw new UnauthorizedException('User is blocked');
    }

    const iatMs =
      typeof payload.iat === 'number' ? payload.iat * 1000 : Date.now();
    const revokedAt = user.sessionsRevokeAt
      ? new Date(user.sessionsRevokeAt).getTime()
      : undefined;
    if (revokedAt && iatMs <= revokedAt) {
      throw new UnauthorizedException('Session revoked');
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      isSuperAdmin: user.isSuperAdmin,
    };
  }
}
