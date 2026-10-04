import type { CookieOptions, Request, Response } from 'express';

export const ACCESS_COOKIE_NAME = 'access_token';
export const REFRESH_COOKIE_NAME = 'refresh_token';

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function parseDurationToMs(value: string): number {
  const match = /^(\d+)\s*(ms|s|m|h|d)$/i.exec(value.trim());
  if (!match) {
    const asNumber = Number(value);
    if (Number.isFinite(asNumber) && asNumber > 0) {
      return asNumber;
    }
    throw new Error(`Invalid duration: ${value}`);
  }
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return amount * multipliers[unit];
}

export function getAccessCookiePath(): string {
  return process.env.COOKIE_ACCESS_PATH || (isProduction() ? '/api' : '/');
}

export function getRefreshCookiePath(): string {
  return process.env.COOKIE_REFRESH_PATH || (isProduction() ? '/api/auth' : '/auth');
}

export function isCookieSecure(): boolean {
  if (process.env.COOKIE_SECURE === 'true') return true;
  if (process.env.COOKIE_SECURE === 'false') return false;
  return isProduction();
}

export function getCookieSameSite(): CookieOptions['sameSite'] {
  const value = (process.env.COOKIE_SAME_SITE || 'lax').toLowerCase();
  if (value === 'strict' || value === 'none' || value === 'lax') {
    return value;
  }
  return 'lax';
}

function baseCookieOptions(path: string, maxAge?: number): CookieOptions {
  const sameSite = getCookieSameSite();
  const secure = sameSite === 'none' ? true : isCookieSecure();
  return {
    httpOnly: true,
    secure,
    sameSite,
    path,
    maxAge,
  };
}

export function parseCookieHeader(
  header: string | undefined,
): Record<string, string> {
  if (!header) return {};
  const cookies: Record<string, string> = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    const key = part.slice(0, idx).trim();
    const raw = part.slice(idx + 1).trim();
    if (!key) continue;
    try {
      cookies[key] = decodeURIComponent(raw);
    } catch {
      cookies[key] = raw;
    }
  }
  return cookies;
}

export function getCookieFromRequest(
  req: Request | undefined,
  name: string,
): string | null {
  if (!req) return null;
  const cookies = parseCookieHeader(req.headers?.cookie);
  return cookies[name] || null;
}

export function setAuthCookies(
  res: Response,
  tokens: {
    accessToken: string;
    refreshToken: string;
    accessMaxAgeMs: number;
    refreshMaxAgeMs: number;
  },
) {
  res.cookie(
    ACCESS_COOKIE_NAME,
    tokens.accessToken,
    baseCookieOptions(getAccessCookiePath(), tokens.accessMaxAgeMs),
  );
  res.cookie(
    REFRESH_COOKIE_NAME,
    tokens.refreshToken,
    baseCookieOptions(getRefreshCookiePath(), tokens.refreshMaxAgeMs),
  );
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(
    ACCESS_COOKIE_NAME,
    baseCookieOptions(getAccessCookiePath()),
  );
  res.clearCookie(
    REFRESH_COOKIE_NAME,
    baseCookieOptions(getRefreshCookiePath()),
  );
}
