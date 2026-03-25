import type { CalendarDay } from '../types';
import { WEEKDAY_LABELS } from '../utils/date';
import { DayCell } from './DayCell';

type WeeklyCalendarProps = {
  days: CalendarDay[];
  selectedKey?: string;
  onSelect?: (key: string) => void;
};

export function WeeklyCalendar({ days, selectedKey, onSelect }: WeeklyCalendarProps) {
  const values = days.map((day) => day.usageKwh);

  return (
    <section className="calendar-block" aria-label="Weekly energy usage">
      <div className="weekday-row weekday-row--week">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className="weekday-row__label">
            {label}
          </span>
        ))}
      </div>
      <div className="week-grid">
        {days.map((day) => (
          <DayCell
            key={day.key}
            day={day}
            comparisonValues={values}
            variant="week"
            selected={selectedKey === day.key}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  );
}
