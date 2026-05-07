import { describe, expect, it } from 'vitest';
import type { UsagePoint } from '../models/usage';
import { calculateEstimatedMonthlyBillUgx, summarizePeriod } from './usage';

function buildPoint(date: string, usageValue: number | null, isFuture = false): UsagePoint {
  return {
    date,
    usageValue,
    unit: 'kWh',
    isFuture,
  };
}

describe('usage billing helpers', () => {
  it('includes service charge and VAT when there is no current-month usage', () => {
    expect(calculateEstimatedMonthlyBillUgx([], new Date(2026, 4, 6))).toBe(6278);
  });

  it('prices the first 15 kWh at the first tier', () => {
    expect(calculateEstimatedMonthlyBillUgx([buildPoint('2026-05-01', 15)], new Date(2026, 4, 6))).toBe(10703);
  });

  it('prices the next 65 kWh at the second tier', () => {
    expect(calculateEstimatedMonthlyBillUgx([buildPoint('2026-05-01', 80)], new Date(2026, 4, 6))).toBe(68703);
  });

  it('prices the next 70 kWh at the third tier and anything above 150 at the top tier', () => {
    expect(calculateEstimatedMonthlyBillUgx([buildPoint('2026-05-01', 150)], new Date(2026, 4, 6))).toBe(102734);
    expect(calculateEstimatedMonthlyBillUgx([buildPoint('2026-05-01', 151)], new Date(2026, 4, 6))).toBe(103627);
  });

  it('uses only actual usage from the current month and excludes future or prior-month points', () => {
    const points = [
      buildPoint('2026-04-30', 40),
      buildPoint('2026-05-01', 10),
      buildPoint('2026-05-02', 5),
      buildPoint('2026-05-20', 100, true),
      buildPoint('2026-05-04', null),
    ];

    expect(calculateEstimatedMonthlyBillUgx(points, new Date(2026, 4, 6))).toBe(10703);
  });

  it('adds the estimated monthly bill to the usage summary', () => {
    const summary = summarizePeriod(
      [
        {
          date: new Date(2026, 4, 1),
          key: '2026-05-01',
          usageValue: 10,
          unit: 'kWh',
          isFuture: false,
        },
        {
          date: new Date(2026, 4, 2),
          key: '2026-05-02',
          usageValue: 5,
          unit: 'kWh',
          isFuture: false,
        },
      ],
      [buildPoint('2026-05-01', 10), buildPoint('2026-05-02', 5)],
      new Date(2026, 4, 6),
    );

    expect(summary.estimatedMonthlyBillUgx).toBe(10703);
  });
});
