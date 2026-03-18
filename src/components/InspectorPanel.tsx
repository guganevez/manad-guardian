interface InspectorPanelProps {
  rawLine: string;
  onClose: () => void;
}

export function InspectorPanel({ rawLine, onClose }: InspectorPanelProps) {
  const fields = rawLine.split('|');

  return (
    <div className="border-t border-border inspector-slide" style={{ backgroundColor: 'hsl(240, 6%, 8%)' }}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="audit-label">INSPECTOR — LINHA RAW</div>
        <button
          onClick={onClose}
          className="font-mono text-audit-xs text-muted-foreground hover:text-foreground transition-colors duration-150"
        >
          [X]
        </button>
      </div>
      <div className="p-4 overflow-x-auto">
        <div className="font-mono text-audit-sm text-foreground whitespace-nowrap">
          {fields.map((field, i) => (
            <span key={i}>
              {i > 0 && <span className="text-muted-foreground mx-1">|</span>}
              <span className="hover:bg-primary/10 px-0.5 rounded-sm cursor-default" title={`Campo ${i}`}>
                {field || <span className="text-muted-foreground/50">∅</span>}
              </span>
            </span>
          ))}
        </div>
        <div className="audit-label mt-2">{fields.length} CAMPOS</div>
      </div>
    </div>
  );
}
