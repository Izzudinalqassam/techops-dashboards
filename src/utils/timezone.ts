/**
 * Timezone utility functions for converting UTC timestamps to UTC+7 (WIB)
 * Western Indonesia Time (WIB) is UTC+7
 */

/**
 * Convert UTC timestamp to WIB (UTC+7)
 * @param utcTimestamp - UTC timestamp string or Date object
 * @returns Date object (still in UTC) to be formatted with Asia/Jakarta timezone
 */
export const convertToWIB = (utcTimestamp: string | Date | null | undefined): Date | null => {
  if (!utcTimestamp) return null;

  const utcDate = typeof utcTimestamp === 'string' ? new Date(utcTimestamp) : utcTimestamp;

  if (isNaN(utcDate.getTime())) return null;

  return utcDate;
};

/**
 * Format timestamp for display in WIB timezone
 * @param utcTimestamp - UTC timestamp string or Date object
 * @param options - Intl.DateTimeFormatOptions for formatting
 * @returns Formatted date string in WIB
 */
export const formatWIBTimestamp = (
  utcTimestamp: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta'
  }
): string => {
  const wibDate = convertToWIB(utcTimestamp);
  if (!wibDate) return 'Never';

  return wibDate.toLocaleString('en-US', options);
};

/**
 * Format date only in WIB timezone
 * @param utcTimestamp - UTC timestamp string or Date object
 * @returns Formatted date string (no time) in WIB
 */
export const formatWIBDate = (utcTimestamp: string | Date | null | undefined): string => {
  const wibDate = convertToWIB(utcTimestamp);
  if (!wibDate) return 'Never';

  return wibDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Jakarta'
  });
};

/**
 * Format relative time (e.g., "2 hours ago") in WIB timezone
 * @param utcTimestamp - UTC timestamp string or Date object
 * @returns Relative time string in WIB
 */
export const formatWIBRelativeTime = (utcTimestamp: string | Date | null | undefined): string => {
  const wibDate = convertToWIB(utcTimestamp);
  if (!wibDate) return 'Never';

  const now = new Date();
  const diffInMs = now.getTime() - wibDate.getTime();

  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);

  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  } else if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks === 1 ? '' : 's'} ago`;
  } else if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`;
  } else {
    return formatWIBDate(utcTimestamp);
  }
};

/**
 * Format full timestamp with relative time in parentheses
 * @param utcTimestamp - UTC timestamp string or Date object
 * @returns Full timestamp with relative time, e.g., "Dec 15, 2023 14:30 WIB (2 hours ago)"
 */
export const formatWIBTimestampWithRelative = (utcTimestamp: string | Date | null | undefined): string => {
  const wibDate = convertToWIB(utcTimestamp);
  if (!wibDate) return 'Never';

  const formatted = formatWIBTimestamp(utcTimestamp);
  const relative = formatWIBRelativeTime(utcTimestamp);

  if (relative === 'Just now') {
    return `${formatted} (${relative})`;
  }

  return `${formatted} (${relative})`;
};

/**
 * Get current WIB timestamp
 * @returns Current date/time in WIB (returns a Date object in UTC, formatting handles timezone)
 */
export const getCurrentWIBTime = (): Date => {
  return new Date(); // UTC Date object, format with 'Asia/Jakarta' when needed
};

/**
 * Convert WIB timestamp to UTC for sending to backend
 * @param wibTimestamp - WIB timestamp (local time interpreted as UTC)
 * @returns UTC timestamp
 */
export const convertWIBToUTC = (wibTimestamp: Date): Date => {
  // Treat the input as WIB-local time and shift it back to UTC
  // But JavaScript Date has no concept of "timezone-aware" input, so this must be done carefully in real-world use
  return new Date(wibTimestamp.getTime() - (7 * 60 * 60 * 1000)); // still needed if input is considered as local WIB
};

/**
 * Format time only in WIB timezone
 * @param utcTimestamp - UTC timestamp string or Date object
 * @returns Formatted time string in WIB (e.g., "14:30 WIB")
 */
export const formatWIBTime = (utcTimestamp: string | Date | null | undefined): string => {
  const wibDate = convertToWIB(utcTimestamp);
  if (!wibDate) return 'Never';

  return wibDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta'
  }) + ' WIB';
};
