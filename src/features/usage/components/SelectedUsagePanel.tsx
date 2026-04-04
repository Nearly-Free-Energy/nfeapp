import type { UsageCalendarDay } from '../../../models/usage';
import { formatUsageValue } from '../../../utils/usage';

type SelectedUsagePanelProps = {
  day: UsageCalendarDay;
};

export function SelectedUsagePanel({ day }: SelectedUsagePanelProps) {
  const dateLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(day.date);

  const statusLabel = day.isFuture
    ? 'Projected day'
    : day.usageValue === null
      ? 'No usage reading yet'
      : 'Recorded usage';

  return (
    <section className="selected-usage-panel" aria-label="Selected day summary">
      <div>
        <span className="selected-usage-panel__eyebrow">Selected day</span>
        <h2 className="selected-usage-panel__title">{dateLabel}</h2>
        <p className="selected-usage-panel__status">{statusLabel}</p>
      </div>

      <div className="selected-usage-panel__reading">
        <strong className="selected-usage-panel__value">{formatUsageValue(day.usageValue)}</strong>
        <span className="selected-usage-panel__unit">{day.unit}</span>
      </div>
    </section>
  );
}
