export type UsageCalendarView = 'week' | 'month';

export type UsageUnit = 'kWh' | 'gallons' | 'therms';

export type UsagePoint = {
  date: string;
  usageValue: number | null;
  unit: UsageUnit;
  isFuture?: boolean;
};

export type UsagePeriodSummary = {
  totalUsage: number;
  averageDailyUsage: number;
  unit: UsageUnit;
  highestUsageDay?: string;
  lowestUsageDay?: string;
};

export type UsageCalendarDay = {
  date: Date;
  key: string;
  usageValue: number | null;
  unit: UsageUnit;
  isFuture: boolean;
  isCurrentMonth?: boolean;
};
