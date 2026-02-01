/**
 * Native Date Utilities - Replaces date-fns for zero bundle cost
 * Uses Intl.DateTimeFormat for i18n support (Spanish locale)
 */

const MONTHS_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

const MONTHS_SHORT_ES = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
];

const WEEKDAYS_ES = [
  'domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'
];

/**
 * Parse ISO date string to Date object
 * Replaces: parseISO from date-fns
 */
export function parseDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Check if a date is in the future
 * Replaces: isFuture from date-fns
 */
export function isFuture(date: Date): boolean {
  return date.getTime() > Date.now();
}

/**
 * Check if a date is in the past
 * Replaces: isPast from date-fns
 */
export function isPast(date: Date): boolean {
  return date.getTime() < Date.now();
}

/**
 * Get start of day for a date
 * Replaces: startOfDay from date-fns
 */
export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Check if a date (at start of day) is in the past
 * Useful for "event has passed" checks
 */
export function isDatePast(date: Date): boolean {
  return isPast(startOfDay(date));
}

/**
 * Format day number (1-31)
 * Replaces: format(date, "d") or format(date, "dd")
 */
export function formatDay(date: Date, padded = false): string {
  const day = date.getDate();
  return padded ? day.toString().padStart(2, '0') : day.toString();
}

/**
 * Format month name in Spanish
 * Replaces: format(date, "MMM", { locale: es }) or format(date, "MMMM", { locale: es })
 */
export function formatMonth(date: Date, style: 'short' | 'long' = 'short'): string {
  const monthIndex = date.getMonth();
  return style === 'short' ? MONTHS_SHORT_ES[monthIndex] : MONTHS_ES[monthIndex];
}

/**
 * Format year
 * Replaces: format(date, "yyyy") or format(date, "yy")
 */
export function formatYear(date: Date, short = false): string {
  const year = date.getFullYear();
  return short ? year.toString().slice(-2) : year.toString();
}

/**
 * Format time as HH:mm
 * Replaces: format(date, "HH:mm")
 */
export function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Format weekday in Spanish
 * Replaces: format(date, "EEEE", { locale: es })
 */
export function formatWeekday(date: Date): string {
  return WEEKDAYS_ES[date.getDay()];
}

/**
 * Format date as "d MMM yyyy" (e.g., "15 jun 2025")
 * Replaces: format(date, "d MMM yyyy", { locale: es })
 */
export function formatShortDate(date: Date): string {
  return `${formatDay(date)} ${formatMonth(date)} ${formatYear(date)}`;
}

/**
 * Format date as "d MMMM yyyy" (e.g., "15 junio 2025")
 * Replaces: format(date, "d MMMM yyyy", { locale: es })
 */
export function formatLongDate(date: Date): string {
  return `${formatDay(date)} ${formatMonth(date, 'long')} ${formatYear(date)}`;
}

/**
 * Format date as "EEEE, d MMMM yyyy" (e.g., "viernes, 15 junio 2025")
 * Replaces: format(date, "EEEE, d MMMM yyyy", { locale: es })
 */
export function formatFullDate(date: Date): string {
  return `${formatWeekday(date)}, ${formatDay(date)} ${formatMonth(date, 'long')} ${formatYear(date)}`;
}

/**
 * Check if date string is a placeholder (9999-12-31)
 */
export function isPlaceholderDate(dateStr: string | null | undefined): boolean {
  if (!dateStr) return true;
  return dateStr.startsWith('9999');
}

/**
 * Format date range for festivals (e.g., "2-4 julio 2026")
 * Native replacement for formatFestivalDateRange that used date-fns
 */
export function formatDateRange(startDate: Date, endDate: Date): string {
  const startDay = startDate.getDate();
  const endDay = endDate.getDate();
  const startMonth = MONTHS_ES[startDate.getMonth()];
  const endMonth = MONTHS_ES[endDate.getMonth()];
  const year = startDate.getFullYear();
  
  // Same day
  if (startDay === endDay && startDate.getMonth() === endDate.getMonth()) {
    return `${startDay} ${startMonth} ${year}`;
  }
  
  // Same month
  if (startDate.getMonth() === endDate.getMonth()) {
    return `${startDay}-${endDay} ${startMonth} ${year}`;
  }
  
  // Different months
  return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;
}

/**
 * Format for on-sale badge: "d MMM HH:mmh"
 */
export function formatOnSaleBadge(date: Date): string {
  return `${formatDay(date)} ${formatMonth(date)} ${formatTime(date)}h`;
}
