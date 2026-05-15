import { formatUgxAmount } from '../utils/usage';
import type { UsagePeriodSummary } from '../models/usage';

type UsageSummaryProps = {
  summary: Pick<UsagePeriodSummary, 'totalUsage' | 'currentUsageCashUgx' | 'estimatedMonthlyBillUgx' | 'unit'>;
};

export function UsageSummary({ summary }: UsageSummaryProps) {
  return (
    <section className="summary" aria-label="Usage period summary">
      <div className="summary__metric">
        <span className="summary__label">Current Usage Units</span>
        <strong className="summary__value">
          {summary.totalUsage} {summary.unit}
        </strong>
      </div>
      <div className="summary__metric">
        <span className="summary__label">Current Bill</span>
        <strong className="summary__value">UGX {formatUgxAmount(summary.currentUsageCashUgx)}</strong>
      </div>
      <div className="summary__metric">
        <span className="summary__label">Estimated End of Month Bill</span>
        <strong className="summary__value">UGX {formatUgxAmount(summary.estimatedMonthlyBillUgx)}</strong>
      </div>
    </section>
  );
}
