/**
 * Formats a Date object into a human-readable string: "Monday, January 1, 2024"
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Formats a Date object into a short date string: "Jan 1, 2024"
 */
export function formatDateShort(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Returns today's date as a simple ISO date string: "2024-01-01"
 */
export function getTodayString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a date string or Date object into a display-friendly format.
 */
export function formatDisplayDate(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput + 'T00:00:00') : dateInput;
  return formatDate(date);
}

/**
 * Returns true if the given ISO date string is today.
 */
export function isToday(dateString: string): boolean {
  return dateString === getTodayString();
}

/**
 * Returns a relative label for a date string: "Today", "Yesterday", or formatted date.
 */
export function getRelativeLabel(dateString: string): string {
  const today = getTodayString();
  if (dateString === today) return 'Today';

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  if (dateString === yesterdayStr) return 'Yesterday';

  return formatDateShort(new Date(dateString + 'T00:00:00'));
}
