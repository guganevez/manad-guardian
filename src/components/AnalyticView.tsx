import { useState, useMemo } from 'react';
import { MANADFile, getIndFlLabel, IND_RUBR_LABELS, IND_BASE_IRRF_LABELS, IND_BASE_PS_LABELS } from '@/lib/manad-parser';
import { InspectorPanel } from './InspectorPanel';
import { MultiSelectFilter } from './MultiSelectFilter';

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
  const [indBaseIRRFFilter, setIndBaseIRRFFilter] = useState('');
  const [indBasePSFilter, setIndBasePSFilter] = useState('');
  const [selectedRaw, setSelectedRaw] = useState<string | null>(null);

  const workerMap = useMemo(() => {
    const map = new Map<string, string>();
    file.workers.forEach((worker) => map.set(worker.employeeCode, worker.name));
    return map;
  }, [file.workers]);

  const eventMap = useMemo(() => {
    const map = new Map<string, string>();
    file.events.forEach((event) => map.set(event.eventCode, event.eventName));
    return map;
  }, [file.events]);

  const periods = useMemo(() => {
    const values = new Set<string>();
    file.analyticData.forEach((record) => values.add(record.period));
    return Array.from(values).sort();
  }, [file.analyticData]);

  const indFlValues = useMemo(() => {
    const values = new Set<string>();
    file.analyticData.forEach((record) => values.add(record.indFl));
    return Array.from(values).sort();
  }, [file.analyticData]);

  const indBaseIRRFValues = useMemo(() => {
    const values = new Set<string>();
    file.analyticData.forEach((record) => {
      if (record.indBaseIRRF) values.add(record.indBaseIRRF);
    });
    return Array.from(values).sort();
  }, [file.analyticData]);

  const indBasePSValues = useMemo(() => {
    const values = new Set<string>();
    file.analyticData.forEach((record) => {
      if (record.indBasePS) values.add(record.indBasePS);
    });
    return Array.from(values).sort();
  }, [file.analyticData]);

  const filtered = useMemo(() => {
    return file.analyticData.filter((record) => {
      if (deptFilter && record.departmentCode !== deptFilter) return false;
      if (periodFilter && record.period !== periodFilter) return false;
      if (eventFilter && record.eventCode !== eventFilter) return false;
      if (indFlFilter && record.indFl !== indFlFilter) return false;
      if (indRubrFilter && record.indRubr !== indRubrFilter) return false;
      if (indBaseIRRFFilter && record.indBaseIRRF !== indBaseIRRFFilter) return false;
      if (indBasePSFilter && record.indBasePS !== indBasePSFilter) return false;

      if (search) {
        const query = search.toLowerCase();
        const name = workerMap.get(record.employeeCode) || '';
        if (!name.toLowerCase().includes(query) && !record.employeeCode.includes(query)) return false;
      }

      return true;
    });
  }, [
    file.analyticData,
    deptFilter,
    periodFilter,
    eventFilter,
    indFlFilter,
    indRubrFilter,
    indBaseIRRFFilter,
    indBasePSFilter,
    search,
    workerMap,
  ]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-border p-3">
        <input
          type="text"
          placeholder="Buscar funcionário..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="max-w-xs rounded-sm border border-border bg-surface px-3 py-1.5 font-mono text-audit-sm text-foreground outline-none transition-colors duration-150 placeholder:text-muted-foreground focus:border-primary/50"
        />
        <select
          value={deptFilter}
          onChange={(event) => setDeptFilter(event.target.value)}
          className="rounded-sm border border-border bg-surface px-3 py-1.5 font-mono text-audit-sm text-foreground outline-none transition-colors duration-150 focus:border-primary/50"
        >
          <option value="">TODOS DEPTOS</option>
          {file.departments.map((department) => (
            <option key={department.departmentCode} value={department.departmentCode}>
              {department.departmentCode} - {department.departmentName}
            </option>
          ))}
        </select>
        <select
          value={periodFilter}
          onChange={(event) => setPeriodFilter(event.target.value)}
          className="rounded-sm border border-border bg-surface px-3 py-1.5 font-mono text-audit-sm text-foreground outline-none transition-colors duration-150 focus:border-primary/50"
        >
          <option value="">TODOS PERÍODOS</option>
          {periods.map((period) => (
            <option key={period} value={period}>
              {period}
            </option>
          ))}
        </select>
        <select
          value={eventFilter}
          onChange={(event) => setEventFilter(event.target.value)}
          className="rounded-sm border border-border bg-surface px-3 py-1.5 font-mono text-audit-sm text-foreground outline-none transition-colors duration-150 focus:border-primary/50"
        >
          <option value="">TODOS EVENTOS</option>
          {file.events.map((event) => (
            <option key={event.eventCode} value={event.eventCode}>
              {event.eventCode} - {event.eventName}
            </option>
          ))}
        </select>
        <select
          value={indFlFilter}
          onChange={(event) => setIndFlFilter(event.target.value)}
          className="rounded-sm border border-border bg-surface px-3 py-1.5 font-mono text-audit-sm text-foreground outline-none transition-colors duration-150 focus:border-primary/50"
        >
          <option value="">TODAS FOLHAS</option>
          {indFlValues.map((value) => (
            <option key={value} value={value}>
              {value} - {getIndFlLabel(value)}
            </option>
          ))}
        </select>
        <select
          value={indRubrFilter}
          onChange={(event) => setIndRubrFilter(event.target.value)}
          className="rounded-sm border border-border bg-surface px-3 py-1.5 font-mono text-audit-sm text-foreground outline-none transition-colors duration-150 focus:border-primary/50"
        >
          <option value="">TODAS RUBRICAS</option>
          <option value="P">P - Provento</option>
          <option value="D">D - Desconto</option>
          <option value="O">O - Outros</option>
        </select>
        <select
          value={indBaseIRRFFilter}
          onChange={(event) => setIndBaseIRRFFilter(event.target.value)}
          className="rounded-sm border border-border bg-surface px-3 py-1.5 font-mono text-audit-sm text-foreground outline-none transition-colors duration-150 focus:border-primary/50"
        >
          <option value="">BASE IRRF</option>
          {indBaseIRRFValues.map((value) => (
            <option key={value} value={value}>
              {value} - {IND_BASE_IRRF_LABELS[value] || 'Indicador não mapeado'}
            </option>
          ))}
        </select>
        <select
          value={indBasePSFilter}
          onChange={(event) => setIndBasePSFilter(event.target.value)}
          className="rounded-sm border border-border bg-surface px-3 py-1.5 font-mono text-audit-sm text-foreground outline-none transition-colors duration-150 focus:border-primary/50"
        >
          <option value="">BASE PS</option>
          {indBasePSValues.map((value) => (
            <option key={value} value={value}>
              {value} - {IND_BASE_PS_LABELS[value] || 'Indicador não mapeado'}
            </option>
          ))}
        </select>
        <span className="ml-auto font-mono text-audit-xs text-muted-foreground">
          {filtered.length.toLocaleString('pt-BR')} registros
        </span>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 z-10 bg-background">
            <tr className="border-b border-border">
              <th className="audit-label p-2 text-left">FOLHA</th>
              <th className="audit-label p-2 text-left">DEPTO</th>
              <th className="audit-label p-2 text-left">CÓD</th>
              <th className="audit-label p-2 text-left">FUNCIONÁRIO</th>
              <th className="audit-label p-2 text-left">PERÍODO</th>
              <th className="audit-label p-2 text-left">EVENTO</th>
              <th className="audit-label p-2 text-right">VALOR</th>
              <th className="audit-label p-2 text-left">RUBRICA</th>
              <th className="audit-label p-2 text-left">BASE IRRF</th>
              <th className="audit-label p-2 text-left">BASE PS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 500).map((record, index) => (
              <tr
                key={`${record.eventCode}-${index}`}
                onClick={() => setSelectedRaw(record.rawLine)}
                className="cursor-pointer border-b border-border/50 transition-colors duration-150 hover:bg-accent/30"
                style={{ borderLeft: '2px solid hsl(var(--manad-blockK))' }}
              >
                <td className="p-2 font-mono text-audit-xs text-muted-foreground" title={getIndFlLabel(record.indFl)}>
                  {record.indFl}
                </td>
                <td className="p-2 font-mono text-audit-sm text-muted-foreground">{record.departmentCode}</td>
                <td className="p-2 font-mono text-audit-sm text-muted-foreground">{record.employeeCode}</td>
                <td className="p-2 font-mono text-audit-sm text-foreground">{workerMap.get(record.employeeCode) || record.employeeCode}</td>
                <td className="p-2 font-mono text-audit-sm text-muted-foreground">{record.period}</td>
                <td className="p-2 font-mono text-audit-sm text-muted-foreground" title={eventMap.get(record.eventCode)}>
                  {record.eventCode}
                </td>
                <td className="p-2 text-right font-mono text-audit-sm text-primary">R$ {record.value}</td>
                <td className="p-2 font-mono text-audit-xs">
                  <span className={
                    record.indRubr === 'P' ? 'text-primary' : record.indRubr === 'D' ? 'text-destructive' : 'text-muted-foreground'
                  }>
                    {IND_RUBR_LABELS[record.indRubr] || record.indRubr}
                  </span>
                </td>
                <td className="p-2 font-mono text-audit-xs text-muted-foreground" title={IND_BASE_IRRF_LABELS[record.indBaseIRRF]}>
                  {record.indBaseIRRF}
                </td>
                <td className="p-2 font-mono text-audit-xs text-muted-foreground" title={IND_BASE_PS_LABELS[record.indBasePS]}>
                  {record.indBasePS}
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
