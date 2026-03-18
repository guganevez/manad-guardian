import { useState, useMemo } from 'react';
import { RecordK150 } from '@/lib/manad-parser';
import { InspectorPanel } from './InspectorPanel';

interface EventsViewProps {
  events: RecordK150[];
}

export function EventsView({ events }: EventsViewProps) {
  const [search, setSearch] = useState('');
  const [selectedRaw, setSelectedRaw] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search) return events;
    const q = search.toLowerCase();
    return events.filter(e =>
      e.eventName.toLowerCase().includes(q) ||
      e.eventCode.includes(q)
    );
  }, [events, search]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border flex gap-3 items-center">
        <input
          type="text"
          placeholder="Buscar evento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-surface border border-border rounded-sm px-3 py-1.5 font-mono text-audit-sm text-foreground placeholder:text-muted-foreground flex-1 max-w-sm outline-none focus:border-primary/50 transition-colors duration-150"
        />
        <span className="font-mono text-audit-xs text-muted-foreground ml-auto">
          {filtered.length} registros
        </span>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-background z-10">
            <tr className="border-b border-border">
              <th className="audit-label text-left p-2 w-20">CÓDIGO</th>
              <th className="audit-label text-left p-2">EVENTO</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e, i) => (
              <tr
                key={i}
                onClick={() => setSelectedRaw(e.rawLine)}
                className="border-b border-border/50 hover:bg-accent/30 cursor-pointer transition-colors duration-150"
              >
                <td className="font-mono text-audit-sm p-2 text-muted-foreground">{e.eventCode}</td>
                <td className="font-mono text-audit-sm p-2 text-foreground">{e.eventName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedRaw && <InspectorPanel rawLine={selectedRaw} onClose={() => setSelectedRaw(null)} />}
    </div>
  );
}
