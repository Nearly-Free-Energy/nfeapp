type PeriodNavigatorProps = {
  label: string;
  onPrevious: () => void;
  onNext: () => void;
};

export function PeriodNavigator({ label, onPrevious, onNext }: PeriodNavigatorProps) {
  return (
    <div className="period-nav">
      <button type="button" className="period-nav__button" onClick={onPrevious} aria-label="Previous period">
        ‹
      </button>
      <div className="period-nav__label">{label}</div>
      <button type="button" className="period-nav__button" onClick={onNext} aria-label="Next period">
        ›
      </button>
    </div>
  );
}
