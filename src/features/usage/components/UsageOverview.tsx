import { useState } from 'react';
import { BottomControlTray } from '../../../components/BottomControlTray';
import { UsageSummary } from '../../../components/UsageSummary';
import { MonthlyCalendar } from '../../../components/MonthlyCalendar';
import { WeeklyCalendar } from '../../../components/WeeklyCalendar';
import { MOCK_TODAY, MOCK_USAGE_POINTS } from '../../../data/mockUsage';
import type { UsageCalendarView } from '../../../models/usage';
import { addDays, addMonths, endOfWeek, formatMonthYear, formatWeekRange, parseIsoDate, startOfWeek } from '../../../utils/date';
import { buildUsageLookup, getMonthDays, getWeekDays, summarizePeriod } from '../../../utils/usage';

const INITIAL_ANCHOR_DATE = parseIsoDate('2026-03-22');

export function UsageOverview() {
  const [view, setView] = useState<UsageCalendarView>('week');
  const [anchorDate, setAnchorDate] = useState<Date>(INITIAL_ANCHOR_DATE);
  const [selectedDayKey, setSelectedDayKey] = useState<string | undefined>(undefined);

  const usageLookup = buildUsageLookup(MOCK_USAGE_POINTS);
  const fallbackUnit = MOCK_USAGE_POINTS[0]?.unit ?? 'kWh';
  const weekDays = getWeekDays(anchorDate, usageLookup, MOCK_TODAY, fallbackUnit);
  const monthDays = getMonthDays(anchorDate, usageLookup, MOCK_TODAY, fallbackUnit);
  const visibleDays = view === 'week' ? weekDays : monthDays.filter((day) => day.isCurrentMonth);
  const summary = summarizePeriod(visibleDays);
  const periodLabel =
    view === 'week' ? formatWeekRange(startOfWeek(anchorDate), endOfWeek(anchorDate)) : formatMonthYear(anchorDate);

  function handleNavigate(step: -1 | 1) {
    setSelectedDayKey(undefined);
    setAnchorDate((current) => (view === 'week' ? addDays(current, step * 7) : addMonths(current, step)));
  }

  return (
    <>
      <UsageSummary summary={summary} />

      {view === 'week' ? (
        <WeeklyCalendar days={weekDays} selectedKey={selectedDayKey} onSelect={setSelectedDayKey} />
      ) : (
        <MonthlyCalendar days={monthDays} selectedKey={selectedDayKey} onSelect={setSelectedDayKey} />
      )}

      <BottomControlTray
        label={periodLabel}
        view={view}
        onPrevious={() => handleNavigate(-1)}
        onNext={() => handleNavigate(1)}
        onChangeView={setView}
      />
    </>
  );
}
