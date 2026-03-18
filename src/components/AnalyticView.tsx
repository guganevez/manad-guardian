import { useState, useMemo } from 'react';
import { MANADFile, getIndFlLabel, IND_RUBR_LABELS, IND_BASE_IRRF_LABELS, IND_BASE_PS_LABELS } from '@/lib/manad-parser';
import { InspectorPanel } from './InspectorPanel';

interface AnalyticViewProps {
  file: MANADFile;
}

export function AnalyticView({ file }: AnalyticViewProps) {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [periodFilter, setPeriodFilter] = useState('');
  const [eventFilter, setEventFilter] = useState('');
  const [indFlFilter, setIndFlFilter] = useState('');
  const [indRubrFilter, setIndRubrFilter] = useState('');
  const [selectedRaw, setSelectedRaw] = useState<string | null>(null);

  const workerMap = useMemo(() => {
    const map = new Map<string, string>();
    file.workers.forEach(w => map.set(w.employeeCode, w.name));
    return map;
  }, [file.workers]);

  const eventMap = useMemo(() => {
    const map = new Map<string, string>();
    file.events.forEach(e => map.set(e.eventCode, e.eventName));
    return map;
  }, [file.events]);

  const periods = useMemo(() => {
    const set = new Set<string>();
    file.analyticData.forEach(r => set.add(r.period));
    return Array.from(set).sort();
  }, [file.analyticData]);

  const indFlValues = useMemo(() => {
    const set = new Set<string>();
    file.analyticData.forEach(r => set.add(r.indFl));
    return Array.from(set).sort();
  }, [file.analyticData]);

  const filtered = useMemo(() => {
    return file.analyticData.filter((r) => {
      if (deptFilter && r.departmentCode !== deptFilter) return false;
      if (periodFilter && r.period !== periodFilter) return false;
      if (eventFilter && r.eventCode !== eventFilter) return false;
      if (indFlFilter && r.indFl !== indFlFilter) return false;
      if (indRubrFilter && r.indRubr !== indRubrFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const name = workerMap.get(r.employeeCode) || '';
        if (!name.toLowerCase().includes(q) && !r.employeeCode.includes(q)) return false;
      }
      return true;
    });
  }, [file.analyticData, deptFilter, periodFilter, eventFilter, indFlFilter, indRubrFilter, search, workerMap]);

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
        <select
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          className="bg-surface border border-border rounded-sm px-3 py-1.5 font-mono text-audit-sm text-foreground outline-none focus:border-primary/50 transition-colors duration-150"
        >
          <option value="">TODOS EVENTOS</option>
          {file.events.map((e) => (
            <option key={e.eventCode} value={e.eventCode}>
              {e.eventCode} - {e.eventName}
            </option>
          ))}
        </select>
        <select
          value={indFlFilter}
          onChange={(e) => setIndFlFilter(e.target.value)}
          className="bg-surface border border-border rounded-sm px-3 py-1.5 font-mono text-audit-sm text-foreground outline-none focus:border-primary/50 transition-colors duration-150"
        >
          <option value="">TODAS FOLHAS</option>
          {indFlValues.map((v) => (
            <option key={v} value={v}>{v} - {getIndFlLabel(v)}</option>
          ))}
        </select>
        <select
          value={indRubrFilter}
          onChange={(e) => setIndRubrFilter(e.target.value)}
          className="bg-surface border border-border rounded-sm px-3 py-1.5 font-mono text-audit-sm text-foreground outline-none focus:border-primary/50 transition-colors duration-150"
        >
          <option value="">TODOS TIPOS</option>
          <option value="P">P - Provento</option>
          <option value="D">D - Desconto</option>
          <option value="O">O - Outros</option>
        </select>
        <span className="font-mono text-audit-xs text-muted-foreground ml-auto">
          {filtered.length.toLocaleString('pt-BR')} registros
        </span>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-background z-10">
            <tr className="border-b border-border">
              <th className="audit-label text-left p-2">FOLHA</th>
              <th className="audit-label text-left p-2">DEPTO</th>
              <th className="audit-label text-left p-2">CÓD</th>
              <th className="audit-label text-left p-2">FUNCIONÁRIO</th>
              <th className="audit-label text-left p-2">PERÍODO</th>
              <th className="audit-label text-left p-2">EVENTO</th>
              <th className="audit-label text-right p-2">VALOR</th>
              <th className="audit-label text-left p-2">RUBRICA</th>
              <th className="audit-label text-left p-2">BASE IRRF</th>
              <th className="audit-label text-left p-2">BASE PS</th>
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
                <td className="font-mono text-audit-xs p-2 text-muted-foreground" title={getIndFlLabel(r.indFl)}>
                  {r.indFl}
                </td>
                <td className="font-mono text-audit-sm p-2 text-muted-foreground">{r.departmentCode}</td>
                <td className="font-mono text-audit-sm p-2 text-muted-foreground">{r.employeeCode}</td>
                <td className="font-mono text-audit-sm p-2 text-foreground">
                  {workerMap.get(r.employeeCode) || r.employeeCode}
                </td>
                <td className="font-mono text-audit-sm p-2 text-muted-foreground">{r.period}</td>
                <td className="font-mono text-audit-sm p-2 text-muted-foreground" title={eventMap.get(r.eventCode)}>
                  {r.eventCode}
                </td>
                <td className="font-mono text-audit-sm p-2 text-right text-primary">R$ {r.value}</td>
                <td className="font-mono text-audit-xs p-2">
                  <span className={
                    r.indRubr === 'P' ? 'text-primary' :
                    r.indRubr === 'D' ? 'text-destructive' :
                    'text-muted-foreground'
                  }>
                    {IND_RUBR_LABELS[r.indRubr] || r.indRubr}
                  </span>
                </td>
                <td className="font-mono text-audit-xs p-2 text-muted-foreground" title={IND_BASE_IRRF_LABELS[r.indBaseIRRF]}>
                  {r.indBaseIRRF}
                </td>
                <td className="font-mono text-audit-xs p-2 text-muted-foreground" title={IND_BASE_PS_LABELS[r.indBasePS]}>
                  {r.indBasePS}
                </td>
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