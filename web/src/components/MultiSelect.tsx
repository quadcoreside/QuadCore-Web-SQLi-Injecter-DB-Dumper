interface Option<T extends string> {
  value: T;
  label: string;
}

interface MultiSelectProps<T extends string> {
  options: Option<T>[];
  selected: T[];
  onChange: (next: T[]) => void;
}

/** Toggleable chip group used for injection-context selection. */
export function MultiSelect<T extends string>({
  options,
  selected,
  onChange,
}: MultiSelectProps<T>) {
  const toggle = (value: T) => {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value],
    );
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const on = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(opt.value)}
            className={`rounded-md border px-2.5 py-1.5 font-mono text-xs transition-all ${
              on
                ? "border-accent/50 bg-accent/15 text-accent shadow-glow"
                : "border-line bg-raised/60 text-muted hover:border-accent/30 hover:text-ink"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
