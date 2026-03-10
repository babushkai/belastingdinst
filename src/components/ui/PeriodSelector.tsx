export interface PeriodSelectorProps {
  years: number[];
  selectedYear: number;
  selectedQuarter: number;
  availableQuarters: number[];
  lockedKeys: Set<string>;
  onYearChange: (year: number) => void;
  onQuarterChange: (quarter: number) => void;
}

function LockIcon() {
  return (
    <svg
      className="inline-block h-3 w-3"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function PeriodSelector({
  years,
  selectedYear,
  selectedQuarter,
  availableQuarters,
  lockedKeys,
  onYearChange,
  onQuarterChange,
}: PeriodSelectorProps) {
  return (
    <div className="flex items-center gap-4">
      {/* Year pills */}
      <div className="flex min-w-0 gap-1 overflow-x-auto">
        {years.map((y) => (
          <button
            key={y}
            type="button"
            onClick={() => onYearChange(y)}
            className={`shrink-0 border border-black px-2 py-1 text-xs ${
              y === selectedYear
                ? "bg-black text-white"
                : "bg-white text-black hover:bg-gray-100"
            }`}
          >
            {y}
          </button>
        ))}
      </div>

      {/* Quarter segmented control */}
      <div className="inline-flex border border-black">
        {([1, 2, 3, 4] as const).map((q) => {
          const isAvailable = availableQuarters.includes(q);
          const isSelected = q === selectedQuarter;
          const isLocked = lockedKeys.has(`${selectedYear}-${q}`);

          let className =
            "px-3 py-1 text-xs border-r border-black last:border-r-0";

          if (!isAvailable) {
            className += " bg-gray-100 text-gray-400";
          } else if (isSelected && isLocked) {
            className += " bg-black text-green-400";
          } else if (isSelected) {
            className += " bg-black text-white";
          } else if (isLocked) {
            className += " bg-white text-green-700 hover:bg-gray-100";
          } else {
            className += " bg-white text-black hover:bg-gray-100";
          }

          return (
            <button
              key={q}
              type="button"
              disabled={!isAvailable}
              onClick={() => onQuarterChange(q)}
              className={className}
            >
              Q{q}
              {isLocked && (
                <span className="ml-1">
                  <LockIcon />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
