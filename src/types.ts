export type EnergyCalendarView = 'week' | 'month';

export type EnergyDay = {
  date: string;
  usageKwh: number | null;
  isFuture?: boolean;
};

export type EnergyPeriodSummary = {
  totalKwh: number;
  averageDailyKwh: number;
  highestUsageDay?: string;
  lowestUsageDay?: string;
};

export type CalendarDay = {
  date: Date;
  key: string;
  usageKwh: number | null;
  isFuture: boolean;
  isCurrentMonth?: boolean;
};
