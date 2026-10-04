import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role } from '../common/enums/role.enum';
import { AuditLogService } from '../audit-log/audit-log.service';
import { parseDurationToMs } from './auth-cookies';

type PublicUser = {
  id: number;
  email: string;
  username: string;
  fullName: string;
  role: string;
  isSuperAdmin: boolean;
};

type TokenPair = {
  accessToken: string;
  refreshToken: string;
  accessMaxAgeMs: number;
  refreshMaxAgeMs: number;
};

type AuthResult = TokenPair & { user: PublicUser };

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    @Inject(forwardRef(() => AuditLogService))
    private auditLogService?: AuditLogService,
  ) {}

  private get accessExpiresIn(): string {
    return this.config.get<string>('JWT_ACCESS_EXPIRATION') || '15m';
  }

  private get refreshExpiresIn(): string {
    return this.config.get<string>('JWT_REFRESH_EXPIRATION') || '7d';
  }

  private hashRefreshToken(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  private toPublicUser(user: PublicUser): PublicUser {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      isSuperAdmin: user.isSuperAdmin,
    };
  }

  private assertUserCanAuthenticate(user: {
    status?: { code: string } | null;
  }) {
    const status = user.status?.code?.toLowerCase();
    if (status === 'blocked') {
      throw new ForbiddenException('Account is blocked');
    }
    if (status === 'disabled') {
      throw new ForbiddenException('Account is disabled. Pending approval.');
    }
  }

  private signAccessToken(user: PublicUser): string {
    return this.jwtService.sign(
      {
        sub: user.id,
        username: user.username,
        role: user.role,
        type: 'access',
      },
      { expiresIn: this.accessExpiresIn as any },
    );
  }

  private async issueTokenPair(
    user: PublicUser,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<TokenPair> {
    const accessToken = this.signAccessToken(user);
    const refreshToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashRefreshToken(refreshToken);
    const accessMaxAgeMs = parseDurationToMs(this.accessExpiresIn);
    const refreshMaxAgeMs = parseDurationToMs(this.refreshExpiresIn);

    await this.prisma.refreshToken.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + refreshMaxAgeMs),
        userAgent: userAgent?.slice(0, 512),
        ipAddress: ipAddress?.slice(0, 128),
      },
    });

    return { accessToken, refreshToken, accessMaxAgeMs, refreshMaxAgeMs };
  }

  async register(registerDto: RegisterDto) {
    const { email, username, password, fullName } = registerDto;

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      throw new ConflictException(
        'User with this email or username already exists',
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const disabledStatus = await this.prisma.userStatus.findUnique({
      where: { code: 'disabled' },
    });

    await this.prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        fullName,
        role: Role.GUEST,
        status: disabledStatus
          ? { connect: { id: disabledStatus.id } }
          : undefined,
      },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true,
        isSuperAdmin: true,
      },
    });

    return {
      message:
        'Регистрация прошла успешно. Учетная запись ожидает подтверждения.',
    };
  }

  async login(
    loginDto: LoginDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResult> {
    const { username, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { username },
      include: { status: true },
    });

    const dummyHash = '$2a$10$dummyhashfordummyuserprotection';
    const hashToCompare = user?.password || dummyHash;
    const isPasswordValid = await bcrypt.compare(password, hashToCompare);

    if (this.auditLogService) {
      await this.auditLogService.create({
        userId: user?.id,
        action: 'login_attempt',
        entityType: 'User',
        entityId: user?.id,
        success: !!(user && isPasswordValid),
        ipAddress,
        userAgent,
      });
    }

    if (!user || !isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    this.assertUserCanAuthenticate(user);

    if (this.auditLogService) {
      await this.auditLogService.create({
        userId: user.id,
        action: 'login',
        entityType: 'User',
        entityId: user.id,
        success: true,
        ipAddress,
        userAgent,
      });
    }

    const publicUser = this.toPublicUser(user);
    const tokens = await this.issueTokenPair(publicUser, ipAddress, userAgent);
    return { user: publicUser, ...tokens };
  }

  async refresh(
    rawRefreshToken: string | null,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResult> {
    if (!rawRefreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const tokenHash = this.hashRefreshToken(rawRefreshToken);
    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { include: { status: true } } },
    });

    if (!existing) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (existing.revokedAt) {
      await this.revokeUserSessions(existing.userId);
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    if (existing.expiresAt.getTime() <= Date.now()) {
      await this.prisma.refreshToken.update({
        where: { id: existing.id },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Refresh token expired');
    }

    this.assertUserCanAuthenticate(existing.user);

    const publicUser = this.toPublicUser(existing.user);
    const nextId = randomUUID();
    const nextRaw = randomBytes(32).toString('hex');
    const nextHash = this.hashRefreshToken(nextRaw);
    const accessMaxAgeMs = parseDurationToMs(this.accessExpiresIn);
    const refreshMaxAgeMs = parseDurationToMs(this.refreshExpiresIn);

    await this.prisma.$transaction([
      this.prisma.refreshToken.update({
        where: { id: existing.id },
        data: { revokedAt: new Date(), replacedByTokenId: nextId },
      }),
      this.prisma.refreshToken.create({
        data: {
          id: nextId,
          userId: existing.userId,
          tokenHash: nextHash,
          expiresAt: new Date(Date.now() + refreshMaxAgeMs),
          userAgent: userAgent?.slice(0, 512),
          ipAddress: ipAddress?.slice(0, 128),
        },
      }),
    ]);

    return {
      user: publicUser,
      accessToken: this.signAccessToken(publicUser),
      refreshToken: nextRaw,
      accessMaxAgeMs,
      refreshMaxAgeMs,
    };
  }

  async logout(rawRefreshToken: string | null) {
    if (!rawRefreshToken) return;
    const tokenHash = this.hashRefreshToken(rawRefreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async validateUser(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true,
        isSuperAdmin: true,
      },
    });

    return user;
  }

  async revokeUserSessions(userId: number) {
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { sessionsRevokeAt: new Date() },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }
}
