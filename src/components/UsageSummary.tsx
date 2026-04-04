import type { UsagePeriodSummary } from '../models/usage';

type UsageSummaryProps = {
  summary: Pick<UsagePeriodSummary, 'totalUsage' | 'averageDailyUsage' | 'unit'>;
};

export function UsageSummary({ summary }: UsageSummaryProps) {
  return (
    <section className="summary" aria-label="Usage period summary">
      <div className="summary__metric">
        <span className="summary__label">Total usage</span>
        <strong className="summary__value">
          {summary.totalUsage} {summary.unit}
        </strong>
      </div>
      <div className="summary__metric">
        <span className="summary__label">Daily average</span>
        <strong className="summary__value">
          {summary.averageDailyUsage} {summary.unit}
        </strong>
      </div>
    </section>
  );
}
