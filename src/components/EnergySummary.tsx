import type { EnergyPeriodSummary } from '../types';
import { describeSummaryDate } from '../utils/energy';

type EnergySummaryProps = {
  summary: EnergyPeriodSummary;
};

export function EnergySummary({ summary }: EnergySummaryProps) {
  return (
    <section className="summary" aria-label="Energy period summary">
      <div className="summary__metric">
        <span className="summary__label">Total usage</span>
        <strong className="summary__value">{summary.totalKwh} kWh</strong>
      </div>
      <div className="summary__metric">
        <span className="summary__label">Daily average</span>
        <strong className="summary__value">{summary.averageDailyKwh} kWh</strong>
      </div>
      <div className="summary__metric">
        <span className="summary__label">Peak day</span>
        <strong className="summary__value">{describeSummaryDate(summary.highestUsageDay)}</strong>
      </div>
      <div className="summary__metric">
        <span className="summary__label">Lowest day</span>
        <strong className="summary__value">{describeSummaryDate(summary.lowestUsageDay)}</strong>
      </div>
    </section>
  );
}
