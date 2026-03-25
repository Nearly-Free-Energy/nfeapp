import type { CalendarDay } from '../types';
import { formatUsage, getUsageTier } from '../utils/energy';

type DayCellProps = {
  day: CalendarDay;
  comparisonValues: Array<number | null>;
  variant: 'week' | 'month';
  selected?: boolean;
  onSelect?: (key: string) => void;
};

export function DayCell({ day, comparisonValues, variant, selected = false, onSelect }: DayCellProps) {
  const tier = day.isFuture ? 0 : getUsageTier(day.usageKwh, comparisonValues);
  const classes = [
    'day-cell',
    `day-cell--tier-${tier}`,
    variant === 'month' ? 'day-cell--month' : 'day-cell--week',
    day.isFuture ? 'day-cell--muted' : '',
    day.isCurrentMonth === false ? 'day-cell--outside' : '',
    selected ? 'day-cell--selected' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const label = new Intl.DateTimeFormat('en-US', {
    weekday: variant === 'week' ? 'short' : undefined,
    month: variant === 'week' ? 'short' : undefined,
    day: 'numeric',
  }).format(day.date);

  return (
    <button type="button" className={classes} onClick={() => onSelect?.(day.key)} aria-pressed={selected}>
      <span className="day-cell__date">{variant === 'week' ? label : day.date.getDate()}</span>
      <span className="day-cell__usage">{formatUsage(day.usageKwh)}</span>
      <span className="day-cell__unit">kWh</span>
    </button>
  );
}
