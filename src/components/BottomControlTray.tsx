import type { UsageCalendarView } from '../models/usage';

type BottomControlTrayProps = {
  label: string;
  view: UsageCalendarView;
  onPrevious: () => void;
  onNext: () => void;
  onChangeView: (next: UsageCalendarView) => void;
};

export function BottomControlTray({
  label,
  view,
  onPrevious,
  onNext,
  onChangeView,
}: BottomControlTrayProps) {
  return (
    <section className="bottom-tray" aria-label="Bottom calendar controls">
      <div className="bottom-tray__group bottom-tray__group--period">
        <div className="bottom-tray__caption">Browse period</div>
        <div className="bottom-period-nav">
          <button
            type="button"
            className="bottom-period-nav__button"
            onClick={onPrevious}
            aria-label="Previous period"
          >
            ‹
          </button>
          <div className="bottom-period-nav__label">{label}</div>
          <button type="button" className="bottom-period-nav__button" onClick={onNext} aria-label="Next period">
            ›
          </button>
        </div>
      </div>

      <div className="bottom-tray__group bottom-tray__group--view">
        <div className="bottom-tray__caption">Calendar view</div>
        <div className="bottom-view-toggle" aria-label="Calendar view">
          <button
            type="button"
            className={
              view === 'week' ? 'bottom-view-toggle__button bottom-view-toggle__button--active' : 'bottom-view-toggle__button'
            }
            onClick={() => onChangeView('week')}
          >
            Week
          </button>
          <button
            type="button"
            className={
              view === 'month'
                ? 'bottom-view-toggle__button bottom-view-toggle__button--active'
                : 'bottom-view-toggle__button'
            }
            onClick={() => onChangeView('month')}
          >
            Month
          </button>
        </div>
      </div>
    </section>
  );
}
