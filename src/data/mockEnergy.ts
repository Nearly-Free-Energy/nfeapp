import type { EnergyDay } from '../types';
import { addDays, formatIsoDate, startOfDay } from '../utils/date';

const BASE_USAGE = [
  28, 24, 22, 20, 19, 18, 23, 26, 30, 31, 27, 25, 24, 21, 18, 17, 20, 29, 34, 37, 32, 26,
  24, 22, 19, 21, 25, 28, 35, 39, 33, 29, 26, 23, 22, 20, 18, 19, 24, 30, 38, 41, 36, 31,
  27, 24, 22, 21, 20, 23, 27, 31, 34, 40, 42, 37, 32, 28, 25, 24, 26, 29, 33, 36, 39, 35,
  30, 27, 22, 20, 18, 17, 19, 21, 28, 32, 34, 38, 36, 31, 29, 26, 24, 22, 21, 20, 23, 25,
  27, 33, 37, 40,
];

export const MOCK_TODAY = startOfDay(new Date(2026, 2, 25));

export const MOCK_ENERGY_DAYS: EnergyDay[] = BASE_USAGE.map((usage, index) => {
  const date = addDays(new Date(2026, 0, 1), index);
  return {
    date: formatIsoDate(date),
    usageKwh: usage,
    isFuture: date.getTime() > MOCK_TODAY.getTime(),
  };
});
