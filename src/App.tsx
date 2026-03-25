import { useState } from 'react';
import { EnergySummary } from './components/EnergySummary';
import { MonthlyCalendar } from './components/MonthlyCalendar';
import { PeriodNavigator } from './components/PeriodNavigator';
import { ViewToggle } from './components/ViewToggle';
import { WeeklyCalendar } from './components/WeeklyCalendar';
import { MOCK_ENERGY_DAYS, MOCK_TODAY } from './data/mockEnergy';
import type { EnergyCalendarView } from './types';
import { addDays, addMonths, endOfWeek, formatMonthYear, formatWeekRange, parseIsoDate, startOfWeek } from './utils/date';
import { buildEnergyLookup, getMonthDays, getWeekDays, summarizePeriod } from './utils/energy';

const INITIAL_ANCHOR_DATE = parseIsoDate('2026-03-22');

function App() {
  const [view, setView] = useState<EnergyCalendarView>('week');
  const [anchorDate, setAnchorDate] = useState<Date>(INITIAL_ANCHOR_DATE);
  const [selectedDayKey, setSelectedDayKey] = useState<string | undefined>(undefined);

  const energyLookup = buildEnergyLookup(MOCK_ENERGY_DAYS);
  const weekDays = getWeekDays(anchorDate, energyLookup, MOCK_TODAY);
  const monthDays = getMonthDays(anchorDate, energyLookup, MOCK_TODAY);
  const visibleDays = view === 'week' ? weekDays : monthDays.filter((day) => day.isCurrentMonth);
  const summary = summarizePeriod(visibleDays);
  const periodLabel =
    view === 'week' ? formatWeekRange(startOfWeek(anchorDate), endOfWeek(anchorDate)) : formatMonthYear(anchorDate);

  function handleNavigate(step: -1 | 1) {
    setSelectedDayKey(undefined);
    setAnchorDate((current) => (view === 'week' ? addDays(current, step * 7) : addMonths(current, step)));
  }

  return (
    <main className="app-shell">
      <section className="dashboard-card">
        <div className="eyebrow">Customer energy portal</div>
        <div className="header-row">
          <div>
            <h1>Energy Breakdown</h1>
            <p className="subtitle">Track usage patterns over time with a clean weekly and monthly calendar.</p>
          </div>
          <ViewToggle value={view} onChange={setView} />
        </div>

        <PeriodNavigator label={periodLabel} onPrevious={() => handleNavigate(-1)} onNext={() => handleNavigate(1)} />

        <EnergySummary summary={summary} />

        {view === 'week' ? (
          <WeeklyCalendar days={weekDays} selectedKey={selectedDayKey} onSelect={setSelectedDayKey} />
        ) : (
          <MonthlyCalendar days={monthDays} selectedKey={selectedDayKey} onSelect={setSelectedDayKey} />
        )}
      </section>
    </main>
  );
}

export default App;
