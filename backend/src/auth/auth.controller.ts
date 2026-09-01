import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    // Временно закрыто. Чтобы открыть: ENABLE_PUBLIC_REGISTRATION=true
    if (process.env.ENABLE_PUBLIC_REGISTRATION !== 'true') {
      throw new ForbiddenException('Регистрация временно отключена');
    }
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    const ipAddress =
      req.ip ||
      (req.headers['x-forwarded-for'] as string) ||
      req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.login(loginDto, ipAddress, userAgent);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@CurrentUser() user: any) {
    return user;
  }
}
