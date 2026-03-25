import type { CalendarDay, EnergyDay, EnergyPeriodSummary } from '../types';
import { eachDayOfInterval, endOfMonth, endOfWeek, formatIsoDate, parseIsoDate, startOfMonth, startOfWeek } from './date';

export function buildEnergyLookup(days: EnergyDay[]): Map<string, EnergyDay> {
  return new Map(days.map((day) => [day.date, day]));
}

export function createCalendarDay(date: Date, lookup: Map<string, EnergyDay>, today: Date): CalendarDay {
  const key = formatIsoDate(date);
  const match = lookup.get(key);
  return {
    date,
    key,
    usageKwh: match?.usageKwh ?? null,
    isFuture: match?.isFuture ?? date.getTime() > today.getTime(),
  };
}

export function getWeekDays(anchorDate: Date, lookup: Map<string, EnergyDay>, today: Date): CalendarDay[] {
  const start = startOfWeek(anchorDate);
  const end = endOfWeek(anchorDate);
  return eachDayOfInterval(start, end).map((day) => createCalendarDay(day, lookup, today));
}

export function getMonthDays(anchorDate: Date, lookup: Map<string, EnergyDay>, today: Date): CalendarDay[] {
  const monthStart = startOfMonth(anchorDate);
  const monthEnd = endOfMonth(anchorDate);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);

  return eachDayOfInterval(gridStart, gridEnd).map((day) => ({
    ...createCalendarDay(day, lookup, today),
    isCurrentMonth: day.getMonth() === anchorDate.getMonth(),
  }));
}

export function summarizePeriod(days: CalendarDay[]): EnergyPeriodSummary {
  const measuredDays = days.filter((day) => day.usageKwh !== null && !day.isFuture);
  const totalKwh = measuredDays.reduce((sum, day) => sum + (day.usageKwh ?? 0), 0);
  const averageDailyKwh = measuredDays.length > 0 ? totalKwh / measuredDays.length : 0;

  const sorted = [...measuredDays].sort((left, right) => (left.usageKwh ?? 0) - (right.usageKwh ?? 0));

  return {
    totalKwh: roundToOne(totalKwh),
    averageDailyKwh: roundToOne(averageDailyKwh),
    lowestUsageDay: sorted[0]?.key,
    highestUsageDay: sorted[sorted.length - 1]?.key,
  };
}

export function getUsageTier(usageKwh: number | null, values: Array<number | null>): number {
  if (usageKwh === null) {
    return 0;
  }

  const measured = values.filter((value): value is number => value !== null);
  if (measured.length === 0) {
    return 1;
  }

  const max = Math.max(...measured);
  const min = Math.min(...measured);
  if (max === min) {
    return 2;
  }

  const ratio = (usageKwh - min) / (max - min);
  if (ratio < 0.2) return 1;
  if (ratio < 0.45) return 2;
  if (ratio < 0.7) return 3;
  return 4;
}

export function formatUsage(usageKwh: number | null): string {
  if (usageKwh === null) {
    return '--';
  }

  return Number.isInteger(usageKwh) ? `${usageKwh}` : usageKwh.toFixed(1);
}

export function describeSummaryDate(value?: string): string {
  if (!value) {
    return '--';
  }

  const date = parseIsoDate(value);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function roundToOne(value: number): number {
  return Math.round(value * 10) / 10;
}
