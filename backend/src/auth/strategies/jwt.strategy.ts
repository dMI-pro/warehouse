import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import type { User } from '@prisma/client';
import {
  ACCESS_COOKIE_NAME,
  getCookieFromRequest,
} from '../auth-cookies';

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
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) =>
          getCookieFromRequest(request, ACCESS_COOKIE_NAME),
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret || 'dev-only-secret-change-it',
    });
  }

  async validate(payload: any) {
    if (payload?.type !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = (await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { status: true },
    })) as (User & { status: { code: string } | null }) | null;

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const status = user.status?.code?.toLowerCase();
    if (status === 'blocked') {
      throw new UnauthorizedException('User is blocked');
    }
    if (status === 'disabled') {
      throw new UnauthorizedException('User is disabled');
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
