import { addMonths, formatIsoDate, formatWeekRange, parseIsoDate } from './date';
import { buildEnergyLookup, getMonthDays, getWeekDays } from './energy';
import type { EnergyDay } from '../types';

describe('calendar date helpers', () => {
  const sampleData: EnergyDay[] = Array.from({ length: 80 }, (_, index) => {
    const date = new Date(2026, 1, 1 + index);
    return {
      date: formatIsoDate(date),
      usageKwh: index,
      isFuture: false,
    };
  });

  const lookup = buildEnergyLookup(sampleData);
  const today = parseIsoDate('2026-04-30');

  it('builds a seven-day week', () => {
    const days = getWeekDays(parseIsoDate('2026-03-22'), lookup, today);
    expect(days).toHaveLength(7);
    expect(days[0].key).toBe('2026-03-22');
    expect(days[6].key).toBe('2026-03-28');
  });

  it('builds a six-row month when needed', () => {
    const days = getMonthDays(parseIsoDate('2026-03-10'), lookup, today);
    expect(days).toHaveLength(35);

    const juneDays = getMonthDays(parseIsoDate('2026-08-10'), lookup, today);
    expect(juneDays).toHaveLength(42);
  });

  it('advances by one month cleanly', () => {
    const next = addMonths(parseIsoDate('2026-03-22'), 1);
    expect(formatIsoDate(next)).toBe('2026-04-01');
  });

  it('formats cross-month week ranges', () => {
    expect(formatWeekRange(parseIsoDate('2026-03-29'), parseIsoDate('2026-04-04'))).toBe('Mar 29 - Apr 4');
  });
});
