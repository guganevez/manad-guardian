import { useState, useMemo } from 'react';
import { RecordK250, RecordK050, RecordK100, MANADFile } from '@/lib/manad-parser';
import { InspectorPanel } from './InspectorPanel';

interface SyntheticViewProps {
  file: MANADFile;
}

export function SyntheticView({ file }: SyntheticViewProps) {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [periodFilter, setPeriodFilter] = useState('');
  const [selectedRaw, setSelectedRaw] = useState<string | null>(null);

  const workerMap = useMemo(() => {
    const map = new Map<string, string>();
    file.workers.forEach(w => map.set(w.employeeCode, w.name));
    return map;
  }, [file.workers]);

  const deptMap = useMemo(() => {
    const map = new Map<string, string>();
    file.departments.forEach(d => map.set(d.departmentCode, d.departmentName));
    return map;
  }, [file.departments]);

  const periods = useMemo(() => {
    const set = new Set<string>();
    file.syntheticData.forEach(r => set.add(r.period));
    return Array.from(set).sort();
  }, [file.syntheticData]);

  const filtered = useMemo(() => {
    return file.syntheticData.filter((r) => {
      if (deptFilter && r.departmentCode !== deptFilter) return false;
      if (periodFilter && r.period !== periodFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const workerName = workerMap.get(r.employeeCode) || '';
        if (!workerName.toLowerCase().includes(q) && !r.employeeCode.includes(q) && !r.role.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [file.syntheticData, deptFilter, periodFilter, search, workerMap]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border flex gap-3 items-center flex-wrap">
        <input
          type="text"
          placeholder="Buscar funcionário..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-surface border border-border rounded-sm px-3 py-1.5 font-mono text-audit-sm text-foreground placeholder:text-muted-foreground max-w-xs outline-none focus:border-primary/50 transition-colors duration-150"
        />
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="bg-surface border border-border rounded-sm px-3 py-1.5 font-mono text-audit-sm text-foreground outline-none focus:border-primary/50 transition-colors duration-150"
        >
          <option value="">TODOS DEPTOS</option>
          {file.departments.map((d) => (
            <option key={d.departmentCode} value={d.departmentCode}>
              {d.departmentCode} - {d.departmentName}
            </option>
          ))}
        </select>
        <select
          value={periodFilter}
          onChange={(e) => setPeriodFilter(e.target.value)}
          className="bg-surface border border-border rounded-sm px-3 py-1.5 font-mono text-audit-sm text-foreground outline-none focus:border-primary/50 transition-colors duration-150"
        >
          <option value="">TODOS PERÍODOS</option>
          {periods.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <span className="font-mono text-audit-xs text-muted-foreground ml-auto">
          {filtered.length.toLocaleString('pt-BR')} registros
        </span>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-background z-10">
            <tr className="border-b border-border">
              <th className="audit-label text-left p-2">MOV</th>
              <th className="audit-label text-left p-2">DEPTO</th>
              <th className="audit-label text-left p-2">CÓD</th>
              <th className="audit-label text-left p-2">FUNCIONÁRIO</th>
              <th className="audit-label text-left p-2">PERÍODO</th>
              <th className="audit-label text-left p-2">CARGO</th>
              <th className="audit-label text-right p-2">BASE</th>
              <th className="audit-label text-right p-2">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 500).map((r, i) => (
              <tr
                key={i}
                onClick={() => setSelectedRaw(r.rawLine)}
                className="border-b border-border/50 hover:bg-accent/30 cursor-pointer transition-colors duration-150"
                style={{ borderLeft: '2px solid hsl(var(--manad-blockK))' }}
              >
                <td className="font-mono text-audit-sm p-2 text-muted-foreground">{r.movement}</td>
                <td className="font-mono text-audit-sm p-2 text-muted-foreground" title={deptMap.get(r.departmentCode)}>
                  {r.departmentCode}
                </td>
                <td className="font-mono text-audit-sm p-2 text-muted-foreground">{r.employeeCode}</td>
                <td className="font-mono text-audit-sm p-2 text-foreground">
                  {workerMap.get(r.employeeCode) || r.employeeCode}
                </td>
                <td className="font-mono text-audit-sm p-2 text-muted-foreground">{r.period}</td>
                <td className="font-mono text-audit-sm p-2 text-muted-foreground truncate max-w-[200px]">{r.role}</td>
                <td className="font-mono text-audit-sm p-2 text-right text-foreground">R$ {r.baseValue}</td>
                <td className="font-mono text-audit-sm p-2 text-right text-primary">R$ {r.totalValue}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length > 500 && (
          <div className="p-4 text-center">
            <span className="font-mono text-audit-xs text-muted-foreground">
              Exibindo 500 de {filtered.length.toLocaleString('pt-BR')} registros. Use os filtros para refinar.
            </span>
          </div>
        )}
      </div>

      {selectedRaw && <InspectorPanel rawLine={selectedRaw} onClose={() => setSelectedRaw(null)} />}
    </div>
  );
}
