/**
 * Parse filter dates from query strings.
 * - Full ISO (with time/offset) → as-is
 * - Date-only YYYY-MM-DD → inclusive day in Europe/Moscow (app business TZ)
 */
const APP_TIME_ZONE_OFFSET = '+03:00'; // Europe/Moscow, no DST

export function parseQueryDateBound(
  value: string,
  bound: 'start' | 'end',
): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return bound === 'end'
      ? new Date(`${value}T23:59:59.999${APP_TIME_ZONE_OFFSET}`)
      : new Date(`${value}T00:00:00.000${APP_TIME_ZONE_OFFSET}`);
  }
  return new Date(value);
}
