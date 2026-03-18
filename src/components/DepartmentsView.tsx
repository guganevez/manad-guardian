import { useState, useMemo } from 'react';
import { RecordK100 } from '@/lib/manad-parser';
import { InspectorPanel } from './InspectorPanel';

interface DepartmentsViewProps {
  departments: RecordK100[];
}

export function DepartmentsView({ departments }: DepartmentsViewProps) {
  const [search, setSearch] = useState('');
  const [selectedRaw, setSelectedRaw] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search) return departments;
    const q = search.toLowerCase();
    return departments.filter(d =>
      d.departmentName.toLowerCase().includes(q) ||
      d.departmentCode.includes(q)
    );
  }, [departments, search]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border flex gap-3 items-center">
        <input
          type="text"
          placeholder="Buscar departamento..."
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
              <th className="audit-label text-left p-2">CÓDIGO</th>
              <th className="audit-label text-left p-2">DEPARTAMENTO</th>
              <th className="audit-label text-left p-2">CNPJ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d, i) => (
              <tr
                key={i}
                onClick={() => setSelectedRaw(d.rawLine)}
                className="border-b border-border/50 hover:bg-accent/30 cursor-pointer transition-colors duration-150"
              >
                <td className="font-mono text-audit-sm p-2 text-muted-foreground">{d.departmentCode}</td>
                <td className="font-mono text-audit-sm p-2 text-foreground">{d.departmentName}</td>
                <td className="font-mono text-audit-sm p-2 text-muted-foreground">{d.cnpj}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedRaw && <InspectorPanel rawLine={selectedRaw} onClose={() => setSelectedRaw(null)} />}
    </div>
  );
}
