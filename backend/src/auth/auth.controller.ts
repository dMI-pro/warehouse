import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Res,
  ForbiddenException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import {
  REFRESH_COOKIE_NAME,
  clearAuthCookies,
  getCookieFromRequest,
  setAuthCookies,
} from './auth-cookies';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private clientMeta(req: Request) {
    const forwarded = req.headers['x-forwarded-for'];
    const ipAddress =
      req.ip ||
      (typeof forwarded === 'string' ? forwarded : undefined) ||
      req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return { ipAddress, userAgent };
  }

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    if (process.env.ENABLE_PUBLIC_REGISTRATION !== 'true') {
      throw new ForbiddenException('Регистрация временно отключена');
    }
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { ipAddress, userAgent } = this.clientMeta(req);
    const result = await this.authService.login(loginDto, ipAddress, userAgent);
    setAuthCookies(res, result);
    return { user: result.user };
  }

  @Public()
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { ipAddress, userAgent } = this.clientMeta(req);
    const result = await this.authService.refresh(
      getCookieFromRequest(req, REFRESH_COOKIE_NAME),
      ipAddress,
      userAgent,
    );
    setAuthCookies(res, result);
    return { user: result.user };
  }

  @Public()
  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(
      getCookieFromRequest(req, REFRESH_COOKIE_NAME),
    );
    clearAuthCookies(res);
    return { message: 'Logged out' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@CurrentUser() user: any) {
    return user;
  }
}
