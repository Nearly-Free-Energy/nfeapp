const DAY_MS = 24 * 60 * 60 * 1000;

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, amount: number): Date {
  const next = startOfDay(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function startOfWeek(date: Date): Date {
  return addDays(date, -startOfDay(date).getDay());
}

export function endOfWeek(date: Date): Date {
  return addDays(startOfWeek(date), 6);
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function eachDayOfInterval(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  let current = startOfDay(start);

  while (current.getTime() <= end.getTime()) {
    days.push(current);
    current = addDays(current, 1);
  }

  return days;
}

export function formatShortMonth(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
}

export function formatMonthYear(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(date);
}

export function formatWeekRange(start: Date, end: Date): string {
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  if (sameMonth) {
    return `${formatShortMonth(start)} ${start.getDate()} - ${end.getDate()}`;
  }

  const startLabel = `${formatShortMonth(start)} ${start.getDate()}`;
  const endLabel = `${formatShortMonth(end)} ${end.getDate()}`;
  return `${startLabel} - ${endLabel}`;
}

export function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function isSameDay(left: Date, right: Date): boolean {
  return startOfDay(left).getTime() === startOfDay(right).getTime();
}

export function diffInDays(left: Date, right: Date): number {
  return Math.round((startOfDay(left).getTime() - startOfDay(right).getTime()) / DAY_MS);
}
