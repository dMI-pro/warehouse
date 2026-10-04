/**
 * App business timezone for filters and date display.
 * Audit log UI already formats in Moscow; filters must use the same zone.
 */
export const APP_TIME_ZONE = 'Europe/Moscow';

export type ApiDateRangeParams = {
  startDate?: string;
  endDate?: string;
};

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function toValidDate(value: Date | string | number | null | undefined): Date | null {
  if (value == null || value === '') return null;
  const d = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Calendar day parts as the user picked them (y/m/d from the Date picker). */
function getPickerCalendarDay(date: Date): { year: number; month: number; day: number } {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

/**
 * Offset string (e.g. +03:00) of `timeZone` at the given UTC instant.
 */
function getTimeZoneOffsetString(utcDate: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'shortOffset',
    hour: '2-digit',
  }).formatToParts(utcDate);
  const raw = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
  // "GMT+3" | "GMT+03:00" | "GMT"
  if (raw === 'GMT' || raw === 'UTC') return '+00:00';
  const m = raw.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/);
  if (!m) return '+00:00';
  const sign = m[1];
  const hh = pad2(Number(m[2]));
  const mm = pad2(Number(m[3] || '0'));
  return `${sign}${hh}:${mm}`;
}

/**
 * Build an absolute ISO instant for y-m-d h:m:s.ms in `timeZone`.
 */
function zonedTimeToIso(
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number,
  seconds: number,
  ms: number,
  timeZone: string,
): string {
  // First guess: treat components as UTC, then adjust by real zone offset.
  let utc = Date.UTC(year, month - 1, day, hours, minutes, seconds, ms);
  for (let i = 0; i < 3; i++) {
    const offset = getTimeZoneOffsetString(new Date(utc), timeZone);
    const sign = offset.startsWith('-') ? -1 : 1;
    const [oh, om] = offset.slice(1).split(':').map(Number);
    const offsetMs = sign * ((oh || 0) * 3600 + (om || 0) * 60) * 1000;
    utc = Date.UTC(year, month - 1, day, hours, minutes, seconds, ms) - offsetMs;
  }
  const offset = getTimeZoneOffsetString(new Date(utc), timeZone);
  return `${year}-${pad2(month)}-${pad2(day)}T${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}.${String(ms).padStart(3, '0')}${offset}`;
}

/** Picked calendar day → start of that day in APP_TIME_ZONE. */
export function toApiDayStart(date: Date | string, timeZone = APP_TIME_ZONE): string {
  const d = toValidDate(date);
  if (!d) throw new Error('Некорректная дата начала');
  const { year, month, day } = getPickerCalendarDay(d);
  return zonedTimeToIso(year, month, day, 0, 0, 0, 0, timeZone);
}

/** Picked calendar day → end of that day in APP_TIME_ZONE. */
export function toApiDayEnd(date: Date | string, timeZone = APP_TIME_ZONE): string {
  const d = toValidDate(date);
  if (!d) throw new Error('Некорректная дата окончания');
  const { year, month, day } = getPickerCalendarDay(d);
  return zonedTimeToIso(year, month, day, 23, 59, 59, 999, timeZone);
}

/** Build query params for list/report endpoints. */
export function buildApiDateRangeParams(
  startDate?: Date | string | null,
  endDate?: Date | string | null,
  timeZone = APP_TIME_ZONE,
): ApiDateRangeParams {
  const params: ApiDateRangeParams = {};
  const start = toValidDate(startDate ?? null);
  const end = toValidDate(endDate ?? null);
  if (start) params.startDate = toApiDayStart(start, timeZone);
  if (end) params.endDate = toApiDayEnd(end, timeZone);
  return params;
}

/**
 * @returns error message or null if valid
 */
export function validateDateRange(
  startDate?: Date | string | null,
  endDate?: Date | string | null,
  maxDays = 365,
): string | null {
  const start = toValidDate(startDate ?? null);
  const end = toValidDate(endDate ?? null);
  if (!start || !end) return null;

  const s = getPickerCalendarDay(start);
  const e = getPickerCalendarDay(end);
  const startUtc = Date.UTC(s.year, s.month - 1, s.day);
  const endUtc = Date.UTC(e.year, e.month - 1, e.day);

  if (startUtc > endUtc) {
    return 'Дата начала не может быть позже даты окончания';
  }

  const diffDays = Math.round((endUtc - startUtc) / (1000 * 60 * 60 * 24));
  if (diffDays > maxDays) {
    return `Диапазон не должен превышать ${maxDays} дн.`;
  }

  return null;
}

/** Format instant for UI in the app business timezone. */
export function formatAppDateTime(dateString: string | Date): string {
  const d = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: APP_TIME_ZONE,
  });
}

export function formatAppDate(dateString: string | Date): string {
  const d = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: APP_TIME_ZONE,
  });
}
