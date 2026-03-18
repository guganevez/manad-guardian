import { useState, useRef, useEffect } from 'react';

interface MultiSelectFilterProps {
  label: string;
  options: { value: string; label: string }[];
  selected: Set<string>;
  onChange: (selected: Set<string>) => void;
}

export function MultiSelectFilter({ label, options, selected, onChange }: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggle = (value: string) => {
    const next = new Set(selected);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onChange(next);
  };

  const activeCount = selected.size;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-sm border border-border bg-surface px-3 py-1.5 font-mono text-audit-sm text-foreground outline-none transition-colors duration-150 hover:border-primary/50"
      >
        <span>{label}</span>
        {activeCount > 0 && (
          <span className="rounded-sm bg-primary/20 px-1.5 py-0.5 text-audit-xs text-primary">
            {activeCount}
          </span>
        )}
        <svg className="h-3 w-3 text-muted-foreground" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
          <path d={open ? 'M2 8L6 4L10 8' : 'M2 4L6 8L10 4'} />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[220px] rounded-sm border border-border bg-popover shadow-md">
          <div className="border-b border-border p-2">
            <button
              type="button"
              onClick={() => onChange(new Set())}
              className="font-mono text-audit-xs text-muted-foreground hover:text-foreground"
            >
              LIMPAR SELEÇÃO
            </button>
          </div>
          <div className="max-h-[200px] overflow-auto p-1">
            {options.map((opt) => (
              <label
                key={opt.value}
                className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 transition-colors hover:bg-accent/30"
              >
                <input
                  type="checkbox"
                  checked={selected.has(opt.value)}
                  onChange={() => toggle(opt.value)}
                  className="h-3.5 w-3.5 rounded-sm border border-primary accent-primary"
                />
                <span className="font-mono text-audit-xs text-foreground">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
