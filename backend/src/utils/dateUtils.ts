import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isWeekend } from 'date-fns';

export const TIMEZONE = 'Asia/Kolkata';

/**
 * Get current date string formatted as YYYY-MM-DD in Asia/Kolkata
 */
export function getTodayKolkataString(date: Date = new Date()): string {
  // Use Intl to format properly into Asia/Kolkata
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(date); // outputs YYYY-MM-DD
}

/**
 * Format any date object or ISO string to YYYY-MM-DD in Kolkata timezone
 */
export function formatDateKolkata(dateInput: Date | string): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(date);
}

/**
 * Get current time string in 12-hour format: hh:mm AM/PM in Kolkata
 */
export function getTimeKolkataString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(date);
}

/**
 * Calculate working hours between checkIn and checkOut
 */
export function calculateWorkingHours(checkIn: Date, checkOut?: Date | null): number {
  if (!checkOut) return 0;
  const diffMs = checkOut.getTime() - checkIn.getTime();
  if (diffMs <= 0) return 0;
  const hours = diffMs / (1000 * 60 * 60);
  return Math.round(hours * 100) / 100;
}

/**
 * Get all dates of a given year and month (1-based month: 1 = Jan, 12 = Dec)
 */
export function getMonthDates(year: number, month: number): Array<{
  dateString: string;
  dayNumber: number;
  dayName: string;
  isSunday: boolean;
  isSaturday: boolean;
}> {
  // Month is 0-indexed in Date constructor
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const lastDay = new Date(Date.UTC(year, month, 0));
  const totalDays = lastDay.getUTCDate();

  const days: Array<{
    dateString: string;
    dayNumber: number;
    dayName: string;
    isSunday: boolean;
    isSaturday: boolean;
  }> = [];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let d = 1; d <= totalDays; d++) {
    const curDate = new Date(Date.UTC(year, month - 1, d));
    const padMonth = String(month).padStart(2, '0');
    const padDay = String(d).padStart(2, '0');
    const dayOfWeek = curDate.getUTCDay();

    days.push({
      dateString: `${year}-${padMonth}-${padDay}`,
      dayNumber: d,
      dayName: dayNames[dayOfWeek],
      isSunday: dayOfWeek === 0,
      isSaturday: dayOfWeek === 6
    });
  }

  return days;
}

