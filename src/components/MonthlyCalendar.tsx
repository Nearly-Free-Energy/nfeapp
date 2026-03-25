import type { CalendarDay } from '../types';
import { WEEKDAY_LABELS } from '../utils/date';
import { DayCell } from './DayCell';

type MonthlyCalendarProps = {
  days: CalendarDay[];
  selectedKey?: string;
  onSelect?: (key: string) => void;
};

export function MonthlyCalendar({ days, selectedKey, onSelect }: MonthlyCalendarProps) {
  const values = days.filter((day) => day.isCurrentMonth).map((day) => day.usageKwh);

  return (
    <section className="calendar-block" aria-label="Monthly energy usage">
      <div className="weekday-row">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className="weekday-row__label">
            {label}
          </span>
        ))}
      </div>
      <div className="month-grid">
        {days.map((day) => (
          <DayCell
            key={day.key}
            day={day}
            comparisonValues={values}
            variant="month"
            selected={selectedKey === day.key}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  );
}
