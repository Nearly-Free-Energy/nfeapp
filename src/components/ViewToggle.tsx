import type { UsageCalendarView } from '../models/usage';

type ViewToggleProps = {
  value: UsageCalendarView;
  onChange: (next: UsageCalendarView) => void;
};

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div className="toggle" aria-label="Calendar view">
      <button
        type="button"
        className={value === 'week' ? 'toggle__button toggle__button--active' : 'toggle__button'}
        onClick={() => onChange('week')}
      >
        Week
      </button>
      <button
        type="button"
        className={value === 'month' ? 'toggle__button toggle__button--active' : 'toggle__button'}
        onClick={() => onChange('month')}
      >
        Month
      </button>
    </div>
  );
}
