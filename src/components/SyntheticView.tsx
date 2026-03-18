import { useState, useMemo } from 'react';
import { MANADFile, RecordK250, getIndFlLabel } from '@/lib/manad-parser';
import { InspectorPanel } from './InspectorPanel';
import { K250LinkedItemsPanel } from './K250LinkedItemsPanel';

interface SyntheticViewProps {
  file: MANADFile;
}

export function SyntheticView({ file }: SyntheticViewProps) {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [periodFilter, setPeriodFilter] = useState('');
  const [indFlFilter, setIndFlFilter] = useState('');
  const [selectedK250, setSelectedK250] = useState<RecordK250 | null>(null);
  const [selectedRaw, setSelectedRaw] = useState<string | null>(null);

  const workerMap = useMemo(() => {
    const map = new Map<string, string>();
    file.workers.forEach((worker) => map.set(worker.employeeCode, worker.name));
    return map;
  }, [file.workers]);

  const deptMap = useMemo(() => {
    const map = new Map<string, string>();
    file.departments.forEach((department) => map.set(department.departmentCode, department.departmentName));
    return map;
  }, [file.departments]);

  const eventMap = useMemo(() => {
    const map = new Map<string, string>();
    file.events.forEach((event) => map.set(event.eventCode, event.eventName));
    return map;
  }, [file.events]);

  const periods = useMemo(() => {
    const values = new Set<string>();
    file.syntheticData.forEach((record) => values.add(record.period));
    return Array.from(values).sort();
  }, [file.syntheticData]);

  const indFlValues = useMemo(() => {
    const values = new Set<string>();
    file.syntheticData.forEach((record) => values.add(record.indFl));
    return Array.from(values).sort();
  }, [file.syntheticData]);

  const filtered = useMemo(() => {
    return file.syntheticData.filter((record) => {
      if (deptFilter && record.departmentCode !== deptFilter) return false;
      if (periodFilter && record.period !== periodFilter) return false;
      if (indFlFilter && record.indFl !== indFlFilter) return false;

      if (search) {
        const query = search.toLowerCase();
        const workerName = workerMap.get(record.employeeCode) || '';
        if (!workerName.toLowerCase().includes(query) && !record.employeeCode.includes(query) && !record.role.toLowerCase().includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [file.syntheticData, deptFilter, periodFilter, indFlFilter, search, workerMap]);

  const linkedK300Items = useMemo(() => {
    if (!selectedK250) return [];

    return file.analyticData
      .filter(
        (record) =>
          record.employeeCode === selectedK250.employeeCode &&
          record.departmentCode === selectedK250.departmentCode &&
          record.period === selectedK250.period &&
          record.indFl === selectedK250.indFl,
      )
      .sort((first, second) => first.eventCode.localeCompare(second.eventCode));
  }, [selectedK250, file.analyticData]);

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
              <th className="audit-label p-2 text-left">CARGO</th>
              <th className="audit-label p-2 text-right">BASE IRRF</th>
              <th className="audit-label p-2 text-right">BASE PS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 500).map((record, index) => {
              const isSelected = selectedK250?.rawLine === record.rawLine;

              return (
                <tr
                  key={`${record.employeeCode}-${record.period}-${index}`}
                  onClick={() => setSelectedK250((current) => (current?.rawLine === record.rawLine ? null : record))}
                  className={`cursor-pointer border-b border-border/50 transition-colors duration-150 ${
                    isSelected ? 'bg-accent/40 hover:bg-accent/50' : 'hover:bg-accent/30'
                  }`}
                  style={{ borderLeft: '2px solid hsl(var(--manad-blockK))' }}
                >
                  <td className="p-2 font-mono text-audit-xs text-muted-foreground" title={getIndFlLabel(record.indFl)}>
                    {record.indFl} - {getIndFlLabel(record.indFl)}
                  </td>
                  <td className="p-2 font-mono text-audit-sm text-muted-foreground" title={deptMap.get(record.departmentCode)}>
                    {record.departmentCode}
                  </td>
                  <td className="p-2 font-mono text-audit-sm text-muted-foreground">{record.employeeCode}</td>
                  <td className="p-2 font-mono text-audit-sm text-foreground">{workerMap.get(record.employeeCode) || record.employeeCode}</td>
                  <td className="p-2 font-mono text-audit-sm text-muted-foreground">{record.period}</td>
                  <td className="max-w-[200px] truncate p-2 font-mono text-audit-sm text-muted-foreground">{record.role}</td>
                  <td className="p-2 text-right font-mono text-audit-sm text-foreground">R$ {record.vlBaseIRRF}</td>
                  <td className="p-2 text-right font-mono text-audit-sm text-primary">R$ {record.vlBasePS}</td>
                </tr>
              );
            })}
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

      {selectedK250 && (
        <K250LinkedItemsPanel
          selectedRecord={selectedK250}
          linkedRecords={linkedK300Items}
          workerName={workerMap.get(selectedK250.employeeCode) || selectedK250.employeeCode}
          departmentName={deptMap.get(selectedK250.departmentCode)}
          eventMap={eventMap}
          onClose={() => setSelectedK250(null)}
          onInspectRaw={(rawLine) => setSelectedRaw(rawLine)}
        />
      )}

      {selectedRaw && <InspectorPanel rawLine={selectedRaw} onClose={() => setSelectedRaw(null)} />}
    </div>
  );
}
