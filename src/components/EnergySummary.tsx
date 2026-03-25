import type { EnergyPeriodSummary } from '../types';

type EnergySummaryProps = {
  summary: Pick<EnergyPeriodSummary, 'totalKwh' | 'averageDailyKwh'>;
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
    </section>
  );
}
