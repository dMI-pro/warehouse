import { Injectable, ConflictException, UnauthorizedException, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role } from '../common/enums/role.enum';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    @Inject(forwardRef(() => AuditLogService))
    private auditLogService?: AuditLogService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, username, password, fullName } = registerDto;

    // Проверка существования пользователя
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      throw new ConflictException('User with this email or username already exists');
    }

    // Хеширование пароля
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создание пользователя
    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        fullName,
        role: Role.GUEST,
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

    // Генерация JWT токена
    const payload = { sub: user.id, username: user.username, role: user.role };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user,
    };
  }

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string) {
    const { username, password } = loginDto;

    // Поиск пользователя
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    // Защита от timing attacks: всегда выполняем хеширование,
    // даже если пользователь не найден, чтобы время ответа было одинаковым
    const dummyHash = '$2a$10$dummyhashfordummyuserprotection';
    const hashToCompare = user?.password || dummyHash;

    // Проверка пароля (всегда выполняется для защиты от timing attacks)
    const isPasswordValid = await bcrypt.compare(password, hashToCompare);

    // Логирование попытки входа
    if (this.auditLogService) {
      await this.auditLogService.create({
        userId: user?.id,
        action: 'login_attempt',
        entityType: 'Auth',
        success: !!(user && isPasswordValid),
        ipAddress,
        userAgent,
      });
    }

    // Проверяем существование пользователя и валидность пароля одновременно
    if (!user || !isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Логирование успешного входа
    if (this.auditLogService) {
      await this.auditLogService.create({
        userId: user.id,
        action: 'login',
        entityType: 'Auth',
        success: true,
        ipAddress,
        userAgent,
      });
    }

    // Генерация JWT токена
    const payload = { sub: user.id, username: user.username, role: user.role };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        isSuperAdmin: user.isSuperAdmin,
      },
    };
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
}

