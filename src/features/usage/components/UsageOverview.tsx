import { useEffect, useState } from 'react';
import { getUsage } from '../../../api';
import { BottomControlTray } from '../../../components/BottomControlTray';
import { UsageSummary } from '../../../components/UsageSummary';
import { MonthlyCalendar } from '../../../components/MonthlyCalendar';
import { WeeklyCalendar } from '../../../components/WeeklyCalendar';
import type { UsageApiResponse, UsageCalendarDay, UsageCalendarView } from '../../../models/usage';
import { SelectedUsagePanel } from './SelectedUsagePanel';
import { addDays, addMonths, endOfWeek, formatMonthYear, formatWeekRange, parseIsoDate, startOfWeek } from '../../../utils/date';
import { buildUsageLookup, getMonthDays, getWeekDays, summarizePeriod } from '../../../utils/usage';

const INITIAL_ANCHOR_DATE = parseIsoDate('2026-03-22');

type UsageOverviewProps = {
  accessToken: string;
};

export function UsageOverview({ accessToken }: UsageOverviewProps) {
  const [view, setView] = useState<UsageCalendarView>('week');
  const [anchorDate, setAnchorDate] = useState<Date>(INITIAL_ANCHOR_DATE);
  const [selectedDayKey, setSelectedDayKey] = useState<string | undefined>(undefined);
  const [usageData, setUsageData] = useState<UsageApiResponse | null>(null);
  const [usageError, setUsageError] = useState<string | null>(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadUsage() {
      setIsLoadingUsage(true);
      setUsageError(null);

      try {
        const nextUsage = await getUsage(accessToken);
        if (!isMounted) {
          return;
        }

        setUsageData(nextUsage);
        setAnchorDate(parseIsoDate(nextUsage.today));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message = error instanceof Error ? error.message : 'Unable to load usage.';
        setUsageError(message);
      } finally {
        if (isMounted) {
          setIsLoadingUsage(false);
        }
      }
    }

    void loadUsage();

    return () => {
      isMounted = false;
    };
  }, [accessToken]);

  const usagePoints = usageData?.points ?? [];
  const usageLookup = buildUsageLookup(usagePoints);
  const fallbackUnit = usageData?.unit ?? 'kWh';
  const usageToday = parseIsoDate(usageData?.today ?? '2026-03-25');
  const weekDays = getWeekDays(anchorDate, usageLookup, usageToday, fallbackUnit);
  const monthDays = getMonthDays(anchorDate, usageLookup, usageToday, fallbackUnit);
  const visibleDays = view === 'week' ? weekDays : monthDays.filter((day) => day.isCurrentMonth);
  const summary = summarizePeriod(visibleDays);
  const selectedDay = visibleDays.find((day) => day.key === selectedDayKey) ?? findDefaultSelectedDay(visibleDays, anchorDate);
  const periodLabel =
    view === 'week' ? formatWeekRange(startOfWeek(anchorDate), endOfWeek(anchorDate)) : formatMonthYear(anchorDate);

  function handleNavigate(step: -1 | 1) {
    setSelectedDayKey(undefined);
    setAnchorDate((current) => (view === 'week' ? addDays(current, step * 7) : addMonths(current, step)));
  }

  return (
    <>
      {isLoadingUsage ? <p className="usage-status-message">Loading usage history...</p> : null}
      {usageError ? <p className="usage-status-message" role="alert">{usageError}</p> : null}
      {usageData?.source === 'seeded-demo' ? (
        <p className="usage-status-message">
          Showing seeded platform demo data from the backend until telemetry-backed usage snapshots are available.
        </p>
      ) : null}

      <UsageSummary summary={summary} />

      {view === 'week' ? (
        <WeeklyCalendar days={weekDays} selectedKey={selectedDayKey} onSelect={setSelectedDayKey} />
      ) : (
        <MonthlyCalendar days={monthDays} selectedKey={selectedDayKey} onSelect={setSelectedDayKey} />
      )}

      <SelectedUsagePanel day={selectedDay} />

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

function findDefaultSelectedDay(days: UsageCalendarDay[], anchorDate: Date) {
  const currentMonthDay = days.find((day) => day.date.getDate() === anchorDate.getDate() && !day.isFuture);
  if (currentMonthDay) {
    return currentMonthDay;
  }

  const firstMeasuredDay = days.find((day) => day.usageValue !== null && !day.isFuture);
  if (firstMeasuredDay) {
    return firstMeasuredDay;
  }

  return days[0];
}
