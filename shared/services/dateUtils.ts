/**
 * QueueLess Date and Time Utilities
 */

/**
 * Formats a JavaScript Date or timestamp into standard YYYY-MM-DD.
 */
export function formatDateISO(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Formats a JavaScript Date into 24-hour HH:mm.
 */
export function formatTime24(date: Date = new Date()): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Parses "HH:mm" into minutes from start of day.
 */
export function timeStringToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

/**
 * Converts minutes from start of day back to "HH:mm".
 */
export function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Calculates minute difference between two ISO timestamps.
 */
export function diffMinutes(dateA: string | Date, dateB: string | Date): number {
  const a = typeof dateA === 'string' ? new Date(dateA) : dateA;
  const b = typeof dateB === 'string' ? new Date(dateB) : dateB;
  return Math.round((a.getTime() - b.getTime()) / (60 * 1000));
}

/**
 * Checks if a given time is within an operating interval.
 */
export function isWithinInterval(timeStr: string, openStr: string, closeStr: string): boolean {
  const t = timeStringToMinutes(timeStr);
  const open = timeStringToMinutes(openStr);
  const close = timeStringToMinutes(closeStr);
  return t >= open && t <= close;
}
