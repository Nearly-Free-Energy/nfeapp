import type { UsageCalendarDay, UsagePeriodSummary, UsagePoint, UsageUnit } from '../models/usage';
import { eachDayOfInterval, endOfMonth, endOfWeek, formatIsoDate, parseIsoDate, startOfMonth, startOfWeek } from './date';

export function buildUsageLookup(days: UsagePoint[]): Map<string, UsagePoint> {
  return new Map(days.map((day) => [day.date, day]));
}

export function createCalendarDay(
  date: Date,
  lookup: Map<string, UsagePoint>,
  today: Date,
  fallbackUnit: UsageUnit,
): UsageCalendarDay {
  const key = formatIsoDate(date);
  const match = lookup.get(key);

  return {
    date,
    key,
    usageValue: match?.usageValue ?? null,
    unit: match?.unit ?? fallbackUnit,
    isFuture: match?.isFuture ?? date.getTime() > today.getTime(),
  };
}

export function getWeekDays(
  anchorDate: Date,
  lookup: Map<string, UsagePoint>,
  today: Date,
  fallbackUnit: UsageUnit,
): UsageCalendarDay[] {
  const start = startOfWeek(anchorDate);
  const end = endOfWeek(anchorDate);
  return eachDayOfInterval(start, end).map((day) => createCalendarDay(day, lookup, today, fallbackUnit));
}

export function getMonthDays(
  anchorDate: Date,
  lookup: Map<string, UsagePoint>,
  today: Date,
  fallbackUnit: UsageUnit,
): UsageCalendarDay[] {
  const monthStart = startOfMonth(anchorDate);
  const monthEnd = endOfMonth(anchorDate);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);

  return eachDayOfInterval(gridStart, gridEnd).map((day) => ({
    ...createCalendarDay(day, lookup, today, fallbackUnit),
    isCurrentMonth: day.getMonth() === anchorDate.getMonth(),
  }));
}

export function summarizePeriod(days: UsageCalendarDay[]): UsagePeriodSummary {
  const measuredDays = days.filter((day) => day.usageValue !== null && !day.isFuture);
  const unit = measuredDays[0]?.unit ?? days[0]?.unit ?? 'kWh';
  const totalUsage = measuredDays.reduce((sum, day) => sum + (day.usageValue ?? 0), 0);
  const averageDailyUsage = measuredDays.length > 0 ? totalUsage / measuredDays.length : 0;

  const sorted = [...measuredDays].sort((left, right) => (left.usageValue ?? 0) - (right.usageValue ?? 0));

  return {
    totalUsage: roundToOne(totalUsage),
    averageDailyUsage: roundToOne(averageDailyUsage),
    unit,
    lowestUsageDay: sorted[0]?.key,
    highestUsageDay: sorted[sorted.length - 1]?.key,
  };
}

export function getUsageTier(usageValue: number | null, values: Array<number | null>): number {
  if (usageValue === null) {
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

  const ratio = (usageValue - min) / (max - min);
  if (ratio < 0.2) return 1;
  if (ratio < 0.45) return 2;
  if (ratio < 0.7) return 3;
  return 4;
}

export function formatUsageValue(usageValue: number | null): string {
  if (usageValue === null) {
    return '--';
  }

  return Number.isInteger(usageValue) ? `${usageValue}` : usageValue.toFixed(1);
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
