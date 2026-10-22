import { DateTime } from 'luxon';

export const toUtcIsoFromLocal = (localIso: string, timezone: string): string => {
  return DateTime.fromISO(localIso, { zone: timezone }).toUTC().toISO() ?? '';
};

export const toLocalFromUtc = (utcIso: string, timezone: string): string => {
  return DateTime.fromISO(utcIso, { zone: 'utc' })
    .setZone(timezone)
    .toISO({ suppressSeconds: true, suppressMilliseconds: true, includeOffset: false }) ?? '';
};

export const formatLocal = (utcIso: string, timezone: string): string => {
  return DateTime.fromISO(utcIso, { zone: 'utc' }).setZone(timezone).toFormat('yyyy-LL-dd HH:mm');
};
